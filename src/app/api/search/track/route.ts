import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import { apiError, apiJson, createClient, getAuthedUser } from "@/lib/supabase/server";

const trackSearchSchema = z.object({
  area: z.enum([
    "all",
    "cheats",
    "map",
    "glitches",
    "forum",
    "database",
    "mechanics",
    "controls",
    "radio",
    "trophies",
    "legal"
  ]),
  keyword: z.string().trim().min(2).max(80),
  resultCount: z.number().int().min(0).max(5000),
  lang: z.enum(["en", "es"]).optional().default("en")
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`search-track:${user.id}`, 60, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Search tracking limit reached; slow down slightly.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = trackSearchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid search analytics payload.");
    }

    if (containsDisallowedMarkup(parsed.data.keyword)) {
      return apiError("INVALID_INPUT", 400, "Keyword may not contain markup.");
    }

    const cleanKeyword = sanitizePlainText(parsed.data.keyword, 64).toLowerCase();
    if (cleanKeyword.length < 2) {
      return apiJson({ ok: true, skipped: true });
    }

    const { error } = await supabase.from("vicelink_keyword_searches").insert({
      user_id: user.id,
      area: parsed.data.area,
      keyword: cleanKeyword,
      result_count: parsed.data.resultCount,
      lang: parsed.data.lang
    });

    if (error) throw error;
    return apiJson({ ok: true });
  } catch (err) {
    return apiError(
      "SEARCH_TRACK_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to track keyword search"
    );
  }
}
