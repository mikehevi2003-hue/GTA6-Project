import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  generateYappyOrderId,
  initiateYappyCheckout,
  isYappyConfigured,
  YappyApiError
} from "@/lib/payments/yappy";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hasAccess } from "@/lib/security/tier";
import { PLANS } from "@/lib/stripe/plans";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import {
  apiError,
  apiJson,
  computePromoPriceUsd,
  createClient,
  DEFAULT_PROMO_CODES,
  ensureProfileAndProgress,
  getAuthedUser,
   type VicelinkSupabaseClient
} from "@/lib/supabase/server";
import type { YappyCheckoutResponse } from "@/types/vicelink";

const WAIVER_POLICY_VERSION = "2026-11-21-NO-REFUND-INTL";

const checkoutSchema = z.object({
  targetTier: z.enum(["street", "kingpin"]),
  waiverAccepted: z.literal(true),
  promoCode: z.string().trim().max(32).optional()
});

async function resolveValidPromoDiscount(
  supabase: VicelinkSupabaseClient,
  rawPromoCode: string | undefined,
  targetTier: "street" | "kingpin"
): Promise<{ code: string; discountPct: number } | null> {
  if (!rawPromoCode) return null;
  const code = rawPromoCode.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return null;

  try {
    const { data, error } = await supabase
      .from("vicelink_promo_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (!error && data) {
      const expired = data.expires_at ? new Date(data.expires_at).getTime() < Date.now() : false;
      const tierMatches = data.target_tier === "both" || data.target_tier === targetTier;
      if (data.active && !expired && data.uses_count < data.max_uses && tierMatches) {
        return { code: data.code, discountPct: Number(data.discount_pct) };
      }
      return null;
    }
  } catch {
    // Fall back to default seeded promos
  }

  const fallback = DEFAULT_PROMO_CODES.find(
    (p) =>
      p.code === code &&
      p.active &&
      (p.targetTier === "both" || p.targetTier === targetTier)
  );
  return fallback ? { code: fallback.code, discountPct: fallback.discountPct } : null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`checkout-yappy:${user.id}`, 10, 5 * 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many checkout attempts; please wait a few minutes.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    if (
      typeof rawBody !== "object" ||
      rawBody === null ||
      (rawBody as Record<string, unknown>).waiverAccepted !== true
    ) {
      return apiError(
        "WAIVER_REQUIRED",
        400,
        "You must accept the All-Sales-Final / Immediate Digital Access No-Refund Waiver before checkout."
      );
    }

    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "targetTier must be 'street' or 'kingpin' and waiverAccepted must be true.");
    }

    const { targetTier, promoCode } = parsed.data;
    const { profile } = await ensureProfileAndProgress(supabase, user);

    if (profile.is_banned) {
      return apiError("ACCOUNT_BANNED", 403, "Your ViceLink account has been suspended.");
    }

    if (hasAccess(profile.access_tier, targetTier)) {
      return apiError(
        "ALREADY_OWNED",
        409,
        "Your account already includes this access tier or higher."
      );
    }

    if (!isYappyConfigured()) {
      return apiError(
        "YAPPY_NOT_CONFIGURED",
        503,
        "Banco General Yappy Comercial (YAPPY_MERCHANT_ID / YAPPY_SECRET_KEY) is not configured yet."
      );
    }

    if (!isAdminConfigured()) {
      return apiError(
        "ADMIN_NOT_CONFIGURED",
        503,
        "Server payment ledger requires SUPABASE_SECRET_KEY."
      );
    }

    const plan = PLANS[targetTier];
    const promo = await resolveValidPromoDiscount(supabase, promoCode, targetTier);
    const finalAmountUsd =
      promo && promo.discountPct < 100
        ? computePromoPriceUsd(plan.amountUsd, promo.discountPct)
        : plan.amountUsd;
    const waiverAcceptedAt = new Date().toISOString();

    const orderId = generateYappyOrderId();
    const domainUrl = (
      process.env.YAPPY_DOMAIN_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin
    ).replace(/\/+$/, "");

    const yappyInit = await initiateYappyCheckout({
      orderId,
      amountUsd: finalAmountUsd,
      domainUrl
    });

    const admin = getSupabaseAdmin();
    const { error: txErr } = await admin.from("vicelink_transactions").insert({
      user_id: user.id,
      provider: "yappy",
      provider_order_id: orderId,
      target_tier: targetTier,
      amount_usd: finalAmountUsd,
      currency: "USD",
      status: "pending",
      raw_payload: {
        transactionId: yappyInit.transactionId,
        documentName: yappyInit.documentName,
        domainUrl,
        waiverAccepted: true,
        waiverAcceptedAt,
        waiverPolicyVersion: WAIVER_POLICY_VERSION,
        promoCode: promo?.code ?? null,
        discountPct: promo?.discountPct ?? 0
      }
    });
    if (txErr) throw txErr;

    const payload: YappyCheckoutResponse = {
      orderId,
      transactionId: yappyInit.transactionId,
      token: yappyInit.token,
      documentName: yappyInit.documentName,
      amountUsd: finalAmountUsd
    };
    return apiJson(payload);
  } catch (err) {
    if (err instanceof YappyApiError) {
      return apiError(err.code, 502, err.message);
    }
    return apiError(
      "YAPPY_CHECKOUT_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to initialize Yappy checkout"
    );
  }
}
