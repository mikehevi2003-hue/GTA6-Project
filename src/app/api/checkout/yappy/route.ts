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
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";
import type { YappyCheckoutResponse } from "@/types/vicelink";

const checkoutSchema = z.object({
  targetTier: z.enum(["street", "kingpin"])
});

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
    const orderId = generateYappyOrderId();
    const domainUrl = (
      process.env.YAPPY_DOMAIN_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin
    ).replace(/\/+$/, "");

    const yappyInit = await initiateYappyCheckout({
      orderId,
      amountUsd: plan.amountUsd,
      domainUrl
    });

    const admin = getSupabaseAdmin();
    const { error: txErr } = await admin.from("vicelink_transactions").insert({
      user_id: user.id,
      provider: "yappy",
      provider_order_id: orderId,
      target_tier: targetTier,
      amount_usd: plan.amountUsd,
      currency: "USD",
      status: "pending",
      raw_payload: {
        transactionId: yappyInit.transactionId,
        documentName: yappyInit.documentName,
        domainUrl
      }
    });
    if (txErr) throw txErr;

    const payload: YappyCheckoutResponse = {
      orderId,
      transactionId: yappyInit.transactionId,
      token: yappyInit.token,
      documentName: yappyInit.documentName,
      amountUsd: plan.amountUsd
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
