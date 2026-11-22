import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  apiError,
  apiJson,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";

/**
 * Priority 0 Fix — Prepare TOTP Enrollment / Reset Orphaned Pre-ViceLink Factors.
 * Safely demotes any orphaned `auth.mfa_factors` rows to `unverified` ONLY when
 * `public.vicelink_profiles.mfa_enabled = false`, preventing GoTrue AAL2 / duplicate
 * friendlyName lockouts before the user has scanned their QR code in ViceLink.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`mfa-reset:${user.id}`, 15, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many 2FA reset requests; please wait a moment.");
    }

    const { profile } = await ensureProfileAndProgress(supabase, user);
    if (profile.is_banned) {
      return apiError("ACCOUNT_BANNED", 403, "Your ViceLink account has been suspended.");
    }

    const { data, error } = await supabase.rpc("vicelink_prepare_totp_enrollment");

    return apiJson({
      ok: true,
      mfaEnabled: Boolean(profile.mfa_enabled),
      resetCount: !error && typeof data === "number" ? data : 0
    });
  } catch (err) {
    return apiError(
      "MFA_RESET_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to prepare 2FA enrollment"
    );
  }
}
