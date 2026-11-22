import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  recordAdminAuditLog,
  requireAdminUser
} from "@/lib/supabase/server";

const grantTierSchema = z.object({
  userId: z.string().uuid(),
  targetTier: z.enum(["free", "street", "kingpin"]),
  provider: z.enum(["yappy", "tilopay", "paguelofacil", "stripe"]).optional().default("yappy"),
  reference: z.string().max(250).optional().default("")
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const rl = checkRateLimit(`admin-grant:${user.id}`, 60, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many tier grant requests; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = grantTierSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid tier grant payload.");
    }

    const { userId, targetTier, provider, reference: rawReference } = parsed.data;
    if (containsDisallowedMarkup(rawReference)) {
      return apiError("INVALID_INPUT", 400, "Reference may not contain HTML or script markup.");
    }

    const reference = sanitizePlainText(rawReference, 200);

    const { data: updatedTier, error } = await supabase.rpc("vicelink_admin_grant_tier", {
      p_target_user_id: userId,
      p_target_tier: targetTier,
      p_provider: provider,
      p_reference: reference
    });

    if (error) {
      if (error.code === "42501") {
        return apiError("FORBIDDEN", 403, "Admin privileges required.");
      }
      if (error.code === "P0002") {
        return apiError("USER_NOT_FOUND", 404, "Target user profile not found.");
      }
      if (error.code === "22023") {
        return apiError("INVALID_INPUT", 400, error.message);
      }
      throw error;
    }

    const finalTier = updatedTier ?? targetTier;

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email,
      actionType: "VIP_TIER_GRANTED",
      targetId: userId,
      details: {
        targetTier: finalTier,
        provider,
        ...(reference ? { reference } : {})
      }
    });

    return apiJson({
      userId,
      tier: finalTier
    });
  } catch (err) {
    return apiError(
      "ADMIN_GRANT_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to grant user tier"
    );
  }
}
