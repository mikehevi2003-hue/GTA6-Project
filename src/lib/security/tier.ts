import type { UserTier } from "@/types/vicelink";

export const TIER_RANK: Record<UserTier, number> = { free: 0, street: 1, kingpin: 2 };

export function isUserTier(value: unknown): value is UserTier {
  return value === "free" || value === "street" || value === "kingpin";
}

export function hasAccess(userTier: UserTier, requiredTier: UserTier): boolean {
  const have = TIER_RANK[userTier];
  const need = TIER_RANK[requiredTier];
  if (have === undefined || need === undefined) return false;
  return have >= need;
}

/** Returns the higher of two tiers (used so payments never downgrade). */
export function maxTier(a: UserTier, b: UserTier): UserTier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

export const AI_DAILY_LIMIT_FREE = 3;
