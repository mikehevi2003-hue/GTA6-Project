import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import type { Json } from "@/lib/supabase/client";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  loadSiteSettings,
  recordAdminAuditLog,
  requireAdminAal2
} from "@/lib/supabase/server";

const patchSettingsSchema = z.object({
  globalBanner: z
    .object({
      active: z.boolean(),
      textEn: z.string().max(260),
      textEs: z.string().max(260)
    })
    .optional(),
  freeAiDailyLimit: z.coerce.number().int().min(1).max(50).optional(),
  maintenanceMode: z.boolean().optional(),
  glitchesTabEnabled: z.boolean().optional()
});

export async function GET() {
  try {
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

    const siteSettings = await loadSiteSettings(supabase);
    return apiJson({ siteSettings });
  } catch (err) {
    return apiError(
      "ADMIN_SETTINGS_LOAD_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load site settings"
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
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

    const rl = checkRateLimit(`admin-settings:${user.id}`, 60, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many settings updates; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = patchSettingsSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid site settings payload.");
    }

    const input = parsed.data;
    const rowsToUpsert: {
      key: string;
      value: Json;
      updated_by: string;
      updated_at: string;
    }[] = [];
    const nowIso = new Date().toISOString();
    const auditDetails: Record<string, unknown> = {};

    if (input.globalBanner !== undefined) {
      if (
        containsDisallowedMarkup(input.globalBanner.textEn) ||
        containsDisallowedMarkup(input.globalBanner.textEs)
      ) {
        return apiError("INVALID_INPUT", 400, "Global banner text may not contain HTML or script markup.");
      }

      const textEn = sanitizePlainText(input.globalBanner.textEn, 240);
      const textEs = sanitizePlainText(input.globalBanner.textEs, 240);
      if (textEn.length < 2 || textEs.length < 2) {
        return apiError("INVALID_INPUT", 400, "Bilingual EN and ES banner messages (2+ chars) are required.");
      }

      const bannerValue = {
        active: input.globalBanner.active,
        textEn,
        textEs
      };

      rowsToUpsert.push({
        key: "global_banner",
        value: bannerValue,
        updated_by: admin.profile.email,
        updated_at: nowIso
      });
      auditDetails.globalBanner = bannerValue;
    }

    if (input.freeAiDailyLimit !== undefined) {
      const clampedLimit = Math.min(50, Math.max(1, Math.round(input.freeAiDailyLimit)));
      rowsToUpsert.push({
        key: "free_ai_daily_limit",
        value: { limit: clampedLimit },
        updated_by: admin.profile.email,
        updated_at: nowIso
      });
      auditDetails.freeAiDailyLimit = clampedLimit;
    }

    if (input.maintenanceMode !== undefined) {
      rowsToUpsert.push({
        key: "maintenance_mode",
        value: { enabled: input.maintenanceMode },
        updated_by: admin.profile.email,
        updated_at: nowIso
      });
      auditDetails.maintenanceMode = input.maintenanceMode;
    }

    if (input.glitchesTabEnabled !== undefined) {
      rowsToUpsert.push({
        key: "glitches_tab_enabled",
        value: { enabled: input.glitchesTabEnabled },
        updated_by: admin.profile.email,
        updated_at: nowIso
      });
      auditDetails.glitchesTabEnabled = input.glitchesTabEnabled;
    }

    if (rowsToUpsert.length > 0) {
      const { error } = await supabase
        .from("vicelink_site_settings")
        .upsert(rowsToUpsert, { onConflict: "key" });

      if (error) throw error;

      await recordAdminAuditLog(supabase, {
        adminId: user.id,
        adminEmail: admin.profile.email,
        actionType: "SITE_SETTINGS_UPDATED",
        targetId: rowsToUpsert.map((r) => r.key).join(","),
        details: auditDetails
      });
    }

    const siteSettings = await loadSiteSettings(supabase);
    return apiJson({ siteSettings });
  } catch (err) {
    return apiError(
      "ADMIN_SETTINGS_UPDATE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to update site settings"
    );
  }
}
