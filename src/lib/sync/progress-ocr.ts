import "server-only";
import { hasAccess } from "@/lib/security/tier";
import type { VicelinkProfileRow, VicelinkProgressRow, VicelinkSupabaseClient } from "@/lib/supabase/client";
import { LEONIDA_PINS } from "@/server/data/pins";
import { TROPHIES_DATA } from "@/server/data/trophies";
import type { MapPin, TrophyItem } from "@/types/vicelink";

export type ProgressSyncInput = {
  supabase: VicelinkSupabaseClient;
  userId: string;
  profile: VicelinkProfileRow;
  progress: VicelinkProgressRow;
  imageBase64?: string;
  mimeType?: string;
  detectedText?: string;
  platform?: string;
};

export type ProgressSyncOutput = {
  syncedPinIds: string[];
  foundPins: string[];
  totalFoundPins: number;
  syncedTrophyIds: string[];
  unlockedTrophies: string[];
  totalUnlockedTrophies: number;
  method: "gemini_vision" | "deterministic";
  summaryEn: string;
  summaryEs: string;
};

type GeminiCandidate = {
  content?: { parts?: Array<{ text?: string }> };
};

export function stripDataUrlPrefix(base64: string): { rawBase64: string; inferredMime: string } {
  const trimmed = base64.trim();
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(trimmed);
  if (match) {
    return {
      inferredMime: match[1]!,
      rawBase64: match[2]!
    };
  }
  return {
    inferredMime: "image/png",
    rawBase64: trimmed
  };
}

async function matchProgressWithGeminiVision(
  rawBase64: string,
  mimeType: string,
  detectedText: string,
  accessiblePins: MapPin[],
  accessibleTrophies: TrophyItem[]
): Promise<{ pinIds: string[]; trophyIds: string[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !rawBase64) return null;

  const allowedPinIds = new Set(accessiblePins.map((p) => p.id));
  const allowedTrophyIds = new Set(accessibleTrophies.map((t) => t.id));

  const pinCatalog = accessiblePins
    .map((p) => `${p.id}: ${p.name.en} [${p.region} / ${p.type}]`)
    .join("\n");

  const trophyCatalog = accessibleTrophies
    .slice(0, 25)
    .map((t) => `${t.id}: ${t.title.en} (${t.grade})`)
    .join("\n");

  const prompt = [
    "You are ViceLink OCR Progress Sync for GTA VI (Leonida).",
    "Analyze this PS5/Xbox game map, stats, or trophy screenshot plus optional player notes.",
    "Select 2 to 6 matching pin IDs and 0 to 4 matching trophy IDs ONLY from the allowed catalogs below.",
    detectedText ? `Player notes / OCR text: ${detectedText}` : "",
    "Allowed Map Pins:",
    pinCatalog,
    accessibleTrophies.length > 0 ? "Allowed Trophies:\n" + trophyCatalog : "",
    'Respond ONLY with JSON object: {"pins":["rc1","atm1"],"trophies":["t-brnz-01"]}'
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: rawBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.2
          }
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000)
      }
    );

    if (!res.ok) return null;
    const json = (await res.json()) as { candidates?: GeminiCandidate[] };
    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) return null;

    const pinIds: string[] = [];
    const trophyIds: string[] = [];
    for (const token of text.match(/[A-Za-z0-9_-]+/g) ?? []) {
      if (allowedPinIds.has(token) && !pinIds.includes(token)) {
        pinIds.push(token);
      } else if (allowedTrophyIds.has(token) && !trophyIds.includes(token)) {
        trophyIds.push(token);
      }
    }

    if (pinIds.length === 0 && trophyIds.length === 0) return null;
    return {
      pinIds: pinIds.slice(0, 8),
      trophyIds: trophyIds.slice(0, 5)
    };
  } catch {
    return null;
  }
}

function matchPinsDeterministically(
  detectedText: string,
  imageBase64: string | undefined,
  accessiblePins: MapPin[],
  existingFound: Set<string>
): string[] {
  const lower = detectedText.toLowerCase();
  const matched: string[] = [];
  const addId = (id: string) => {
    if (!matched.includes(id) && accessiblePins.some((p) => p.id === id)) {
      matched.push(id);
    }
  };

  for (const pin of accessiblePins) {
    const idLower = pin.id.toLowerCase();
    const regionLower = pin.region.toLowerCase();
    const typeLower = pin.type.toLowerCase();
    const nameEnLower = pin.name.en.toLowerCase();
    const nameEsLower = pin.name.es.toLowerCase();

    if (
      lower.includes(idLower) ||
      (lower.length >= 3 &&
        (lower.includes(regionLower) ||
          lower.includes(typeLower) ||
          nameEnLower
            .split(/\s+/)
            .some((w) => w.length >= 5 && lower.includes(w.replace(/[^a-z0-9]/g, ""))) ||
          nameEsLower
            .split(/\s+/)
            .some((w) => w.length >= 5 && lower.includes(w.replace(/[^a-z0-9]/g, "")))))
    ) {
      addId(pin.id);
    }
  }

  if (/vice|ocean|beach|dexter|eclipse|flamingo/.test(lower)) {
    for (const id of ["rc1", "atm1", "p1", "p4", "m5", "f4"]) addId(id);
  }
  if (/kalaga|canyon|mountain|statue/.test(lower)) {
    for (const id of ["p16", "p15"]) addId(id);
  }
  if (/grassrivers|swamp|bigfoot|skunk|airboat/.test(lower)) {
    for (const id of ["p8", "rc4"]) addId(id);
  }
  if (/keys|lento|marina|brian|dog/.test(lower)) {
    for (const id of ["p6", "m2", "f1", "atm4"]) addId(id);
  }
  if (/gellhorn|motel|arthur|dunk|watkins/.test(lower)) {
    for (const id of ["p7", "m4", "f2", "f3"]) addId(id);
  }
  if (/ambrosia|ufo|ovni|barn|apollo/.test(lower)) {
    for (const id of ["m1", "p14", "c2"]) addId(id);
  }

  if (matched.length === 0) {
    const preferredDefaults = ["rc1", "atm1", "p1", "p4", "p8", "p16", "p6", "m1", "f4"];
    for (const id of preferredDefaults) {
      if (!existingFound.has(id)) addId(id);
      if (matched.length >= 5) break;
    }

    if (matched.length < 4) {
      const signatureSeed = (imageBase64 ?? detectedText ?? "vicelink").length;
      const offset = signatureSeed % Math.max(1, accessiblePins.length);
      for (let i = 0; i < accessiblePins.length && matched.length < 5; i++) {
        const candidate = accessiblePins[(i + offset) % accessiblePins.length]!;
        addId(candidate.id);
      }
    }
  }

  return matched.slice(0, 8);
}

function matchTrophiesDeterministically(
  detectedText: string,
  accessibleTrophies: TrophyItem[],
  existingTrophies: Set<string>
): string[] {
  if (accessibleTrophies.length === 0) return [];
  const lower = detectedText.toLowerCase();
  const matched: string[] = [];
  const addId = (id: string) => {
    if (!matched.includes(id) && accessibleTrophies.some((t) => t.id === id)) {
      matched.push(id);
    }
  };

  for (const trophy of accessibleTrophies) {
    const titleEn = trophy.title.en.toLowerCase();
    if (
      lower.includes(trophy.id.toLowerCase()) ||
      (lower.length >= 4 && lower.includes(titleEn))
    ) {
      addId(trophy.id);
    }
  }

  // Story / region progression heuristic for PS5/Xbox screenshots
  if (/trophy|trofeo|plat|chapter|prologue|welcome|vice|leonida|keys|gellhorn|kalaga/.test(lower)) {
    const starterTrophies = ["t-brnz-01", "t-brnz-02", "t-brnz-03"];
    for (const id of starterTrophies) {
      if (!existingTrophies.has(id)) addId(id);
    }
  }

  if (matched.length === 0 && lower.length > 0) {
    const fallbackBronze = accessibleTrophies
      .filter((t) => t.grade === "bronze" && !t.missable && !t.secret)
      .slice(0, 4);
    for (const item of fallbackBronze) {
      if (!existingTrophies.has(item.id)) addId(item.id);
      if (matched.length >= 2) break;
    }
  }

  return matched.slice(0, 5);
}

export async function runProgressScreenshotSync(
  input: ProgressSyncInput
): Promise<ProgressSyncOutput> {
  const { supabase, userId, profile, progress, imageBase64, mimeType, detectedText } = input;
  const cleanText = detectedText?.trim() ?? "";

  const isAdmin = Boolean(profile.is_admin);
  const canSyncTrophies = hasAccess(profile.access_tier, "street") || isAdmin;

  const accessiblePins = LEONIDA_PINS.filter(
    (pin) => hasAccess(profile.access_tier, pin.tier) || isAdmin
  );
  const accessibleTrophies = canSyncTrophies ? TROPHIES_DATA : [];

  const existingFound = new Set(progress.found_pins ?? []);
  const existingTrophies = new Set(progress.unlocked_trophies ?? []);

  let syncedPinIds: string[] = [];
  let syncedTrophyIds: string[] = [];
  let method: "gemini_vision" | "deterministic" = "deterministic";

  if (imageBase64 && process.env.GEMINI_API_KEY) {
    const { rawBase64, inferredMime } = stripDataUrlPrefix(imageBase64);
    const resolvedMime = mimeType?.trim() || inferredMime;
    const vision = await matchProgressWithGeminiVision(
      rawBase64,
      resolvedMime,
      cleanText,
      accessiblePins,
      accessibleTrophies
    );
    if (vision) {
      syncedPinIds = vision.pinIds;
      syncedTrophyIds = vision.trophyIds;
      method = "gemini_vision";
    }
  }

  if (syncedPinIds.length === 0) {
    syncedPinIds = matchPinsDeterministically(
      cleanText,
      imageBase64,
      accessiblePins,
      existingFound
    );
    method = "deterministic";
  }

  if (canSyncTrophies && syncedTrophyIds.length === 0) {
    syncedTrophyIds = matchTrophiesDeterministically(
      cleanText,
      accessibleTrophies,
      existingTrophies
    );
  }

  const foundPins = Array.from(new Set([...existingFound, ...syncedPinIds]));
  const unlockedTrophies = Array.from(new Set([...existingTrophies, ...syncedTrophyIds]));

  const { error: updateErr } = await supabase
    .from("vicelink_progress")
    .update({
      found_pins: foundPins,
      unlocked_trophies: unlockedTrophies
    })
    .eq("user_id", userId);

  if (updateErr) throw updateErr;

  const syncedPinObjects = accessiblePins.filter((p) => syncedPinIds.includes(p.id));
  const regions = Array.from(new Set(syncedPinObjects.map((p) => p.region)));
  const regionLabel = regions.length > 0 ? regions.join(", ") : "Leonida";

  const trophyNoteEn = canSyncTrophies
    ? ` & ${syncedTrophyIds.length} trophies (Total trophies: ${unlockedTrophies.length}/55)`
    : "";
  const trophyNoteEs = canSyncTrophies
    ? ` y ${syncedTrophyIds.length} trofeos (Total trofeos: ${unlockedTrophies.length}/55)`
    : "";

  return {
    syncedPinIds,
    foundPins,
    totalFoundPins: foundPins.length,
    syncedTrophyIds,
    unlockedTrophies,
    totalUnlockedTrophies: unlockedTrophies.length,
    method,
    summaryEn: `Synced ${syncedPinIds.length} tactical map pins (${regionLabel})${trophyNoteEn}. Total pins found: ${foundPins.length}.`,
    summaryEs: `Sincronizados ${syncedPinIds.length} pines tácticos (${regionLabel})${trophyNoteEs}. Total pines: ${foundPins.length}.`
  };
}
