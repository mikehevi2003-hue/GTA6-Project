import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { UserTier } from "@/types/vicelink";
import type { Database, Json, VicelinkSupabaseClient } from "./client";

/**
 * Service-role Supabase client. BYPASSES RLS — server-only, used exclusively
 * for payment ledger writes, tier upgrades and webhook completion.
 * Never import this from a Client Component (enforced by "server-only").
 */

let adminClient: VicelinkSupabaseClient | null = null;

function adminKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && adminKey());
}

export function getSupabaseAdmin(): VicelinkSupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = adminKey();
  if (!url || !key) {
    throw new Error(
      "Supabase admin client is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) on the server."
    );
  }

  adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return adminClient;
}

export async function completePaymentAndUpgrade(params: {
  provider: "yappy" | "tilopay" | "paguelofacil" | "stripe";
  providerOrderId: string;
  userId: string;
  targetTier: "street" | "kingpin";
  amountUsd: number;
  rawPayload: Json;
  stripeCustomerId?: string;
}): Promise<UserTier> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.rpc("vicelink_complete_payment", {
    p_provider: params.provider,
    p_provider_order_id: params.providerOrderId,
    p_user_id: params.userId,
    p_target_tier: params.targetTier,
    p_amount_usd: params.amountUsd,
    p_raw_payload: params.rawPayload
  });

  if (error) throw error;

  if (params.stripeCustomerId) {
    await admin
      .from("vicelink_profiles")
      .update({ stripe_customer_id: params.stripeCustomerId })
      .eq("user_id", params.userId)
      .is("stripe_customer_id", null);
  }

  return data;
}
