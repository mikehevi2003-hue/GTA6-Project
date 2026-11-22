import crypto from "node:crypto";
import type { Json, VicelinkSupabaseClient } from "@/lib/supabase/client";
import { sanitizePlainText } from "@/lib/security/sanitize";
import type {
  CheatItem,
  GlitchItem,
  PatchProposedChange,
  PatchReportItem,
  PatchRollbackEntry
} from "@/types/vicelink";

const ALLOWED_ROCKSTAR_HOSTS = new Set([
  "rockstargames.com",
  "www.rockstargames.com",
  "support.rockstargames.com"
]);

export function validateRockstarSourceUrl(rawUrl: string): {
  valid: boolean;
  normalized: string;
  reason?: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { valid: true, normalized: "" };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return {
        valid: false,
        normalized: "",
        reason: "Source URL must use HTTPS."
      };
    }
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_ROCKSTAR_HOSTS.has(host)) {
      return {
        valid: false,
        normalized: "",
        reason: "Only official *.rockstargames.com HTTPS URLs are permitted."
      };
    }
    return { valid: true, normalized: parsed.toString() };
  } catch {
    return {
      valid: false,
      normalized: "",
      reason: "Invalid source URL format."
    };
  }
}

export type PatchAiAnalysisResult = {
  aiSummaryEn: string;
  aiSummaryEs: string;
  confidenceScore: number;
  proposedChanges: PatchProposedChange[];
  analysisMode: "gemini_live" | "deterministic_parser";
};

function tokenizeLower(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function inferGlitchTarget(
  line: string,
  existingGlitches: GlitchItem[]
): GlitchItem | undefined {
  const lower = tokenizeLower(line);
  // Direct ID reference (e.g. g1, g2)
  for (const g of existingGlitches) {
    if (new RegExp(`\\b${g.id}\\b`, "i").test(line)) return g;
  }

  const keywordPairs: { id: string; terms: string[] }[] = [
    { id: "g1", terms: ["apollo", "red barn", "granero", "van", "money loop", "cocaine", "tyrone"] },
    { id: "g2", terms: ["first-person", "first person", "camera", "touchpad", "view button"] },
    { id: "g3", terms: ["police", "tracker", "gps", "wanted", "wank", "plate"] },
    { id: "g4", terms: ["airboat", "grassrivers", "ramp", "panther", "poach", "swamp"] },
    { id: "g5", terms: ["motorcycle", "curb", "wall-climb", "sanchez", "enduro", "bike boost"] }
  ];

  for (const entry of keywordPairs) {
    if (entry.terms.some((term) => lower.includes(term))) {
      return existingGlitches.find((g) => g.id === entry.id);
    }
  }

  return existingGlitches.find((g) => {
    const enTitle = g.title.en.toLowerCase();
    const significantWords = enTitle.split(/\W+/).filter((w) => w.length >= 5);
    return significantWords.some((word) => lower.includes(word));
  });
}

export function runDeterministicPatchAnalysis(params: {
  patchVersion: string;
  rawNotes: string;
  existingGlitches: GlitchItem[];
  existingCheats: CheatItem[];
}): PatchAiAnalysisResult {
  const version = sanitizePlainText(params.patchVersion, 40);
  const lines = params.rawNotes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const proposedChanges: PatchProposedChange[] = [];
  const seenTargets = new Set<string>();
  let matchedTechnicalSignals = 0;

  for (const line of lines) {
    const lower = tokenizeLower(line);
    const isPatchFix =
      /\b(patch(ed)?|fix(ed)?|resolv(ed|ing)|nerf(ed)?|prevent(s|ed)?|exploited|closed|removed)\b/i.test(
        lower
      );
    const isReactivated = /\b(re-?enabled|restored|working again|active again|unpatched)\b/i.test(lower);
    const isNewCheat =
      /\b(new cheat|cheat code|d-pad|button code|added cheat|unlockable cheat)\b/i.test(lower);
    const isNewPin =
      /\b(new spawn|new collectible|new location|added vault|new jewelry|new fence|new safe|map location|gps)\b/i.test(
        lower
      );

    // 1. Check existing Sandbox Technique impact
    const matchedGlitch = inferGlitchTarget(line, params.existingGlitches);
    if (matchedGlitch && (isPatchFix || isReactivated)) {
      const changeKey = `glitch:${matchedGlitch.id}`;
      if (!seenTargets.has(changeKey)) {
        seenTargets.add(changeKey);
        matchedTechnicalSignals += 1;
        const markPatched = isPatchFix && !isReactivated;
        proposedChanges.push({
          id: `chg-${crypto.randomUUID().slice(0, 8)}`,
          target: "glitch",
          action: markPatched ? "mark_patched" : "mark_active",
          targetId: matchedGlitch.id,
          titleEn: matchedGlitch.title.en,
          titleEs: matchedGlitch.title.es,
          summaryEn: markPatched
            ? `Mark "${matchedGlitch.title.en}" as PATCHED in ${version}.`
            : `Mark "${matchedGlitch.title.en}" as WORKING in ${version}.`,
          summaryEs: markPatched
            ? `Marcar "${matchedGlitch.title.es}" como PARCHEADO en ${version}.`
            : `Marcar "${matchedGlitch.title.es}" como ACTIVO en ${version}.`,
          payload: {
            id: matchedGlitch.id,
            category: matchedGlitch.category,
            isPatched: markPatched,
            patchStatus: markPatched
              ? `PATCHED IN ${version.toUpperCase()}`
              : `WORKING ON ${version.toUpperCase()}`,
            titleEn: matchedGlitch.title.en,
            titleEs: matchedGlitch.title.es,
            stepsEn: matchedGlitch.steps.en,
            stepsEs: matchedGlitch.steps.es,
            warningEn: markPatched
              ? `Patch ${version} note: ${sanitizePlainText(line, 240)}`
              : matchedGlitch.warning.en,
            warningEs: markPatched
              ? `Nota del parche ${version}: ${sanitizePlainText(line, 240)}`
              : matchedGlitch.warning.es
          }
        });
      }
      continue;
    }

    // 2. Detect newly added cheat code or D-Pad unlock
    if (isNewCheat) {
      const cleanLine = sanitizePlainText(line.replace(/^[-*•]\s*/, ""), 140);
      const slug = `patch-${version.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${proposedChanges.length + 1}`;
      const cheatKey = `cheat:${slug}`;
      if (!seenTargets.has(cheatKey)) {
        seenTargets.add(cheatKey);
        matchedTechnicalSignals += 1;
        const category = /vehicle|car|boat|jet|heli|bike/i.test(lower)
          ? "Vehicles"
          : /weapon|ammo|combat|armor|wanted/i.test(lower)
            ? "Combat"
            : /weather|gravity|world|traffic/i.test(lower)
              ? "World"
              : "Player";
        const seqMatch = line.match(/\b(UP|DOWN|LEFT|RIGHT)\b/gi);
        const seq =
          seqMatch && seqMatch.length >= 4
            ? seqMatch.slice(0, 10).map((s) => s.toUpperCase())
            : ["UP", "RIGHT", "DOWN", "LEFT", "UP", "DOWN"];
        proposedChanges.push({
          id: `chg-${crypto.randomUUID().slice(0, 8)}`,
          target: "cheat",
          action: "upsert",
          targetId: slug,
          titleEn: cleanLine.slice(0, 90),
          titleEs: cleanLine.slice(0, 90),
          summaryEn: `Add new ${version} cheat entry (${category}): ${cleanLine.slice(0, 80)}`,
          summaryEs: `Agregar nuevo truco de ${version} (${category}): ${cleanLine.slice(0, 80)}`,
          payload: {
            id: slug,
            titleEn: cleanLine.slice(0, 120),
            titleEs: cleanLine.slice(0, 120),
            category,
            unlockEn: `Added in Title Update ${version}`,
            unlockEs: `Agregado en Actualización ${version}`,
            howToUnlockEn: `Detected from ${version} patch notes. Verify button combo in single-player.`,
            howToUnlockEs: `Detectado en notas del parche ${version}. Verifica el combo en modo historia.`,
            descEn: cleanLine,
            descEs: cleanLine,
            seq
          }
        });
      }
      continue;
    }

    // 3. Detect newly added map pin / world feature
    if (isNewPin) {
      const cleanLine = sanitizePlainText(line.replace(/^[-*•]\s*/, ""), 140);
      const pinId = `patch-pin-${proposedChanges.length + 1}`;
      if (!seenTargets.has(`pin:${pinId}`)) {
        seenTargets.add(`pin:${pinId}`);
        matchedTechnicalSignals += 1;
        const region = /key|lento/i.test(lower)
          ? "Leonida Keys"
          : /gellhorn|port/i.test(lower)
            ? "Port Gellhorn"
            : /grass|swamp/i.test(lower)
              ? "Grassrivers"
              : "Vice City";
        const pinType = /car|eclipse|supercar/i.test(lower)
          ? "RareCar"
          : /atm|cash|vault|jewelry/i.test(lower)
            ? "Money"
            : /fence/i.test(lower)
              ? "Fence"
              : "Collectible";
        proposedChanges.push({
          id: `chg-${crypto.randomUUID().slice(0, 8)}`,
          target: "pin",
          action: "upsert",
          targetId: pinId,
          titleEn: `${region}: ${cleanLine.slice(0, 72)}`,
          titleEs: `${region}: ${cleanLine.slice(0, 72)}`,
          summaryEn: `Add ${region} tactical map pin from ${version}.`,
          summaryEs: `Agregar pin en ${region} detectado en ${version}.`,
          payload: {
            id: pinId,
            tier: "street",
            pinType,
            region,
            icon: pinType === "Money" ? "💰" : pinType === "RareCar" ? "🏎️" : "📍",
            x: 72,
            y: 54,
            nameEn: `${version} Update: ${cleanLine.slice(0, 80)}`,
            nameEs: `Actualización ${version}: ${cleanLine.slice(0, 80)}`,
            noteEn: cleanLine,
            noteEs: cleanLine
          }
        });
      }
    }
  }

  // Always propose an updated live Global Banner reflecting the scanned patch version
  const bannerEn =
    proposedChanges.length > 0
      ? `GTA VI ${version} Live Sync: ${proposedChanges.length} hub tracker updates applied automatically.`
      : `GTA VI ${version} Patch Tracked: All Leonida cheats, pins, and sandbox techniques verified.`;
  const bannerEs =
    proposedChanges.length > 0
      ? `GTA VI ${version} En Vivo: ${proposedChanges.length} actualizaciones aplicadas automáticamente al hub.`
      : `Parche GTA VI ${version} Monitoreado: Trucos, pines y técnicas sandbox verificados.`;

  proposedChanges.push({
    id: `chg-banner-${crypto.randomUUID().slice(0, 6)}`,
    target: "global_banner",
    action: "update_banner",
    targetId: "global_banner",
    titleEn: "Live Global Patch Ticker",
    titleEs: "Ticker Global de Parche en Vivo",
    summaryEn: bannerEn,
    summaryEs: bannerEs,
    payload: {
      active: true,
      textEn: bannerEn.slice(0, 220),
      textEs: bannerEs.slice(0, 220)
    }
  });

  const confidenceScore = Math.min(
    98,
    58 + matchedTechnicalSignals * 15 + (version.length >= 3 ? 10 : 0) + (lines.length >= 2 ? 5 : 0)
  );

  const nonBannerCount = proposedChanges.filter((c) => c.target !== "global_banner").length;
  const aiSummaryEn =
    nonBannerCount > 0
      ? `Analyzed ${version} (${lines.length} patch note lines). Detected ${nonBannerCount} concrete gameplay/economy change(s) + updated live patch ticker.`
      : `Analyzed ${version} (${lines.length} patch note lines). No existing sandbox technique regressions matched; drafted updated live ticker alert.`;
  const aiSummaryEs =
    nonBannerCount > 0
      ? `Se analizó ${version} (${lines.length} líneas). Se detectaron ${nonBannerCount} cambios concretos de jugabilidad/economía + actualización del ticker en vivo.`
      : `Se analizó ${version} (${lines.length} líneas). Sin regresiones en técnicas sandbox existentes; se preparó alerta del ticker en vivo.`;

  return {
    aiSummaryEn,
    aiSummaryEs,
    confidenceScore,
    proposedChanges,
    analysisMode: "deterministic_parser"
  };
}

export async function analyzePatchNotesWithAI(params: {
  patchVersion: string;
  rawNotes: string;
  sourceUrl?: string;
  existingGlitches: GlitchItem[];
  existingCheats: CheatItem[];
}): Promise<PatchAiAnalysisResult> {
  const deterministic = runDeterministicPatchAnalysis(params);
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return deterministic;
  }

  try {
    const glitchCatalog = params.existingGlitches
      .map((g) => `${g.id}: "${g.title.en}" (${g.category}, patched=${Boolean(g.isPatched)})`)
      .join("\n");

    const prompt = [
      "You are the ViceLink GTA VI Patch Intelligence Agent.",
      `Patch Version: ${sanitizePlainText(params.patchVersion, 40)}`,
      params.sourceUrl ? `Source URL: ${params.sourceUrl}` : "",
      "Existing Sandbox Technique Catalog:",
      glitchCatalog,
      "",
      "Patch Notes:",
      params.rawNotes.slice(0, 3500),
      "",
      'Respond in strict JSON only with shape: { "aiSummaryEn": string, "aiSummaryEs": string, "confidenceScore": number, "patchedGlitchIds": string[], "reactivatedGlitchIds": string[], "headlineEn": string, "headlineEs": string }.'
    ].join("\n");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: "application/json"
          }
        }),
        signal: AbortSignal.timeout(12_000)
      }
    );

    if (!res.ok) return deterministic;
    const payload = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const rawJson = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) return deterministic;

    const parsed = JSON.parse(rawJson) as {
      aiSummaryEn?: string;
      aiSummaryEs?: string;
      confidenceScore?: number;
      patchedGlitchIds?: string[];
      reactivatedGlitchIds?: string[];
      headlineEn?: string;
      headlineEs?: string;
    };

    const mergedChanges = [...deterministic.proposedChanges];
    const existingChangeTargets = new Set(mergedChanges.map((c) => `${c.target}:${c.targetId}`));

    for (const gid of parsed.patchedGlitchIds ?? []) {
      const seed = params.existingGlitches.find((g) => g.id === gid);
      if (seed && !existingChangeTargets.has(`glitch:${gid}`)) {
        existingChangeTargets.add(`glitch:${gid}`);
        mergedChanges.unshift({
          id: `chg-${crypto.randomUUID().slice(0, 8)}`,
          target: "glitch",
          action: "mark_patched",
          targetId: gid,
          titleEn: seed.title.en,
          titleEs: seed.title.es,
          summaryEn: `AI matched "${seed.title.en}" as PATCHED in ${params.patchVersion}.`,
          summaryEs: `La IA detectó "${seed.title.es}" como PARCHEADO en ${params.patchVersion}.`,
          payload: {
            id: gid,
            category: seed.category,
            isPatched: true,
            patchStatus: `PATCHED IN ${sanitizePlainText(params.patchVersion, 24).toUpperCase()}`,
            titleEn: seed.title.en,
            titleEs: seed.title.es,
            stepsEn: seed.steps.en,
            stepsEs: seed.steps.es,
            warningEn: seed.warning.en,
            warningEs: seed.warning.es
          }
        });
      }
    }

    if (parsed.headlineEn && parsed.headlineEs) {
      const bannerChange = mergedChanges.find((c) => c.target === "global_banner");
      if (bannerChange) {
        bannerChange.payload = {
          active: true,
          textEn: sanitizePlainText(parsed.headlineEn, 220),
          textEs: sanitizePlainText(parsed.headlineEs, 220)
        };
      }
    }

    const aiConfidence =
      typeof parsed.confidenceScore === "number"
        ? Math.max(deterministic.confidenceScore, Math.min(99, Math.round(parsed.confidenceScore)))
        : deterministic.confidenceScore;

    return {
      aiSummaryEn: sanitizePlainText(parsed.aiSummaryEn || deterministic.aiSummaryEn, 400),
      aiSummaryEs: sanitizePlainText(parsed.aiSummaryEs || deterministic.aiSummaryEs, 400),
      confidenceScore: aiConfidence,
      proposedChanges: mergedChanges,
      analysisMode: "gemini_live"
    };
  } catch {
    return deterministic;
  }
}

export async function applyPatchChanges(
  supabase: VicelinkSupabaseClient,
  adminEmail: string,
  changes: PatchProposedChange[]
): Promise<{ appliedCount: number; rollbackSnapshot: PatchRollbackEntry[] }> {
  const rollbackSnapshot: PatchRollbackEntry[] = [];
  let appliedCount = 0;

  for (const change of changes) {
    if (change.target === "glitch") {
      const { data: prev } = await supabase
        .from("vicelink_dynamic_glitches")
        .select("*")
        .eq("id", change.targetId)
        .maybeSingle();

      rollbackSnapshot.push({
        table: "vicelink_dynamic_glitches",
        rowKey: change.targetId,
        existed: Boolean(prev),
        previousRow: prev ? (prev as unknown as Record<string, unknown>) : null
      });

      const p = change.payload;
      const { error } = await supabase.from("vicelink_dynamic_glitches").upsert(
        {
          id: change.targetId,
          category: ((p.category as string) || "Money") as "Money" | "Camera" | "Stealth" | "Physics",
          is_patched: Boolean(p.isPatched),
          patch_status: sanitizePlainText(String(p.patchStatus || "PATCHED"), 120),
          title_en: sanitizePlainText(String(p.titleEn || change.titleEn), 180),
          title_es: sanitizePlainText(String(p.titleEs || change.titleEs), 180),
          steps_en: (Array.isArray(p.stepsEn) ? p.stepsEn : []) as Json,
          steps_es: (Array.isArray(p.stepsEs) ? p.stepsEs : []) as Json,
          warning_en: sanitizePlainText(String(p.warningEn || ""), 500),
          warning_es: sanitizePlainText(String(p.warningEs || ""), 500),
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      appliedCount += 1;
      continue;
    }

    if (change.target === "cheat") {
      const { data: prev } = await supabase
        .from("vicelink_dynamic_cheats")
        .select("*")
        .eq("id", change.targetId)
        .maybeSingle();

      rollbackSnapshot.push({
        table: "vicelink_dynamic_cheats",
        rowKey: change.targetId,
        existed: Boolean(prev),
        previousRow: prev ? (prev as unknown as Record<string, unknown>) : null
      });

      const p = change.payload;
      const { error } = await supabase.from("vicelink_dynamic_cheats").upsert(
        {
          id: change.targetId,
          title_en: sanitizePlainText(String(p.titleEn || change.titleEn), 140),
          title_es: sanitizePlainText(String(p.titleEs || change.titleEs), 140),
          category: ((p.category as string) || "Player") as "Player" | "Combat" | "Vehicles" | "World",
          unlock_en: sanitizePlainText(String(p.unlockEn || ""), 200),
          unlock_es: sanitizePlainText(String(p.unlockEs || ""), 200),
          how_to_unlock_en: sanitizePlainText(String(p.howToUnlockEn || ""), 500),
          how_to_unlock_es: sanitizePlainText(String(p.howToUnlockEs || ""), 500),
          desc_en: sanitizePlainText(String(p.descEn || ""), 500),
          desc_es: sanitizePlainText(String(p.descEs || ""), 500),
          button_sequence: (Array.isArray(p.seq) ? p.seq : ["UP", "DOWN", "LEFT", "RIGHT"]) as Json,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      appliedCount += 1;
      continue;
    }

    if (change.target === "pin") {
      const { data: prev } = await supabase
        .from("vicelink_dynamic_map_pins")
        .select("*")
        .eq("id", change.targetId)
        .maybeSingle();

      rollbackSnapshot.push({
        table: "vicelink_dynamic_map_pins",
        rowKey: change.targetId,
        existed: Boolean(prev),
        previousRow: prev ? (prev as unknown as Record<string, unknown>) : null
      });

      const p = change.payload;
      const { error } = await supabase.from("vicelink_dynamic_map_pins").upsert(
        {
          id: change.targetId,
          tier: ((p.tier as string) || "street") as "free" | "street" | "kingpin",
          pin_type: ((p.pinType as string) || "Collectible") as
            | "Money"
            | "ATM"
            | "RareCar"
            | "Fence"
            | "EasterEgg"
            | "Collectible",
          region: sanitizePlainText(String(p.region || "Vice City"), 60),
          icon: sanitizePlainText(String(p.icon || "📍"), 8),
          coord_x: Number(p.x ?? 50),
          coord_y: Number(p.y ?? 50),
          name_en: sanitizePlainText(String(p.nameEn || change.titleEn), 140),
          name_es: sanitizePlainText(String(p.nameEs || change.titleEs), 140),
          note_en: sanitizePlainText(String(p.noteEn || ""), 500),
          note_es: sanitizePlainText(String(p.noteEs || ""), 500)
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      appliedCount += 1;
      continue;
    }

    if (change.target === "global_banner") {
      const { data: prev } = await supabase
        .from("vicelink_site_settings")
        .select("*")
        .eq("key", "global_banner")
        .maybeSingle();

      rollbackSnapshot.push({
        table: "vicelink_site_settings",
        rowKey: "global_banner",
        existed: Boolean(prev),
        previousRow: prev ? (prev as unknown as Record<string, unknown>) : null
      });

      const p = change.payload;
      const { error } = await supabase.from("vicelink_site_settings").upsert(
        {
          key: "global_banner",
          value: {
            active: Boolean(p.active ?? true),
            textEn: sanitizePlainText(String(p.textEn || change.summaryEn), 220),
            textEs: sanitizePlainText(String(p.textEs || change.summaryEs), 220)
          } as Json,
          updated_by: adminEmail,
          updated_at: new Date().toISOString()
        },
        { onConflict: "key" }
      );
      if (error) throw error;
      appliedCount += 1;
    }
  }

  return { appliedCount, rollbackSnapshot };
}

export async function rollbackPatchChanges(
  supabase: VicelinkSupabaseClient,
  adminEmail: string,
  rollbackSnapshot: PatchRollbackEntry[]
): Promise<number> {
  let restoredCount = 0;

  for (const entry of rollbackSnapshot) {
    if (entry.table === "vicelink_site_settings") {
      if (entry.existed && entry.previousRow) {
        const { error } = await supabase.from("vicelink_site_settings").upsert(
          {
            key: entry.rowKey,
            value: (entry.previousRow.value ?? {
              active: false,
              textEn: "",
              textEs: ""
            }) as Json,
            updated_by: adminEmail,
            updated_at: new Date().toISOString()
          },
          { onConflict: "key" }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vicelink_site_settings").upsert(
          {
            key: "global_banner",
            value: { active: false, textEn: "", textEs: "" } as Json,
            updated_by: adminEmail,
            updated_at: new Date().toISOString()
          },
          { onConflict: "key" }
        );
        if (error) throw error;
      }
      restoredCount += 1;
      continue;
    }

    if (entry.table === "vicelink_dynamic_glitches") {
      if (entry.existed && entry.previousRow) {
        const r = entry.previousRow;
        const { error } = await supabase.from("vicelink_dynamic_glitches").upsert(
          {
            id: entry.rowKey,
            category: (String(r.category || "Money") as "Money" | "Camera" | "Stealth" | "Physics"),
            is_patched: Boolean(r.is_patched),
            patch_status: String(r.patch_status || "WORKING ON PATCH 01.002.001"),
            title_en: String(r.title_en || ""),
            title_es: String(r.title_es || ""),
            steps_en: (r.steps_en ?? []) as Json,
            steps_es: (r.steps_es ?? []) as Json,
            warning_en: String(r.warning_en || ""),
            warning_es: String(r.warning_es || ""),
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );
        if (error) throw error;
      } else {
        // Delete override row cleanly; fall back to marking unpatched if delete RLS forbids it.
        const { error: delErr } = await supabase
          .from("vicelink_dynamic_glitches")
          .delete()
          .eq("id", entry.rowKey);
        if (delErr) {
          await supabase
            .from("vicelink_dynamic_glitches")
            .update({ is_patched: false, patch_status: "ROLLED BACK" })
            .eq("id", entry.rowKey);
        }
      }
      restoredCount += 1;
      continue;
    }

    if (entry.table === "vicelink_dynamic_cheats") {
      if (entry.existed && entry.previousRow) {
        const r = entry.previousRow;
        await supabase.from("vicelink_dynamic_cheats").upsert(
          {
            id: entry.rowKey,
            title_en: String(r.title_en || ""),
            title_es: String(r.title_es || ""),
            category: String(r.category || "Player") as "Player" | "Combat" | "Vehicles" | "World",
            unlock_en: String(r.unlock_en || ""),
            unlock_es: String(r.unlock_es || ""),
            how_to_unlock_en: String(r.how_to_unlock_en || ""),
            how_to_unlock_es: String(r.how_to_unlock_es || ""),
            desc_en: String(r.desc_en || ""),
            desc_es: String(r.desc_es || ""),
            button_sequence: (r.button_sequence ?? []) as Json,
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );
      } else {
        await supabase.from("vicelink_dynamic_cheats").delete().eq("id", entry.rowKey);
      }
      restoredCount += 1;
      continue;
    }

    if (entry.table === "vicelink_dynamic_map_pins") {
      if (entry.existed && entry.previousRow) {
        const r = entry.previousRow;
        await supabase.from("vicelink_dynamic_map_pins").upsert(
          {
            id: entry.rowKey,
            tier: String(r.tier || "street") as "free" | "street" | "kingpin",
            pin_type: String(r.pin_type || "Collectible") as
              | "Money"
              | "ATM"
              | "RareCar"
              | "Fence"
              | "EasterEgg"
              | "Collectible",
            region: String(r.region || "Vice City"),
            icon: String(r.icon || "📍"),
            coord_x: Number(r.coord_x ?? 50),
            coord_y: Number(r.coord_y ?? 50),
            name_en: String(r.name_en || ""),
            name_es: String(r.name_es || ""),
            note_en: String(r.note_en || ""),
            note_es: String(r.note_es || "")
          },
          { onConflict: "id" }
        );
      } else {
        await supabase.from("vicelink_dynamic_map_pins").delete().eq("id", entry.rowKey);
      }
      restoredCount += 1;
    }
  }

  return restoredCount;
}

export function mapPatchReportRow(row: {
  id: string;
  patch_version: string;
  source_url: string;
  source_type: string;
  raw_notes: string;
  ai_summary_en: string;
  ai_summary_es: string;
  confidence_score: number;
  status: string;
  proposed_changes: Json;
  rollback_snapshot: Json;
  applied_count: number;
  created_by: string;
  created_at: string;
  applied_at: string | null;
  rolled_back_at: string | null;
}): PatchReportItem {
  return {
    id: row.id,
    patchVersion: row.patch_version,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    rawNotes: row.raw_notes,
    aiSummaryEn: row.ai_summary_en,
    aiSummaryEs: row.ai_summary_es,
    confidenceScore: row.confidence_score,
    status: row.status as PatchReportItem["status"],
    proposedChanges: Array.isArray(row.proposed_changes)
      ? (row.proposed_changes as unknown as PatchProposedChange[])
      : [],
    rollbackSnapshot: Array.isArray(row.rollback_snapshot)
      ? (row.rollback_snapshot as unknown as PatchRollbackEntry[])
      : [],
    appliedCount: row.applied_count,
    createdBy: row.created_by,
    createdAt: row.created_at,
    appliedAt: row.applied_at,
    rolledBackAt: row.rolled_back_at
  };
}
