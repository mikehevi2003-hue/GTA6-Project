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
  mapDynamicCheatRow,
  requireAdminUser
} from "@/lib/supabase/server";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const upsertCheatSchema = z.object({
  id: z.string().trim().regex(ID_PATTERN).optional(),
  titleEn: z.string().max(200),
  titleEs: z.string().max(200),
  category: z.enum(["Player", "Combat", "Vehicles", "World"]),
  unlockEn: z.string().max(300).optional().default(""),
  unlockEs: z.string().max(300).optional().default(""),
  howToUnlockEn: z.string().max(600).optional().default(""),
  howToUnlockEs: z.string().max(600).optional().default(""),
  descEn: z.string().max(600).optional().default(""),
  descEs: z.string().max(600).optional().default(""),
  seq: z.array(z.enum(["UP", "DOWN", "LEFT", "RIGHT"])).min(1).max(20)
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const rl = checkRateLimit(`admin-cheats:${user.id}`, 120, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many admin actions; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = upsertCheatSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid cheat code payload.");
    }

    const input = parsed.data;
    const textValues = [
      input.titleEn,
      input.titleEs,
      input.unlockEn,
      input.unlockEs,
      input.howToUnlockEn,
      input.howToUnlockEs,
      input.descEn,
      input.descEs
    ];
    if (textValues.some((val) => containsDisallowedMarkup(val))) {
      return apiError("INVALID_INPUT", 400, "Cheat fields may not contain HTML or script markup.");
    }

    const titleEn = sanitizePlainText(input.titleEn, 140);
    const titleEs = sanitizePlainText(input.titleEs, 140);
    if (titleEn.length < 2 || titleEs.length < 2) {
      return apiError("INVALID_INPUT", 400, "Bilingual EN and ES cheat titles (2+ chars) are required.");
    }

    const id = input.id || `cheat-${crypto.randomUUID().slice(0, 8)}`;

    const { data, error } = await supabase
      .from("vicelink_dynamic_cheats")
      .upsert(
        {
          id,
          title_en: titleEn,
          title_es: titleEs,
          category: input.category,
          unlock_en: sanitizePlainText(input.unlockEn, 200),
          unlock_es: sanitizePlainText(input.unlockEs, 200),
          how_to_unlock_en: sanitizePlainText(input.howToUnlockEn, 500),
          how_to_unlock_es: sanitizePlainText(input.howToUnlockEs, 500),
          desc_en: sanitizePlainText(input.descEn, 500),
          desc_es: sanitizePlainText(input.descEs, 500),
          button_sequence: input.seq
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (error) throw error;

    return apiJson({ cheat: mapDynamicCheatRow(data) });
  } catch (err) {
    return apiError(
      "ADMIN_CHEAT_SAVE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to save dynamic cheat"
    );
  }
}
