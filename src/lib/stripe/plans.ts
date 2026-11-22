import type { UserTier } from "@/types/vicelink";

export type PaidTier = Exclude<UserTier, "free">;

export type Plan = {
  tier: PaidTier;
  name: string;
  amountCents: number;
  amountUsd: number;
  currency: "usd";
  description: string;
  /** Optional pre-created Stripe Price id; inline price_data is used otherwise. */
  stripePriceId?: string;
};

export const PLANS: Record<PaidTier, Plan> = {
  street: {
    tier: "street",
    name: "ViceLink Street Pass",
    amountCents: 199,
    amountUsd: 1.99,
    currency: "usd",
    description: "One-time unlock: all 32 map pins, Glitches Hub, full Garage & Properties ROI.",
    stripePriceId: process.env.STRIPE_PRICE_STREET_PASS || undefined
  },
  kingpin: {
    tier: "kingpin",
    name: "ViceLink Kingpin VIP",
    amountCents: 499,
    amountUsd: 4.99,
    currency: "usd",
    description: "One-time unlock: everything in Street Pass + Social Studio + unlimited Leonida AI.",
    stripePriceId: process.env.STRIPE_PRICE_KINGPIN_VIP || undefined
  }
};

export function isPaidTier(value: unknown): value is PaidTier {
  return value === "street" || value === "kingpin";
}
