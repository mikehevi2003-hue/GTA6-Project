import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { isPaidTier, PLANS } from "@/lib/stripe/plans";
import { getStripe, isStripeWebhookConfigured } from "@/lib/stripe/server";
import { completePaymentAndUpgrade, getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isStripeWebhookConfigured() || !isAdminConfigured()) {
    return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const userId = session.metadata?.userId || session.client_reference_id || "";
        const targetTier = session.metadata?.targetTier;

        if (!UUID_REGEX.test(userId) || !isPaidTier(targetTier)) {
          return NextResponse.json({ error: "INVALID_SESSION_METADATA" }, { status: 400 });
        }

        const plan = PLANS[targetTier];
        if (session.currency && session.currency.toLowerCase() !== "usd") {
          return NextResponse.json({ error: "UNEXPECTED_CURRENCY" }, { status: 400 });
        }
        if (typeof session.amount_total === "number" && session.amount_total < plan.amountCents) {
          return NextResponse.json({ error: "UNDERPAID_SESSION" }, { status: 400 });
        }

        const amountUsd =
          typeof session.amount_total === "number" ? session.amount_total / 100 : plan.amountUsd;

        await completePaymentAndUpgrade({
          provider: "stripe",
          providerOrderId: session.id,
          userId,
          targetTier,
          amountUsd,
          rawPayload: {
            eventId: event.id,
            type: event.type,
            sessionId: session.id,
            paymentStatus: session.payment_status
          },
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined
        });
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const admin = getSupabaseAdmin();
      await admin
        .from("vicelink_transactions")
        .update({
          status: "failed",
          raw_payload: { eventId: event.id, type: event.type, sessionId: session.id }
        })
        .eq("provider", "stripe")
        .eq("provider_order_id", session.id)
        .eq("status", "pending");
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "WEBHOOK_PROCESSING_FAILED",
        message: err instanceof Error ? err.message : "Failed to process webhook"
      },
      { status: 500 }
    );
  }
}
