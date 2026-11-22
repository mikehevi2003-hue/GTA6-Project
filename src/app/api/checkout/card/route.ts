import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hasAccess } from "@/lib/security/tier";
import { PLANS } from "@/lib/stripe/plans";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
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

    const rl = checkRateLimit(`checkout-card:${user.id}`, 10, 5 * 60_000);
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

    if (!isStripeConfigured()) {
      return apiError(
        "CARD_GATEWAY_NOT_CONFIGURED",
        503,
        "Card payment gateway (STRIPE_SECRET_KEY) is not configured yet."
      );
    }

    const origin = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(origin)) {
      return apiError("INVALID_ORIGIN", 500, "Invalid application origin configuration.");
    }

    const plan = PLANS[targetTier];
    const promo = await resolveValidPromoDiscount(supabase, promoCode, targetTier);
    const finalAmountUsd =
      promo && promo.discountPct < 100
        ? computePromoPriceUsd(plan.amountUsd, promo.discountPct)
        : plan.amountUsd;
    const finalAmountCents = Math.round(finalAmountUsd * 100);
    const waiverAcceptedAt = new Date().toISOString();

    const stripe = getStripe();

    const useConfiguredPrice =
      !promo &&
      Boolean(plan.stripePriceId) &&
      !plan.stripePriceId!.startsWith("price_optional_");

    const metadata = {
      userId: user.id,
      targetTier,
      waiverAccepted: "true",
      waiverAcceptedAt,
      waiverPolicyVersion: WAIVER_POLICY_VERSION,
      promoCode: promo?.code ?? "",
      discountPct: String(promo?.discountPct ?? 0)
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      ...(profile.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: profile.email || user.email || undefined }),
      metadata,
      payment_intent_data: {
        metadata
      },
      line_items: [
        useConfiguredPrice
          ? { price: plan.stripePriceId!, quantity: 1 }
          : {
              price_data: {
                currency: plan.currency,
                unit_amount: finalAmountCents,
                product_data: {
                  name: promo ? `${plan.name} (Promo ${promo.code} -${promo.discountPct}%)` : plan.name,
                  description: plan.description
                }
              },
              quantity: 1
            }
      ],
      success_url: `${origin}/?checkout=success&tier=${targetTier}`,
      cancel_url: `${origin}/?checkout=canceled`
    });

    if (!session.url) {
      return apiError("STRIPE_SESSION_FAILED", 502, "Stripe did not return a checkout URL.");
    }

    if (isAdminConfigured()) {
      const admin = getSupabaseAdmin();
      await admin.from("vicelink_transactions").upsert(
        {
          user_id: user.id,
          provider: "stripe",
          provider_order_id: session.id,
          target_tier: targetTier,
          amount_usd: finalAmountUsd,
          currency: "USD",
          status: "pending",
          raw_payload: {
            sessionId: session.id,
            waiverAccepted: true,
            waiverAcceptedAt,
            waiverPolicyVersion: WAIVER_POLICY_VERSION,
            promoCode: promo?.code ?? null,
            discountPct: promo?.discountPct ?? 0
          }
        },
        { onConflict: "provider_order_id", ignoreDuplicates: true }
      );
    }

    return apiJson({ url: session.url, amountUsd: finalAmountUsd });
  } catch (err) {
    return apiError(
      "CARD_CHECKOUT_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to create card checkout session"
    );
  }
}
