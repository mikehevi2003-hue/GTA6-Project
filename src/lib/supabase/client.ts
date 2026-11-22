import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Typed schema for the ViceLink tables (supabase/migrations/20261121000001..000003).
// Only vicelink_* objects are described: the shared project's other tables
// are intentionally unreachable through these typed clients.
// ---------------------------------------------------------------------------

type TierText = "free" | "street" | "kingpin";
type PaidTierText = "street" | "kingpin";
type ProviderText = "yappy" | "tilopay" | "paguelofacil" | "stripe";
type PaymentStatusText = "pending" | "completed" | "failed" | "refunded";
type CheatCategoryText = "Player" | "Combat" | "Vehicles" | "World";
type GlitchCategoryText = "Money" | "Camera" | "Stealth" | "Physics";
type PinTypeText = "Money" | "ATM" | "RareCar" | "Fence" | "EasterEgg" | "Collectible";
type SubmissionTypeText =
  | "money_spot"
  | "glitch_report"
  | "easter_egg"
  | "cheat_combo"
  | "site_feedback";
type SubmissionStatusText = "pending" | "approved" | "implemented" | "rejected";
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VicelinkProfileRow = {
  user_id: string;
  email: string;
  handle: string;
  display_name: string;
  access_tier: TierText;
  is_admin: boolean;
  preferred_lang: "en" | "es";
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  avatar_preset: string;
  psn_id: string;
  psn_verified: boolean;
  xbox_gamertag: string;
  xbox_verified: boolean;
  social_club_handle: string;
  verification_code: string;
  mfa_enabled: boolean;
  is_banned: boolean;
  marketing_opt_in?: boolean;
  unsubscribe_token?: string;
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
  unlocked_trophies: string[];
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

export type VicelinkDynamicCheatRow = {
  id: string;
  title_en: string;
  title_es: string;
  category: CheatCategoryText;
  unlock_en: string;
  unlock_es: string;
  how_to_unlock_en: string;
  how_to_unlock_es: string;
  desc_en: string;
  desc_es: string;
  button_sequence: Json;
  updated_at: string;
};

export type VicelinkDynamicGlitchRow = {
  id: string;
  category: GlitchCategoryText;
  patch_status: string;
  is_patched: boolean;
  title_en: string;
  title_es: string;
  steps_en: Json;
  steps_es: Json;
  warning_en: string;
  warning_es: string;
  updated_at: string;
};

export type VicelinkDynamicMapPinRow = {
  id: string;
  tier: TierText;
  pin_type: PinTypeText;
  region: string;
  icon: string;
  coord_x: number;
  coord_y: number;
  name_en: string;
  name_es: string;
  note_en: string;
  note_es: string;
  created_at: string;
};

export type VicelinkCommunitySubmissionRow = {
  id: string;
  user_id: string | null;
  author_handle: string;
  submission_type: SubmissionTypeText;
  region_or_category: string;
  title: string;
  details: string;
  status: SubmissionStatusText;
  admin_notes: string;
  created_at: string;
};

export type VicelinkSubmissionVoteRow = {
  submission_id: string;
  user_id: string;
};

export type VicelinkAdminAuditLogRow = {
  id: string;
  admin_id: string | null;
  admin_email: string;
  action_type: string;
  target_id: string;
  details: Json;
  created_at: string;
};

export type VicelinkSiteSettingRow = {
  key: string;
  value: Json;
  updated_by: string;
  updated_at: string;
};

export type VicelinkPromoCodeRow = {
  code: string;
  discount_pct: number;
  target_tier: "street" | "kingpin" | "both";
  max_uses: number;
  uses_count: number;
  expires_at: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
};

export type VicelinkPromoRedemptionRow = {
  id: string;
  code: string;
  user_id: string;
  applied_tier: PaidTierText;
  discount_pct: number;
  created_at: string;
};

export type VicelinkEmailCampaignRow = {
  id: string;
  admin_id: string | null;
  admin_email: string;
  audience: "all_opted_in" | "free_only" | "street_only";
  subject_en: string;
  subject_es: string;
  body_en: string;
  body_es: string;
  promo_code: string;
  recipients_count: number;
  delivered_count: number;
  delivery_mode: "resend_live" | "dry_run_logged";
  created_at: string;
};

export type VicelinkPatchReportRow = {
  id: string;
  patch_version: string;
  source_url: string;
  source_type: string;
  raw_notes: string;
  ai_summary_en: string;
  ai_summary_es: string;
  confidence_score: number;
  status: "draft" | "auto_published" | "published" | "rolled_back" | "rejected";
  proposed_changes: Json;
  rollback_snapshot: Json;
  applied_count: number;
  created_by: string;
  created_at: string;
  applied_at: string | null;
  rolled_back_at: string | null;
};

export type VicelinkKeywordSearchRow = {
  id: string;
  user_id: string | null;
  area: string;
  keyword: string;
  result_count: number;
  lang: "en" | "es";
  created_at: string;
};

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
          is_admin?: boolean;
          preferred_lang?: "en" | "es";
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          avatar_preset?: string;
          psn_id?: string;
          psn_verified?: boolean;
          xbox_gamertag?: string;
          xbox_verified?: boolean;
          social_club_handle?: string;
          verification_code?: string;
          mfa_enabled?: boolean;
          is_banned?: boolean;
          marketing_opt_in?: boolean;
          unsubscribe_token?: string;
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
          unlocked_trophies?: string[];
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
      vicelink_dynamic_cheats: Table<
        VicelinkDynamicCheatRow,
        {
          id: string;
          title_en: string;
          title_es: string;
          category: CheatCategoryText;
          unlock_en?: string;
          unlock_es?: string;
          how_to_unlock_en?: string;
          how_to_unlock_es?: string;
          desc_en?: string;
          desc_es?: string;
          button_sequence?: Json;
          updated_at?: string;
        }
      >;
      vicelink_dynamic_glitches: Table<
        VicelinkDynamicGlitchRow,
        {
          id: string;
          category: GlitchCategoryText;
          patch_status?: string;
          is_patched?: boolean;
          title_en: string;
          title_es: string;
          steps_en?: Json;
          steps_es?: Json;
          warning_en?: string;
          warning_es?: string;
          updated_at?: string;
        }
      >;
      vicelink_dynamic_map_pins: Table<
        VicelinkDynamicMapPinRow,
        {
          id: string;
          tier?: TierText;
          pin_type: PinTypeText;
          region: string;
          icon: string;
          coord_x: number;
          coord_y: number;
          name_en: string;
          name_es: string;
          note_en?: string;
          note_es?: string;
          created_at?: string;
        }
      >;
      vicelink_community_submissions: Table<
        VicelinkCommunitySubmissionRow,
        {
          id?: string;
          user_id: string | null;
          author_handle: string;
          submission_type: SubmissionTypeText;
          region_or_category?: string;
          title: string;
          details: string;
          status?: SubmissionStatusText;
          admin_notes?: string;
          created_at?: string;
        }
      >;
      vicelink_submission_votes: Table<VicelinkSubmissionVoteRow, VicelinkSubmissionVoteRow>;
      vicelink_admin_audit_logs: Table<
        VicelinkAdminAuditLogRow,
        {
          id?: string;
          admin_id?: string | null;
          admin_email: string;
          action_type: string;
          target_id?: string;
          details?: Json;
          created_at?: string;
        }
      >;
      vicelink_site_settings: Table<
        VicelinkSiteSettingRow,
        {
          key: string;
          value: Json;
          updated_by?: string;
          updated_at?: string;
        }
      >;
      vicelink_promo_codes: Table<
        VicelinkPromoCodeRow,
        {
          code: string;
          discount_pct: number;
          target_tier?: "street" | "kingpin" | "both";
          max_uses?: number;
          uses_count?: number;
          expires_at?: string | null;
          active?: boolean;
          created_by?: string;
          created_at?: string;
        }
      >;
      vicelink_promo_redemptions: Table<
        VicelinkPromoRedemptionRow,
        {
          id?: string;
          code: string;
          user_id: string;
          applied_tier: PaidTierText;
          discount_pct: number;
          created_at?: string;
        }
      >;
      vicelink_email_campaigns: Table<
        VicelinkEmailCampaignRow,
        {
          id?: string;
          admin_id?: string | null;
          admin_email: string;
          audience: "all_opted_in" | "free_only" | "street_only";
          subject_en: string;
          subject_es: string;
          body_en: string;
          body_es: string;
          promo_code?: string;
          recipients_count?: number;
          delivered_count?: number;
          delivery_mode?: "resend_live" | "dry_run_logged";
          created_at?: string;
        }
      >;
      vicelink_patch_reports: Table<
        VicelinkPatchReportRow,
        {
          id?: string;
          patch_version: string;
          source_url?: string;
          source_type?: string;
          raw_notes: string;
          ai_summary_en: string;
          ai_summary_es: string;
          confidence_score: number;
          status?: "draft" | "auto_published" | "published" | "rolled_back" | "rejected";
          proposed_changes?: Json;
          rollback_snapshot?: Json;
          applied_count?: number;
          created_by: string;
          created_at?: string;
          applied_at?: string | null;
          rolled_back_at?: string | null;
        }
      >;
      vicelink_keyword_searches: Table<
        VicelinkKeywordSearchRow,
        {
          id?: string;
          user_id?: string | null;
          area: string;
          keyword: string;
          result_count?: number;
          lang?: "en" | "es";
          created_at?: string;
        }
      >;
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
      vicelink_author_badges: {
        Args: { p_user_ids: string[] };
        Returns: {
          user_id: string;
          handle: string;
          access_tier: TierText;
          avatar_preset: string;
          psn_verified: boolean;
          xbox_verified: boolean;
        }[];
      };
      vicelink_verify_console_handle: {
        Args: { p_platform: "psn" | "xbox" | "social_club"; p_handle: string };
        Returns: boolean;
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
      vicelink_admin_search_users: {
        Args: { p_query: string };
        Returns: {
          user_id: string;
          email: string;
          handle: string;
          display_name: string;
          access_tier: TierText;
          is_admin: boolean;
          created_at: string;
        }[];
      };
      vicelink_admin_list_users_v2: {
        Args: { p_query?: string };
        Returns: {
          user_id: string;
          email: string;
          handle: string;
          display_name: string;
          access_tier: TierText;
          is_admin: boolean;
          created_at: string;
          avatar_preset: string;
          psn_id: string;
          psn_verified: boolean;
          xbox_gamertag: string;
          xbox_verified: boolean;
          mfa_enabled: boolean;
          is_banned: boolean;
        }[];
      };
      vicelink_admin_telemetry: {
        Args: Record<string, never>;
        Returns: {
          gross_revenue_usd: number;
          yappy_revenue_usd: number;
          card_revenue_usd: number;
          total_users: number;
          free_users: number;
          street_users: number;
          kingpin_users: number;
          conversion_rate_pct: number;
          linked_console_users: number;
          ai_calls_today: number;
          mfa_enabled_users: number;
        }[];
      };
      vicelink_admin_toggle_ban: {
        Args: {
          p_target_user_id: string;
          p_is_banned: boolean;
        };
        Returns: boolean;
      };
      vicelink_admin_redact_comment: {
        Args: {
          p_comment_id: string;
        };
        Returns: boolean;
      };
      vicelink_admin_grant_tier: {
        Args: {
          p_target_user_id: string;
          p_target_tier: TierText;
          p_provider?: ProviderText;
          p_reference?: string;
        };
        Returns: TierText;
      };
      vicelink_prepare_totp_enrollment: {
        Args: Record<string, never>;
        Returns: number;
      };
      vicelink_redeem_promo_code: {
        Args: {
          p_code: string;
          p_target_tier?: string;
        };
        Returns: {
          valid: boolean;
          code: string;
          discount_pct: number;
          target_tier: "street" | "kingpin" | "both";
          instant_unlock: boolean;
          unlocked_tier: TierText | null;
          error_code: string;
        }[];
      };
      vicelink_unsubscribe_email: {
        Args: {
          p_uid: string;
          p_token?: string;
        };
        Returns: boolean;
      };
      vicelink_admin_campaign_recipients: {
        Args: {
          p_audience: string;
          p_test_email?: string;
        };
        Returns: {
          user_id: string;
          email: string;
          handle: string;
          preferred_lang: "en" | "es";
          unsubscribe_token: string;
          access_tier: TierText;
        }[];
      };
      vicelink_admin_list_users_v3: {
        Args: { p_query?: string };
        Returns: {
          user_id: string;
          email: string;
          handle: string;
          display_name: string;
          access_tier: TierText;
          is_admin: boolean;
          created_at: string;
          avatar_preset: string;
          psn_id: string;
          psn_verified: boolean;
          xbox_gamertag: string;
          xbox_verified: boolean;
          mfa_enabled: boolean;
          is_banned: boolean;
          marketing_opt_in: boolean;
        }[];
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
