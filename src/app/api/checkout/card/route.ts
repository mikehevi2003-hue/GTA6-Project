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
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";

const checkoutSchema = z.object({
  targetTier: z.enum(["street", "kingpin"])
});

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

    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "targetTier must be 'street' or 'kingpin'.");
    }

    const { targetTier } = parsed.data;
    const { profile } = await ensureProfileAndProgress(supabase, user);

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
    const stripe = getStripe();

    const useConfiguredPrice =
      Boolean(plan.stripePriceId) && !plan.stripePriceId!.startsWith("price_optional_");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      ...(profile.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: profile.email || user.email || undefined }),
      metadata: {
        userId: user.id,
        targetTier
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          targetTier
        }
      },
      line_items: [
        useConfiguredPrice
          ? { price: plan.stripePriceId!, quantity: 1 }
          : {
              price_data: {
                currency: plan.currency,
                unit_amount: plan.amountCents,
                product_data: {
                  name: plan.name,
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
          amount_usd: plan.amountUsd,
          currency: "USD",
          status: "pending",
          raw_payload: { sessionId: session.id }
        },
        { onConflict: "provider_order_id", ignoreDuplicates: true }
      );
    }

    return apiJson({ url: session.url });
  } catch (err) {
    return apiError(
      "CARD_CHECKOUT_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to create card checkout session"
    );
  }
}
