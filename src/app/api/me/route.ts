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

const AVATAR_PRESETS = [
  "neon_vice",
  "lucia_tactical",
  "jason_keys",
  "kingpin_gold",
  "wasted_skull",
  "ufo_kalaga"
] as const;

const CONSOLE_HANDLE_REGEX = /^[A-Za-z0-9 _-]{3,24}$/;

const idArraySchema = z
  .array(z.string().trim().regex(/^[A-Za-z0-9_-]{1,64}$/))
  .max(250)
  .transform((arr) => Array.from(new Set(arr)));

const patchMeSchema = z.object({
  handle: z.string().max(40).optional(),
  displayName: z.string().max(80).optional(),
  preferredLang: z.enum(["en", "es"]).optional(),
  avatarPreset: z.enum(AVATAR_PRESETS).optional(),
  psnId: z.string().max(40).optional(),
  xboxGamertag: z.string().max(40).optional(),
  socialClubHandle: z.string().max(40).optional(),
  mfaEnabled: z.boolean().optional(),
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
  "is_banned",
  "isBanned",
  "verification_code",
  "verificationCode",
  "psn_verified",
  "psnVerified",
  "xbox_verified",
  "xboxVerified",
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
          return apiError("FORBIDDEN_FIELD", 400, "Protected account fields cannot be modified via profile updates.");
        }
      }
    }

    const parsed = patchMeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid profile or progress payload.");
    }

    const ensured = await ensureProfileAndProgress(supabase, user);
    if (ensured.profile.is_banned) {
      return apiError(
        "ACCOUNT_BANNED",
        403,
        "Your ViceLink account has been suspended by an administrator."
      );
    }

    const input = parsed.data;

    const profilePatch: {
      handle?: string;
      display_name?: string;
      preferred_lang?: "en" | "es";
      avatar_preset?: string;
      psn_id?: string;
      psn_verified?: boolean;
      xbox_gamertag?: string;
      xbox_verified?: boolean;
      social_club_handle?: string;
      mfa_enabled?: boolean;
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

    if (input.avatarPreset !== undefined) {
      profilePatch.avatar_preset = input.avatarPreset;
    }

    if (input.psnId !== undefined) {
      if (containsDisallowedMarkup(input.psnId)) {
        return apiError("INVALID_INPUT", 400, "PSN ID contains disallowed markup.");
      }
      const cleanPsn = sanitizePlainText(input.psnId, 24);
      if (cleanPsn.length > 0 && !CONSOLE_HANDLE_REGEX.test(cleanPsn)) {
        return apiError("INVALID_INPUT", 400, "PSN ID must be 3-24 alphanumeric, space, hyphen, or underscore characters.");
      }
      profilePatch.psn_id = cleanPsn;
      if (cleanPsn !== (ensured.profile.psn_id ?? "")) {
        profilePatch.psn_verified = false;
      }
    }

    if (input.xboxGamertag !== undefined) {
      if (containsDisallowedMarkup(input.xboxGamertag)) {
        return apiError("INVALID_INPUT", 400, "Xbox Gamertag contains disallowed markup.");
      }
      const cleanXbox = sanitizePlainText(input.xboxGamertag, 24);
      if (cleanXbox.length > 0 && !CONSOLE_HANDLE_REGEX.test(cleanXbox)) {
        return apiError("INVALID_INPUT", 400, "Xbox Gamertag must be 3-24 alphanumeric, space, hyphen, or underscore characters.");
      }
      profilePatch.xbox_gamertag = cleanXbox;
      if (cleanXbox !== (ensured.profile.xbox_gamertag ?? "")) {
        profilePatch.xbox_verified = false;
      }
    }

    if (input.socialClubHandle !== undefined) {
      if (containsDisallowedMarkup(input.socialClubHandle)) {
        return apiError("INVALID_INPUT", 400, "Social Club handle contains disallowed markup.");
      }
      const cleanSocial = sanitizePlainText(input.socialClubHandle, 24);
      if (cleanSocial.length > 0 && !CONSOLE_HANDLE_REGEX.test(cleanSocial)) {
        return apiError("INVALID_INPUT", 400, "Social Club handle must be 3-24 alphanumeric, space, hyphen, or underscore characters.");
      }
      profilePatch.social_club_handle = cleanSocial;
    }

    if (input.mfaEnabled !== undefined) {
      profilePatch.mfa_enabled = input.mfaEnabled;
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
