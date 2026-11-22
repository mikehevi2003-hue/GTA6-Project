import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  recordAdminAuditLog,
  requireAdminUser
} from "@/lib/supabase/server";

const toggleBanSchema = z.object({
  userId: z.string().uuid(),
  isBanned: z.boolean(),
  reason: z.string().max(250).optional()
});

const redactCommentSchema = z.object({
  commentId: z.string().uuid(),
  deleteComment: z.boolean().optional().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const rl = checkRateLimit(`admin-ban:${user.id}`, 60, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many moderation requests; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    // 1. Comment Moderation / Redaction path
    const parsedComment = redactCommentSchema.safeParse(rawBody);
    if (parsedComment.success) {
      const { commentId } = parsedComment.data;

      const { error: rpcErr } = await supabase.rpc("vicelink_admin_redact_comment", {
        p_comment_id: commentId
      });

      if (rpcErr) {
        if (rpcErr.code === "P0002") {
          return apiError("COMMENT_NOT_FOUND", 404, "Target comment not found.");
        }
        if (rpcErr.code === "42501") {
          return apiError("FORBIDDEN", 403, "Admin privileges required.");
        }
        if (isAdminConfigured()) {
          const adminClient = getSupabaseAdmin();
          const { error: fallbackErr } = await adminClient
            .from("vicelink_comments")
            .update({ body: "[Removed by ViceLink Moderator]", gif_id: "" })
            .eq("id", commentId);
          if (fallbackErr) throw fallbackErr;
        } else {
          throw rpcErr;
        }
      }

      await recordAdminAuditLog(supabase, {
        adminId: user.id,
        adminEmail: admin.profile.email,
        actionType: "COMMENT_MODERATED",
        targetId: commentId,
        details: { action: "redact" }
      });

      return apiJson({
        ok: true,
        commentId,
        redacted: true
      });
    }

    // 2. User Ban / Unban Toggle path
    const parsedBan = toggleBanSchema.safeParse(rawBody);
    if (!parsedBan.success) {
      return apiError("INVALID_INPUT", 400, "Valid userId + isBanned boolean (or commentId) required.");
    }

    const { userId, isBanned, reason: rawReason } = parsedBan.data;
    if (rawReason && containsDisallowedMarkup(rawReason)) {
      return apiError("INVALID_INPUT", 400, "Reason may not contain HTML or script markup.");
    }
    const reason = rawReason ? sanitizePlainText(rawReason, 200) : "";

    const { data: updatedBan, error: banErr } = await supabase.rpc("vicelink_admin_toggle_ban", {
      p_target_user_id: userId,
      p_is_banned: isBanned
    });

    if (banErr) {
      if (banErr.code === "42501") {
        return apiError("FORBIDDEN", 403, banErr.message || "Cannot modify ban state for this account.");
      }
      if (banErr.code === "P0002") {
        return apiError("USER_NOT_FOUND", 404, "Target user profile not found.");
      }
      throw banErr;
    }

    const finalBanState = typeof updatedBan === "boolean" ? updatedBan : isBanned;

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email,
      actionType: finalBanState ? "USER_BANNED" : "USER_UNBANNED",
      targetId: userId,
      details: {
        isBanned: finalBanState,
        ...(reason ? { reason } : {})
      }
    });

    return apiJson({
      ok: true,
      userId,
      isBanned: finalBanState
    });
  } catch (err) {
    return apiError(
      "ADMIN_MODERATION_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to execute moderation action"
    );
  }
}
