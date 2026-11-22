import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { PLANS } from "@/lib/stripe/plans";
import {
  apiError,
  apiJson,
  computePromoPriceUsd,
  createClient,
  DEFAULT_PROMO_CODES,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";
import type { PromoValidationResult, UserTier } from "@/types/vicelink";

const PROMO_CODE_REGEX = /^[A-Z0-9_-]{3,24}$/;

const applyPromoSchema = z.object({
  code: z.string().trim().min(1).max(32),
  targetTier: z.enum(["street", "kingpin", "both"]).optional()
});

function buildInvalidPromoResult(
  code: string,
  errorCode: string,
  targetTier: "street" | "kingpin" | "both" = "both"
): PromoValidationResult {
  const messages: Record<string, { en: string; es: string }> = {
    INVALID_CODE: {
      en: "Invalid or inactive promo code. Check spelling (e.g. PANAMA50 or LEONIDA25).",
      es: "Código promocional inválido o inactivo. Verifica cómo está escrito (ej. PANAMA50 o LEONIDA25)."
    },
    CODE_EXPIRED: {
      en: "This promo code has expired.",
      es: "Este código promocional ha expirado."
    },
    MAX_USES_REACHED: {
      en: "This promo code has reached its maximum redemption limit.",
      es: "Este código promocional alcanzó su límite máximo de canjes."
    },
    TIER_MISMATCH: {
      en: `This promo code applies only to the ${targetTier.toUpperCase()} tier.`,
      es: `Este código promocional aplica únicamente al nivel ${targetTier.toUpperCase()}.`
    },
    ALREADY_REDEEMED: {
      en: "You have already redeemed this promo code on your account.",
      es: "Ya has canjeado este código promocional en tu cuenta."
    }
  };

  const msg = messages[errorCode] ?? messages.INVALID_CODE!;

  return {
    valid: false,
    code,
    discountPct: 0,
    targetTier,
    streetDiscountedUsd: PLANS.street.amountUsd,
    kingpinDiscountedUsd: PLANS.kingpin.amountUsd,
    instantUnlock: false,
    messageEn: msg.en,
    messageEs: msg.es
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`promo-apply:${user.id}`, 25, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many promo code attempts; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = applyPromoSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Please enter a promo code.");
    }

    const code = parsed.data.code.trim().toUpperCase();
    const requestedTier = parsed.data.targetTier ?? "kingpin";

    if (!PROMO_CODE_REGEX.test(code)) {
      return apiJson(buildInvalidPromoResult(code, "INVALID_CODE"));
    }

    const { profile } = await ensureProfileAndProgress(supabase, user);
    if (profile.is_banned) {
      return apiError("ACCOUNT_BANNED", 403, "Your ViceLink account has been suspended.");
    }

    const rpcRes = await supabase.rpc("vicelink_redeem_promo_code", {
      p_code: code,
      p_target_tier: requestedTier === "both" ? "kingpin" : requestedTier
    });

    if (!rpcRes.error && rpcRes.data && rpcRes.data.length > 0) {
      const row = rpcRes.data[0]!;
      if (!row.valid) {
        return apiJson(
          buildInvalidPromoResult(row.code || code, row.error_code || "INVALID_CODE", row.target_tier)
        );
      }

      const discountPct = Number(row.discount_pct);
      const streetDiscountedUsd =
        row.target_tier === "kingpin"
          ? PLANS.street.amountUsd
          : computePromoPriceUsd(PLANS.street.amountUsd, discountPct);
      const kingpinDiscountedUsd =
        row.target_tier === "street"
          ? PLANS.kingpin.amountUsd
          : computePromoPriceUsd(PLANS.kingpin.amountUsd, discountPct);

      const instantUnlock = Boolean(row.instant_unlock);
      const unlockedTier = (row.unlocked_tier ?? undefined) as UserTier | undefined;

      const result: PromoValidationResult = {
        valid: true,
        code: row.code,
        discountPct,
        targetTier: row.target_tier,
        streetDiscountedUsd,
        kingpinDiscountedUsd,
        instantUnlock,
        ...(unlockedTier ? { unlockedTier } : {}),
        messageEn: instantUnlock
          ? `Code ${row.code} redeemed! 100% VIP access (${(unlockedTier ?? "kingpin").toUpperCase()}) unlocked immediately ($0.00).`
          : `Code ${row.code} applied (-${discountPct}% off): Street Pass $${streetDiscountedUsd.toFixed(2)} USD • Kingpin VIP $${kingpinDiscountedUsd.toFixed(2)} USD.`,
        messageEs: instantUnlock
          ? `¡Código ${row.code} canjeado! Acceso VIP del 100% (${(unlockedTier ?? "kingpin").toUpperCase()}) desbloqueado al instante ($0.00).`
          : `Código ${row.code} aplicado (-${discountPct}% desc.): Street Pass $${streetDiscountedUsd.toFixed(2)} USD • Kingpin VIP $${kingpinDiscountedUsd.toFixed(2)} USD.`
      };

      return apiJson(result);
    }

    // Fallback check against seeded promo table / defaults if RPC is not yet migrated
    const fallbackPromo = DEFAULT_PROMO_CODES.find((p) => p.code === code && p.active);
    if (!fallbackPromo) {
      return apiJson(buildInvalidPromoResult(code, "INVALID_CODE"));
    }

    const discountPct = fallbackPromo.discountPct;
    const streetDiscountedUsd =
      fallbackPromo.targetTier === "kingpin"
        ? PLANS.street.amountUsd
        : computePromoPriceUsd(PLANS.street.amountUsd, discountPct);
    const kingpinDiscountedUsd =
      fallbackPromo.targetTier === "street"
        ? PLANS.kingpin.amountUsd
        : computePromoPriceUsd(PLANS.kingpin.amountUsd, discountPct);
    const instantUnlock = discountPct === 100;
    const unlockedTier: UserTier | undefined = instantUnlock
      ? fallbackPromo.targetTier === "street"
        ? "street"
        : "kingpin"
      : undefined;

    return apiJson<PromoValidationResult>({
      valid: true,
      code: fallbackPromo.code,
      discountPct,
      targetTier: fallbackPromo.targetTier,
      streetDiscountedUsd,
      kingpinDiscountedUsd,
      instantUnlock,
      ...(unlockedTier ? { unlockedTier } : {}),
      messageEn: instantUnlock
        ? `Code ${fallbackPromo.code} redeemed! 100% VIP access unlocked ($0.00).`
        : `Code ${fallbackPromo.code} applied (-${discountPct}% off): Street Pass $${streetDiscountedUsd.toFixed(2)} USD • Kingpin VIP $${kingpinDiscountedUsd.toFixed(2)} USD.`,
      messageEs: instantUnlock
        ? `¡Código ${fallbackPromo.code} canjeado! Acceso VIP del 100% desbloqueado ($0.00).`
        : `Código ${fallbackPromo.code} aplicado (-${discountPct}% desc.): Street Pass $${streetDiscountedUsd.toFixed(2)} USD • Kingpin VIP $${kingpinDiscountedUsd.toFixed(2)} USD.`
    });
  } catch (err) {
    return apiError(
      "PROMO_APPLY_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to validate promo code"
    );
  }
}
