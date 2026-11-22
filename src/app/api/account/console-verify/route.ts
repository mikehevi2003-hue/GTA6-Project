import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  ensureProfileAndProgress,
  getAuthenticatorAssuranceLevel,
  getAuthedUser,
  mapProfileRow
} from "@/lib/supabase/server";

const CONSOLE_HANDLE_REGEX = /^[A-Za-z0-9 _-]{3,24}$/;

const verifyConsoleSchema = z.object({
  platform: z.enum(["psn", "xbox", "social_club"]),
  handle: z.string().min(3).max(40)
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`console-verify:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many console verification attempts; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = verifyConsoleSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Platform and a 3-24 character console handle are required.");
    }

    const { platform, handle: rawHandle } = parsed.data;
    if (containsDisallowedMarkup(rawHandle)) {
      return apiError("INVALID_INPUT", 400, "Console handle contains disallowed markup.");
    }

    const cleanHandle = sanitizePlainText(rawHandle, 24);
    if (!CONSOLE_HANDLE_REGEX.test(cleanHandle)) {
      return apiError(
        "INVALID_INPUT",
        400,
        "Console handle must be 3-24 letters, numbers, spaces, hyphens, or underscores."
      );
    }

    const ensured = await ensureProfileAndProgress(supabase, user);
    if (ensured.profile.is_banned) {
      return apiError(
        "ACCOUNT_BANNED",
        403,
        "Your ViceLink account has been suspended by an administrator."
      );
    }

    const { error: rpcErr } = await supabase.rpc("vicelink_verify_console_handle", {
      p_platform: platform,
      p_handle: cleanHandle
    });

    if (rpcErr) {
      if (rpcErr.code === "22023") {
        return apiError("INVALID_INPUT", 400, rpcErr.message);
      }
      throw rpcErr;
    }

    const [{ profile }, aal] = await Promise.all([
      ensureProfileAndProgress(supabase, user),
      getAuthenticatorAssuranceLevel(supabase)
    ]);

    return apiJson({
      ok: true,
      platform,
      handle: cleanHandle,
      verificationCode: profile.verification_code,
      profile: mapProfileRow(profile, aal)
    });
  } catch (err) {
    return apiError(
      "CONSOLE_VERIFY_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to verify console handle"
    );
  }
}
