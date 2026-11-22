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
  requireAdminAal2
} from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

const patchSubmissionSchema = z.object({
  status: z.enum(["pending", "approved", "implemented", "rejected"]),
  adminNotes: z.string().max(600).optional().default("")
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const parsedId = uuidSchema.safeParse(rawId);
    if (!parsedId.success) {
      return apiError("INVALID_INPUT", 400, "Invalid submission id.");
    }
    const submissionId = parsedId.data;

    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const adminCheck = await requireAdminAal2(supabase, user);
    if (!adminCheck.ok) {
      return apiError(adminCheck.error, adminCheck.status, adminCheck.message, {
        aal: adminCheck.aal,
        setupUrl: adminCheck.setupUrl
      });
    }
    const admin = adminCheck;

    const rl = checkRateLimit(`admin-sub:${user.id}`, 120, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many admin actions; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = patchSubmissionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid moderation payload.");
    }

    if (containsDisallowedMarkup(parsed.data.adminNotes)) {
      return apiError("INVALID_INPUT", 400, "Admin notes may not contain HTML or script markup.");
    }

    const adminNotes = sanitizePlainText(parsed.data.adminNotes, 500);

    const { data, error } = await supabase
      .from("vicelink_community_submissions")
      .update({
        status: parsed.data.status,
        admin_notes: adminNotes
      })
      .eq("id", submissionId)
      .select("id, status, admin_notes")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return apiError("SUBMISSION_NOT_FOUND", 404, "Community submission not found.");
    }

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email,
      actionType: "SUBMISSION_MODERATED",
      targetId: submissionId,
      details: {
        status: data.status,
        ...(adminNotes ? { adminNotes } : {})
      }
    });

    return apiJson({
      id: data.id,
      status: data.status,
      adminNotes: data.admin_notes
    });
  } catch (err) {
    return apiError(
      "ADMIN_SUBMISSION_UPDATE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to update submission status"
    );
  }
}
