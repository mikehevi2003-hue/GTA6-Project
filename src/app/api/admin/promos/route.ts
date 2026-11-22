import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  loadPromoCodes,
  mapPromoCodeRow,
  recordAdminAuditLog,
  requireAdminUser
} from "@/lib/supabase/server";

const PROMO_CODE_REGEX = /^[A-Z0-9_-]{3,24}$/;

const createPromoSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => PROMO_CODE_REGEX.test(val), {
      message: "Promo code must be 3-24 uppercase alphanumeric, hyphen, or underscore characters."
    }),
  discountPct: z.coerce.number().int().min(1).max(100),
  targetTier: z.enum(["street", "kingpin", "both"]).default("both"),
  maxUses: z.coerce.number().int().min(1).max(100_000).default(100),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional().default(true)
});

const patchPromoSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => PROMO_CODE_REGEX.test(val), {
      message: "Valid promo code is required."
    }),
  active: z.boolean().optional(),
  discountPct: z.coerce.number().int().min(1).max(100).optional(),
  targetTier: z.enum(["street", "kingpin", "both"]).optional(),
  maxUses: z.coerce.number().int().min(1).max(100_000).optional(),
  expiresAt: z.string().datetime().nullable().optional()
});

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const promoCodes = await loadPromoCodes(supabase);
    return apiJson({ promoCodes });
  } catch (err) {
    return apiError(
      "ADMIN_PROMOS_LOAD_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load promo codes"
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const rl = checkRateLimit(`admin-promos:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many promo mutations; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = createPromoSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(
        "INVALID_INPUT",
        400,
        parsed.error.issues[0]?.message ?? "Invalid promo code configuration."
      );
    }

    const input = parsed.data;
    const { data: upserted, error } = await supabase
      .from("vicelink_promo_codes")
      .upsert(
        {
          code: input.code,
          discount_pct: input.discountPct,
          target_tier: input.targetTier,
          max_uses: input.maxUses,
          expires_at: input.expiresAt ?? null,
          active: input.active,
          created_by: admin.profile.email || user.email || "admin"
        },
        { onConflict: "code" }
      )
      .select("*")
      .single();

    if (error) throw error;

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email || user.email || "admin",
      actionType: "PROMO_CODE_UPSERTED",
      targetId: input.code,
      details: {
        discountPct: input.discountPct,
        targetTier: input.targetTier,
        maxUses: input.maxUses,
        active: input.active
      }
    });

    const promoCodes = await loadPromoCodes(supabase);
    return apiJson({
      ok: true,
      promoCode: mapPromoCodeRow(upserted),
      promoCodes
    });
  } catch (err) {
    return apiError(
      "ADMIN_PROMO_CREATE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to save promo code"
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = patchPromoSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid promo code update payload.");
    }

    const input = parsed.data;
    const patch: {
      active?: boolean;
      discount_pct?: number;
      target_tier?: "street" | "kingpin" | "both";
      max_uses?: number;
      expires_at?: string | null;
    } = {};

    if (input.active !== undefined) patch.active = input.active;
    if (input.discountPct !== undefined) patch.discount_pct = input.discountPct;
    if (input.targetTier !== undefined) patch.target_tier = input.targetTier;
    if (input.maxUses !== undefined) patch.max_uses = input.maxUses;
    if (input.expiresAt !== undefined) patch.expires_at = input.expiresAt;

    const { data: updated, error } = await supabase
      .from("vicelink_promo_codes")
      .update(patch)
      .eq("code", input.code)
      .select("*")
      .single();

    if (error) throw error;

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email || user.email || "admin",
      actionType: "PROMO_CODE_UPSERTED",
      targetId: input.code,
      details: patch
    });

    const promoCodes = await loadPromoCodes(supabase);
    return apiJson({
      ok: true,
      promoCode: mapPromoCodeRow(updated),
      promoCodes
    });
  } catch (err) {
    return apiError(
      "ADMIN_PROMO_UPDATE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to update promo code"
    );
  }
}
