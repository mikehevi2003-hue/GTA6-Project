import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, normalizeHandle, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  buildMePayload,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";

const idArraySchema = z
  .array(z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/))
  .max(250)
  .transform((arr) => Array.from(new Set(arr)));

const patchMeSchema = z.object({
  handle: z.string().max(40).optional(),
  displayName: z.string().max(80).optional(),
  preferredLang: z.enum(["en", "es"]).optional(),
  progress: z
    .object({
      favorites: idArraySchema.optional(),
      unlockedCheats: idArraySchema.optional(),
      foundPins: idArraySchema.optional(),
      plannedVehicles: idArraySchema.optional(),
      plannedProps: idArraySchema.optional(),
      unlockedTrophies: idArraySchema.optional()
    })
    .optional()
});

const FORBIDDEN_PROFILE_KEYS = [
  "tier",
  "access_tier",
  "accessTier",
  "is_admin",
  "isAdmin",
  "stripe_customer_id",
  "stripeCustomerId"
] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const payload = await buildMePayload(supabase, user);
    return apiJson(payload);
  } catch (err) {
    return apiError(
      "ME_LOAD_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load account profile"
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`me-patch:${user.id}`, 120, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many profile updates; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    if (typeof rawBody === "object" && rawBody !== null && !Array.isArray(rawBody)) {
      const record = rawBody as Record<string, unknown>;
      for (const forbidden of FORBIDDEN_PROFILE_KEYS) {
        if (forbidden in record) {
          return apiError("FORBIDDEN_FIELD", 400, "Account tier cannot be modified via profile updates.");
        }
      }
    }

    const parsed = patchMeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid profile or progress payload.");
    }

    const ensured = await ensureProfileAndProgress(supabase, user);
    const input = parsed.data;

    const profilePatch: {
      handle?: string;
      display_name?: string;
      preferred_lang?: "en" | "es";
    } = {};

    if (input.handle !== undefined) {
      if (containsDisallowedMarkup(input.handle)) {
        return apiError("INVALID_INPUT", 400, "Handle contains disallowed characters.");
      }
      const normalized = normalizeHandle(input.handle);
      if (!normalized) {
        return apiError(
          "INVALID_INPUT",
          400,
          "Handle must be 2-24 alphanumeric or underscore characters."
        );
      }
      profilePatch.handle = normalized;
    }

    if (input.displayName !== undefined) {
      if (containsDisallowedMarkup(input.displayName)) {
        return apiError("INVALID_INPUT", 400, "Display name contains disallowed markup.");
      }
      profilePatch.display_name = sanitizePlainText(input.displayName, 60);
    }

    if (input.preferredLang !== undefined) {
      profilePatch.preferred_lang = input.preferredLang;
    }

    if (Object.keys(profilePatch).length > 0) {
      const { error: updateErr } = await supabase
        .from("vicelink_profiles")
        .update(profilePatch)
        .eq("user_id", user.id);
      if (updateErr) throw updateErr;
    }

    if (input.progress) {
      const progressPatch: {
        favorites?: string[];
        unlocked_cheats?: string[];
        found_pins?: string[];
        planned_vehicles?: string[];
        planned_props?: string[];
        unlocked_trophies?: string[];
      } = {};
      if (input.progress.favorites !== undefined) progressPatch.favorites = input.progress.favorites;
      if (input.progress.unlockedCheats !== undefined)
        progressPatch.unlocked_cheats = input.progress.unlockedCheats;
      if (input.progress.foundPins !== undefined) progressPatch.found_pins = input.progress.foundPins;
      if (input.progress.plannedVehicles !== undefined)
        progressPatch.planned_vehicles = input.progress.plannedVehicles;
      if (input.progress.plannedProps !== undefined)
        progressPatch.planned_props = input.progress.plannedProps;
      if (input.progress.unlockedTrophies !== undefined)
        progressPatch.unlocked_trophies = input.progress.unlockedTrophies;

      if (Object.keys(progressPatch).length > 0) {
        const { error: progErr } = await supabase
          .from("vicelink_progress")
          .update(progressPatch)
          .eq("user_id", user.id);
        if (progErr) throw progErr;
      }
    }

    const updated = await buildMePayload(
      supabase,
      user,
      Object.keys(profilePatch).length === 0 && !input.progress ? ensured : undefined
    );
    return apiJson(updated);
  } catch (err) {
    return apiError(
      "ME_UPDATE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to update account profile"
    );
  }
}
