import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  mapDynamicGlitchRow,
  requireAdminUser
} from "@/lib/supabase/server";
import { GLITCHES_DATA } from "@/server/data/glitches";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const upsertGlitchSchema = z.object({
  id: z.string().trim().regex(ID_PATTERN).optional(),
  category: z.enum(["Money", "Camera", "Stealth", "Physics"]).optional(),
  isPatched: z.boolean(),
  patchStatus: z.string().max(160).optional(),
  titleEn: z.string().max(240).optional(),
  titleEs: z.string().max(240).optional(),
  stepsEn: z.array(z.string().max(600)).max(20).optional(),
  stepsEs: z.array(z.string().max(600)).max(20).optional(),
  warningEn: z.string().max(600).optional(),
  warningEs: z.string().max(600).optional()
});

function sanitizeSteps(steps: string[] | undefined): string[] | undefined {
  if (!steps) return undefined;
  return steps.map((s) => sanitizePlainText(s, 500)).filter((s) => s.length > 0);
}

function existingStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const rl = checkRateLimit(`admin-glitches:${user.id}`, 120, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many admin actions; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = upsertGlitchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid glitch payload.");
    }

    const input = parsed.data;
    const rawTextFields = [
      input.patchStatus,
      input.titleEn,
      input.titleEs,
      input.warningEn,
      input.warningEs,
      ...(input.stepsEn ?? []),
      ...(input.stepsEs ?? [])
    ].filter((v): v is string => typeof v === "string");

    if (rawTextFields.some((val) => containsDisallowedMarkup(val))) {
      return apiError("INVALID_INPUT", 400, "Glitch fields may not contain HTML or script markup.");
    }

    const glitchId = input.id || `g_${crypto.randomUUID().slice(0, 8)}`;
    const seedMatch = GLITCHES_DATA.find((g) => g.id === glitchId);

    const { data: existingRow, error: existingErr } = await supabase
      .from("vicelink_dynamic_glitches")
      .select("*")
      .eq("id", glitchId)
      .maybeSingle();
    if (existingErr) throw existingErr;

    const category = input.category ?? existingRow?.category ?? seedMatch?.category;
    if (!category) {
      return apiError("INVALID_INPUT", 400, "Category is required when creating a new glitch.");
    }

    const cleanTitleEn = input.titleEn !== undefined ? sanitizePlainText(input.titleEn, 180) : "";
    const cleanTitleEs = input.titleEs !== undefined ? sanitizePlainText(input.titleEs, 180) : "";

    const titleEn = cleanTitleEn || existingRow?.title_en || seedMatch?.title.en || "";
    const titleEs = cleanTitleEs || existingRow?.title_es || seedMatch?.title.es || "";

    if (titleEn.length < 2 || titleEs.length < 2) {
      return apiError(
        "INVALID_INPUT",
        400,
        "Bilingual EN and ES glitch titles (2+ chars) are required."
      );
    }

    const stepsEn =
      sanitizeSteps(input.stepsEn) ??
      existingStringArray(existingRow?.steps_en) ??
      seedMatch?.steps.en ??
      [];
    const stepsEs =
      sanitizeSteps(input.stepsEs) ??
      existingStringArray(existingRow?.steps_es) ??
      seedMatch?.steps.es ??
      [];

    const warningEn =
      input.warningEn !== undefined
        ? sanitizePlainText(input.warningEn, 500)
        : existingRow?.warning_en ?? seedMatch?.warning.en ?? "";
    const warningEs =
      input.warningEs !== undefined
        ? sanitizePlainText(input.warningEs, 500)
        : existingRow?.warning_es ?? seedMatch?.warning.es ?? "";

    const customPatchStatus =
      input.patchStatus !== undefined ? sanitizePlainText(input.patchStatus, 120) : "";
    const patchStatus =
      customPatchStatus ||
      (input.isPatched ? "PATCHED" : seedMatch?.status.en ?? "WORKING ON PATCH 01.002.001");

    const { data: savedRow, error: upsertErr } = await supabase
      .from("vicelink_dynamic_glitches")
      .upsert(
        {
          id: glitchId,
          category,
          patch_status: patchStatus,
          is_patched: input.isPatched,
          title_en: titleEn,
          title_es: titleEs,
          steps_en: stepsEn,
          steps_es: stepsEs,
          warning_en: warningEn,
          warning_es: warningEs
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (upsertErr) throw upsertErr;

    const { data: voteRows, error: votesErr } = await supabase
      .from("vicelink_glitch_votes")
      .select("user_id")
      .eq("glitch_id", glitchId);
    if (votesErr) throw votesErr;

    const totalVotes = (seedMatch?.votes ?? 0) + (voteRows?.length ?? 0);
    const userVoted = Boolean(voteRows?.some((row) => row.user_id === user.id));

    return apiJson({
      glitch: mapDynamicGlitchRow(savedRow, totalVotes, userVoted)
    });
  } catch (err) {
    return apiError(
      "ADMIN_GLITCH_SAVE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to save dynamic glitch"
    );
  }
}
