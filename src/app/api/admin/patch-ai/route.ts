import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  analyzePatchNotesWithAI,
  applyPatchChanges,
  mapPatchReportRow,
  rollbackPatchChanges,
  validateRockstarSourceUrl
} from "@/lib/admin/patch-ai";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/client";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  loadGlitchVotes,
  mergeDynamicCheats,
  mergeDynamicGlitches,
  recordAdminAuditLog,
  requireAdminAal2
} from "@/lib/supabase/server";
import { CHEATS_DATA } from "@/server/data/cheats";
import { GLITCHES_DATA } from "@/server/data/glitches";
import type {
  KeywordAnalyticsSummary,
  PatchProposedChange,
  PatchReportItem,
  PatchRollbackEntry
} from "@/types/vicelink";

const postPatchSchema = z.object({
  patchVersion: z.string().trim().min(2).max(40),
  sourceUrl: z.string().trim().max(300).optional().default(""),
  rawNotes: z.string().trim().max(8000).optional().default(""),
  fetchFromUrl: z.boolean().optional().default(false),
  autoPublish: z.boolean().optional().default(true)
});

const patchActionSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["publish", "rollback", "reject"])
});

function buildKeywordAnalytics(
  rows: {
    area: string;
    keyword: string;
    result_count: number;
    created_at: string;
  }[]
): KeywordAnalyticsSummary {
  const byKey = new Map<
    string,
    { keyword: string; area: string; searches: number; totalResults: number; lastSearchedAt: string }
  >();
  const byArea = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.area}::${row.keyword}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.searches += 1;
      existing.totalResults += row.result_count;
      if (row.created_at > existing.lastSearchedAt) {
        existing.lastSearchedAt = row.created_at;
      }
    } else {
      byKey.set(key, {
        keyword: row.keyword,
        area: row.area,
        searches: 1,
        totalResults: row.result_count,
        lastSearchedAt: row.created_at
      });
    }
    byArea.set(row.area, (byArea.get(row.area) ?? 0) + 1);
  }

  const aggregated = Array.from(byKey.values()).map((item) => ({
    keyword: item.keyword,
    area: item.area,
    searches: item.searches,
    avgResults: Math.round((item.totalResults / item.searches) * 10) / 10,
    lastSearchedAt: item.lastSearchedAt
  }));

  const topKeywords = [...aggregated]
    .sort((a, b) => b.searches - a.searches || b.lastSearchedAt.localeCompare(a.lastSearchedAt))
    .slice(0, 12);

  const zeroResultGaps = aggregated
    .filter((item) => item.avgResults === 0)
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 10)
    .map(({ keyword, area, searches, lastSearchedAt }) => ({
      keyword,
      area,
      searches,
      lastSearchedAt
    }));

  const areaBreakdown = Array.from(byArea.entries())
    .map(([area, searches]) => ({ area, searches }))
    .sort((a, b) => b.searches - a.searches);

  return {
    totalSearches: rows.length,
    topKeywords,
    areaBreakdown,
    zeroResultGaps
  };
}

async function fetchRockstarNotesSafely(url: string): Promise<string> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "error",
    headers: {
      Accept: "text/html,application/json,text/plain",
      "User-Agent": "ViceLink-PatchMonitor/1.0"
    },
    signal: AbortSignal.timeout(8_000)
  });
  if (!res.ok) {
    throw new Error(`Rockstar URL returned HTTP ${res.status}.`);
  }
  const rawHtml = await res.text();
  const stripped = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return sanitizePlainText(stripped, 5000);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const adminCheck = await requireAdminAal2(supabase, user);
    if (!adminCheck.ok) {
      return apiError(adminCheck.error, adminCheck.status, adminCheck.message, {
        aal: adminCheck.aal,
        setupUrl: adminCheck.setupUrl
      });
    }

    const readClient = isAdminConfigured() ? getSupabaseAdmin() : supabase;

    const [reportsRes, searchesRes] = await Promise.all([
      readClient
        .from("vicelink_patch_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      readClient
        .from("vicelink_keyword_searches")
        .select("area, keyword, result_count, created_at")
        .order("created_at", { ascending: false })
        .limit(500)
    ]);

    if (reportsRes.error) throw reportsRes.error;
    if (searchesRes.error) throw searchesRes.error;

    return apiJson({
      reports: (reportsRes.data ?? []).map(mapPatchReportRow),
      keywordAnalytics: buildKeywordAnalytics(searchesRes.data ?? [])
    });
  } catch (err) {
    return apiError(
      "PATCH_AI_LOAD_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load AI patch reports"
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const adminCheck = await requireAdminAal2(supabase, user);
    if (!adminCheck.ok) {
      return apiError(adminCheck.error, adminCheck.status, adminCheck.message, {
        aal: adminCheck.aal,
        setupUrl: adminCheck.setupUrl
      });
    }
    const admin = adminCheck;

    const rl = checkRateLimit(`admin-patch-ai:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many AI patch scans; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = postPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid patch report request.");
    }

    const input = parsed.data;
    if (
      containsDisallowedMarkup(input.patchVersion) ||
      containsDisallowedMarkup(input.rawNotes) ||
      containsDisallowedMarkup(input.sourceUrl)
    ) {
      return apiError("INVALID_INPUT", 400, "Patch inputs may not contain HTML or script markup.");
    }

    const urlCheck = validateRockstarSourceUrl(input.sourceUrl);
    if (!urlCheck.valid) {
      return apiError("INVALID_URL", 400, urlCheck.reason || "Invalid Rockstar source URL.");
    }

    let effectiveNotes = input.rawNotes;
    let sourceType = urlCheck.normalized ? "rockstar_url_notes" : "manual_paste";

    if (urlCheck.normalized && (input.fetchFromUrl || effectiveNotes.length < 15)) {
      try {
        const fetchedText = await fetchRockstarNotesSafely(urlCheck.normalized);
        effectiveNotes = effectiveNotes
          ? `${effectiveNotes}\n\n[Fetched Source Excerpt]\n${fetchedText}`
          : fetchedText;
        sourceType = "rockstar_url_fetch";
      } catch (err) {
        if (effectiveNotes.length < 10) {
          return apiError(
            "SOURCE_FETCH_FAILED",
            422,
            err instanceof Error
              ? `${err.message} Paste the patch notes text directly to analyze.`
              : "Could not fetch Rockstar source URL; paste patch notes directly."
          );
        }
      }
    }

    if (effectiveNotes.trim().length < 10) {
      return apiError(
        "INVALID_INPUT",
        400,
        "Provide at least 10 characters of Rockstar patch notes or an official fetchable URL."
      );
    }

    const writeClient = isAdminConfigured() ? getSupabaseAdmin() : supabase;

    const [cheatsRes, glitchesRes, votesData] = await Promise.all([
      writeClient.from("vicelink_dynamic_cheats").select("*"),
      writeClient.from("vicelink_dynamic_glitches").select("*"),
      loadGlitchVotes(supabase, user.id)
    ]);

    if (cheatsRes.error) throw cheatsRes.error;
    if (glitchesRes.error) throw glitchesRes.error;

    const existingCheats = mergeDynamicCheats(CHEATS_DATA, cheatsRes.data ?? []);
    const existingGlitches = mergeDynamicGlitches(
      GLITCHES_DATA,
      glitchesRes.data ?? [],
      votesData.voteCounts,
      votesData.userVoted
    );

    const analysis = await analyzePatchNotesWithAI({
      patchVersion: input.patchVersion,
      rawNotes: effectiveNotes,
      sourceUrl: urlCheck.normalized,
      existingGlitches,
      existingCheats
    });

    const shouldAutoPublish =
      input.autoPublish !== false &&
      analysis.confidenceScore >= 85 &&
      analysis.proposedChanges.length > 0;

    let appliedCount = 0;
    let rollbackSnapshot: PatchReportItem["rollbackSnapshot"] = [];
    let status: PatchReportItem["status"] = "draft";
    let appliedAt: string | null = null;

    if (shouldAutoPublish) {
      const applied = await applyPatchChanges(
        writeClient,
        admin.profile.email,
        analysis.proposedChanges
      );
      appliedCount = applied.appliedCount;
      rollbackSnapshot = applied.rollbackSnapshot;
      status = "auto_published";
      appliedAt = new Date().toISOString();
    }

    const { data: insertedRow, error: insertErr } = await writeClient
      .from("vicelink_patch_reports")
      .insert({
        patch_version: sanitizePlainText(input.patchVersion, 40),
        source_url: urlCheck.normalized,
        source_type: sourceType,
        raw_notes: sanitizePlainText(effectiveNotes, 6000),
        ai_summary_en: analysis.aiSummaryEn,
        ai_summary_es: analysis.aiSummaryEs,
        confidence_score: analysis.confidenceScore,
        status,
        proposed_changes: analysis.proposedChanges as unknown as Json,
        rollback_snapshot: rollbackSnapshot as unknown as Json,
        applied_count: appliedCount,
        created_by: admin.profile.email,
        applied_at: appliedAt
      })
      .select("*")
      .single();

    if (insertErr) throw insertErr;

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email,
      actionType: shouldAutoPublish ? "PATCH_AI_AUTO_PUBLISHED" : "PATCH_AI_DRAFT_CREATED",
      targetId: insertedRow.id,
      details: {
        patchVersion: insertedRow.patch_version,
        confidenceScore: analysis.confidenceScore,
        analysisMode: analysis.analysisMode,
        appliedCount
      }
    });

    return apiJson(
      {
        report: mapPatchReportRow(insertedRow),
        analysisMode: analysis.analysisMode
      },
      201
    );
  } catch (err) {
    return apiError(
      "PATCH_AI_SCAN_FAILED",
      500,
      err instanceof Error ? err.message : "AI patch analysis failed"
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const adminCheck = await requireAdminAal2(supabase, user);
    if (!adminCheck.ok) {
      return apiError(adminCheck.error, adminCheck.status, adminCheck.message, {
        aal: adminCheck.aal,
        setupUrl: adminCheck.setupUrl
      });
    }
    const admin = adminCheck;

    const rl = checkRateLimit(`admin-patch-ai-action:${user.id}`, 60, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many patch actions; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = patchActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid patch action payload.");
    }

    const writeClient = isAdminConfigured() ? getSupabaseAdmin() : supabase;
    const { data: existing, error: fetchErr } = await writeClient
      .from("vicelink_patch_reports")
      .select("*")
      .eq("id", parsed.data.reportId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return apiError("NOT_FOUND", 404, "Patch report not found.");
    }

    const proposed = Array.isArray(existing.proposed_changes)
      ? (existing.proposed_changes as unknown as PatchProposedChange[])
      : [];
    const snapshot = Array.isArray(existing.rollback_snapshot)
      ? (existing.rollback_snapshot as unknown as PatchRollbackEntry[])
      : [];

    if (parsed.data.action === "publish") {
      if (existing.status === "published" || existing.status === "auto_published") {
        return apiError("ALREADY_PUBLISHED", 400, "This patch report is already live.");
      }
      const applied = await applyPatchChanges(writeClient, admin.profile.email, proposed);
      const nowIso = new Date().toISOString();
      const { data: updated, error: updErr } = await writeClient
        .from("vicelink_patch_reports")
        .update({
          status: "published",
          rollback_snapshot: applied.rollbackSnapshot as unknown as Json,
          applied_count: applied.appliedCount,
          applied_at: nowIso,
          rolled_back_at: null
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updErr) throw updErr;

      await recordAdminAuditLog(supabase, {
        adminId: user.id,
        adminEmail: admin.profile.email,
        actionType: "PATCH_AI_PUBLISHED",
        targetId: existing.id,
        details: { patchVersion: existing.patch_version, appliedCount: applied.appliedCount }
      });

      return apiJson({ report: mapPatchReportRow(updated) });
    }

    if (parsed.data.action === "rollback") {
      if (existing.status !== "auto_published" && existing.status !== "published") {
        return apiError("CANNOT_ROLLBACK", 400, "Only published patch reports can be rolled back.");
      }
      const restoredCount = await rollbackPatchChanges(writeClient, admin.profile.email, snapshot);
      const nowIso = new Date().toISOString();
      const { data: updated, error: updErr } = await writeClient
        .from("vicelink_patch_reports")
        .update({
          status: "rolled_back",
          rolled_back_at: nowIso
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updErr) throw updErr;

      await recordAdminAuditLog(supabase, {
        adminId: user.id,
        adminEmail: admin.profile.email,
        actionType: "PATCH_AI_ROLLED_BACK",
        targetId: existing.id,
        details: { patchVersion: existing.patch_version, restoredCount }
      });

      return apiJson({ report: mapPatchReportRow(updated), restoredCount });
    }

    // Reject draft
    const { data: updated, error: updErr } = await writeClient
      .from("vicelink_patch_reports")
      .update({ status: "rejected" })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (updErr) throw updErr;

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email,
      actionType: "PATCH_AI_REJECTED",
      targetId: existing.id,
      details: { patchVersion: existing.patch_version }
    });

    return apiJson({ report: mapPatchReportRow(updated) });
  } catch (err) {
    return apiError(
      "PATCH_AI_ACTION_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to execute patch action"
    );
  }
}
