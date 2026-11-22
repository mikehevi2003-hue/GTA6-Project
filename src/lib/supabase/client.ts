import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Typed schema for the ViceLink tables (supabase/migrations/20261121000001).
// Only vicelink_* objects are described: the shared project's other tables
// are intentionally unreachable through these typed clients.
// ---------------------------------------------------------------------------

type TierText = "free" | "street" | "kingpin";
type PaidTierText = "street" | "kingpin";
type ProviderText = "yappy" | "tilopay" | "paguelofacil" | "stripe";
type PaymentStatusText = "pending" | "completed" | "failed" | "refunded";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VicelinkProfileRow = {
  user_id: string;
  email: string;
  handle: string;
  display_name: string;
  access_tier: TierText;
  preferred_lang: "en" | "es";
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type VicelinkTransactionRow = {
  id: string;
  user_id: string;
  provider: ProviderText;
  provider_order_id: string;
  target_tier: PaidTierText;
  amount_usd: number;
  currency: string;
  status: PaymentStatusText;
  raw_payload: Json | null;
  created_at: string;
};

export type VicelinkProgressRow = {
  user_id: string;
  favorites: string[];
  unlocked_cheats: string[];
  found_pins: string[];
  planned_vehicles: string[];
  planned_props: string[];
  updated_at: string;
};

export type VicelinkAiUsageRow = { user_id: string; usage_date: string; count: number };
export type VicelinkGlitchVoteRow = { glitch_id: string; user_id: string; created_at: string };
export type VicelinkTheoryRow = {
  id: string;
  user_id: string;
  author_handle: string;
  title: string;
  tag: string;
  coords: string;
  body: string;
  created_at: string;
};
export type VicelinkTheoryVoteRow = { theory_id: string; user_id: string };
export type VicelinkTheoryReactionRow = { theory_id: string; user_id: string; emoji: string };
export type VicelinkCommentRow = {
  id: string;
  theory_id: string;
  user_id: string;
  author_handle: string;
  body: string;
  gif_id: string;
  created_at: string;
};
export type VicelinkCommentLikeRow = { comment_id: string; user_id: string };

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      vicelink_profiles: Table<
        VicelinkProfileRow,
        {
          user_id: string;
          email: string;
          handle: string;
          display_name?: string;
          access_tier?: TierText;
          preferred_lang?: "en" | "es";
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      vicelink_transactions: Table<
        VicelinkTransactionRow,
        {
          id?: string;
          user_id: string;
          provider: ProviderText;
          provider_order_id: string;
          target_tier: PaidTierText;
          amount_usd: number;
          currency?: string;
          status?: PaymentStatusText;
          raw_payload?: Json | null;
          created_at?: string;
        }
      >;
      vicelink_progress: Table<
        VicelinkProgressRow,
        {
          user_id: string;
          favorites?: string[];
          unlocked_cheats?: string[];
          found_pins?: string[];
          planned_vehicles?: string[];
          planned_props?: string[];
          updated_at?: string;
        }
      >;
      vicelink_ai_usage: Table<VicelinkAiUsageRow, { user_id: string; usage_date?: string; count?: number }>;
      vicelink_glitch_votes: Table<VicelinkGlitchVoteRow, { glitch_id: string; user_id: string; created_at?: string }>;
      vicelink_theories: Table<
        VicelinkTheoryRow,
        {
          id: string;
          user_id: string;
          author_handle: string;
          title: string;
          tag: string;
          coords?: string;
          body: string;
          created_at?: string;
        }
      >;
      vicelink_theory_votes: Table<VicelinkTheoryVoteRow, VicelinkTheoryVoteRow>;
      vicelink_theory_reactions: Table<VicelinkTheoryReactionRow, VicelinkTheoryReactionRow>;
      vicelink_comments: Table<
        VicelinkCommentRow,
        {
          id?: string;
          theory_id: string;
          user_id: string;
          author_handle: string;
          body?: string;
          gif_id?: string;
          created_at?: string;
        }
      >;
      vicelink_comment_likes: Table<VicelinkCommentLikeRow, VicelinkCommentLikeRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      vicelink_consume_ai_quota: {
        Args: Record<string, never>;
        Returns: { used: number; quota_limit: number | null; allowed: boolean; tier: TierText }[];
      };
      vicelink_author_tiers: {
        Args: { p_user_ids: string[] };
        Returns: { user_id: string; handle: string; access_tier: TierText }[];
      };
      vicelink_complete_payment: {
        Args: {
          p_provider: ProviderText;
          p_provider_order_id: string;
          p_user_id: string;
          p_target_tier: PaidTierText;
          p_amount_usd: number;
          p_raw_payload: Json;
        };
        Returns: TierText;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type VicelinkSupabaseClient = SupabaseClient<Database>;

function publicSupabaseConfig(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
  return { url, key };
}

/** Browser Supabase client (publishable/anon key only — never the secret key). */
export function createClient(): VicelinkSupabaseClient {
  const { url, key } = publicSupabaseConfig();
  return createBrowserClient<Database>(url, key);
}
