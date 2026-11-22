import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AI_DAILY_LIMIT_FREE } from "@/lib/security/tier";
import type {
  AdminAuditLogItem,
  AdminKpiTelemetry,
  AdminUserRecord,
  AiQuotaInfo,
  CheatItem,
  CommunitySubmission,
  DirectionKey,
  EmailCampaignItem,
  GlitchItem,
  LocalizedText,
  MapPin,
  MePayload,
  PaymentReceipt,
  PromoCodeItem,
  SiteSettingsPayload,
  TheoryComment,
  TheoryPost,
  UserProfile,
  UserProgress,
  UserTier
} from "@/types/vicelink";
import type {
  Database,
  Json,
  VicelinkAdminAuditLogRow,
  VicelinkCommunitySubmissionRow,
  VicelinkDynamicCheatRow,
  VicelinkDynamicGlitchRow,
  VicelinkDynamicMapPinRow,
  VicelinkEmailCampaignRow,
  VicelinkProfileRow,
  VicelinkProgressRow,
  VicelinkPromoCodeRow,
  VicelinkSupabaseClient
} from "./client";

export type { VicelinkSupabaseClient };

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

const COFOUNDER_EMAILS = new Set(["mikehevi2003@gmail.com", "felipedleon@gmail.com"]);

export function isCoFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return COFOUNDER_EMAILS.has(email.trim().toLowerCase());
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsPayload = {
  globalBanner: {
    active: true,
    textEn: "ViceLink v2.5 Patch Live — 19 Verified Cheats & 32 Tactical Pins Active",
    textEs: "ViceLink v2.5 en Vivo — 19 Trucos Verificados y 32 Pines Tácticos Activos"
  },
  freeAiDailyLimit: AI_DAILY_LIMIT_FREE,
  maintenanceMode: false,
  glitchesTabEnabled: true
};

export function apiJson<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status, headers: NO_STORE_HEADERS });
}

export function apiError(
  error: string,
  status: number,
  message?: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error, ...(message ? { message } : {}), ...(extra ?? {}) },
    { status, headers: NO_STORE_HEADERS }
  );
}

/**
 * Request-scoped Supabase client for Route Handlers / Server Components.
 * Uses the publishable (anon) key + the user's auth cookies, so every query
 * runs under the user's JWT and is subject to RLS.
 */
export async function createClient(): Promise<VicelinkSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by src/middleware.ts.
          }
        }
      }
    }
  );
}

export async function getAuthedUser(supabase: VicelinkSupabaseClient): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function getAuthenticatorAssuranceLevel(
  supabase: VicelinkSupabaseClient
): Promise<"aal1" | "aal2"> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return "aal1";
    return data.currentLevel === "aal2" ? "aal2" : "aal1";
  } catch {
    return "aal1";
  }
}

export async function requireAdminUser(
  supabase: VicelinkSupabaseClient,
  authedUser?: User
): Promise<{ user: User; profile: VicelinkProfileRow } | null> {
  const user = authedUser ?? (await getAuthedUser(supabase));
  if (!user) return null;
  const { profile } = await ensureProfileAndProgress(supabase, user);
  if (!profile.is_admin && !isCoFounderEmail(profile.email)) return null;
  if (profile.is_banned && !isCoFounderEmail(profile.email)) return null;
  return { user, profile };
}

export function deriveFallbackHandle(user: User): string {
  const prefix = (user.email ?? "")
    .split("@")[0]!
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 14);
  const suffix = user.id.replace(/-/g, "").slice(0, 4);
  if (prefix.length >= 2 && suffix.length === 4) return `@${prefix}_${suffix}`;
  if (prefix.length >= 2) return `@${prefix}`;
  return `@agent_${user.id.replace(/-/g, "").slice(0, 6) || "0001"}`;
}

/**
 * Loads the user's profile and progress rows, creating missing defaults via
 * RLS-scoped self-insert if the auth signup trigger hasn't populated them.
 */
export async function ensureProfileAndProgress(
  supabase: VicelinkSupabaseClient,
  user: User
): Promise<{ profile: VicelinkProfileRow; progress: VicelinkProgressRow }> {
  let { data: profile, error: profileErr } = await supabase
    .from("vicelink_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileErr) throw profileErr;

  if (!profile) {
    const handle = deriveFallbackHandle(user);
    const { error: insertErr } = await supabase.from("vicelink_profiles").upsert(
      {
        user_id: user.id,
        email: user.email ?? "",
        handle,
        display_name: handle.slice(1)
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
    if (insertErr) throw insertErr;

    const reloaded = await supabase
      .from("vicelink_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (reloaded.error) throw reloaded.error;
    profile = reloaded.data;
  }

  if (isCoFounderEmail(profile.email) || isCoFounderEmail(user.email)) {
    profile = {
      ...profile,
      is_admin: true,
      access_tier: "kingpin",
      is_banned: false
    };
  }

  let { data: progress, error: progressErr } = await supabase
    .from("vicelink_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (progressErr) throw progressErr;

  if (!progress) {
    const { error: insertErr } = await supabase
      .from("vicelink_progress")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    if (insertErr) throw insertErr;

    const reloaded = await supabase
      .from("vicelink_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (reloaded.error) throw reloaded.error;
    progress = reloaded.data;
  }

  return { profile, progress };
}

export function mapProfileRow(row: VicelinkProfileRow, aal?: "aal1" | "aal2"): UserProfile {
  const isCofounder = isCoFounderEmail(row.email);
  return {
    id: row.user_id,
    email: row.email,
    handle: row.handle,
    displayName: row.display_name,
    tier: isCofounder ? "kingpin" : row.access_tier,
    isAdmin: isCofounder || Boolean(row.is_admin),
    preferredLang: row.preferred_lang,
    createdAt: row.created_at,
    avatarPreset: row.avatar_preset || "neon_vice",
    psnId: row.psn_id ?? "",
    psnVerified: Boolean(row.psn_verified),
    xboxGamertag: row.xbox_gamertag ?? "",
    xboxVerified: Boolean(row.xbox_verified),
    socialClubHandle: row.social_club_handle ?? "",
    verificationCode:
      row.verification_code ||
      `VL-${row.user_id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    mfaEnabled: Boolean(row.mfa_enabled),
    isBanned: isCofounder ? false : Boolean(row.is_banned),
    marketingOptIn: row.marketing_opt_in ?? true,
    ...(aal ? { aal } : {})
  };
}

export function mapProgressRow(row: VicelinkProgressRow): UserProgress {
  return {
    favorites: row.favorites ?? [],
    unlockedCheats: row.unlocked_cheats ?? [],
    foundPins: row.found_pins ?? [],
    plannedVehicles: row.planned_vehicles ?? [],
    plannedProps: row.planned_props ?? [],
    unlockedTrophies: row.unlocked_trophies ?? []
  };
}

export async function buildMePayload(
  supabase: VicelinkSupabaseClient,
  user: User,
  preloaded?: { profile: VicelinkProfileRow; progress: VicelinkProgressRow }
): Promise<MePayload> {
  const [{ profile, progress }, aal, txRes] = await Promise.all([
    preloaded ? Promise.resolve(preloaded) : ensureProfileAndProgress(supabase, user),
    getAuthenticatorAssuranceLevel(supabase),
    supabase
      .from("vicelink_transactions")
      .select("id, provider, provider_order_id, target_tier, amount_usd, currency, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  if (txRes.error) throw txRes.error;

  const payments: PaymentReceipt[] = (txRes.data ?? []).map((tx) => ({
    id: tx.id,
    provider: tx.provider,
    providerOrderId: tx.provider_order_id,
    tier: tx.target_tier,
    amountUsd: Number(tx.amount_usd),
    currency: tx.currency,
    status: tx.status,
    createdAt: tx.created_at
  }));

  return {
    profile: mapProfileRow(profile, aal),
    progress: mapProgressRow(progress),
    payments
  };
}

export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAiQuotaInfo(
  supabase: VicelinkSupabaseClient,
  userId: string,
  tier: UserTier,
  freeLimitOverride?: number
): Promise<AiQuotaInfo> {
  const unlimited = tier === "kingpin";
  const { data, error } = await supabase
    .from("vicelink_ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("usage_date", todayUtcDate())
    .maybeSingle();

  if (error) throw error;

  const effectiveLimit =
    typeof freeLimitOverride === "number" && Number.isFinite(freeLimitOverride)
      ? Math.min(50, Math.max(1, Math.round(freeLimitOverride)))
      : AI_DAILY_LIMIT_FREE;

  return {
    used: data?.count ?? 0,
    limit: unlimited ? null : effectiveLimit,
    unlimited
  };
}

export async function loadSiteSettings(
  supabase: VicelinkSupabaseClient
): Promise<SiteSettingsPayload> {
  try {
    const { data, error } = await supabase
      .from("vicelink_site_settings")
      .select("key, value");

    if (error || !data) {
      return {
        globalBanner: { ...DEFAULT_SITE_SETTINGS.globalBanner },
        freeAiDailyLimit: DEFAULT_SITE_SETTINGS.freeAiDailyLimit,
        maintenanceMode: DEFAULT_SITE_SETTINGS.maintenanceMode,
        glitchesTabEnabled: DEFAULT_SITE_SETTINGS.glitchesTabEnabled
      };
    }

    const settings: SiteSettingsPayload = {
      globalBanner: { ...DEFAULT_SITE_SETTINGS.globalBanner },
      freeAiDailyLimit: DEFAULT_SITE_SETTINGS.freeAiDailyLimit,
      maintenanceMode: DEFAULT_SITE_SETTINGS.maintenanceMode,
      glitchesTabEnabled: DEFAULT_SITE_SETTINGS.glitchesTabEnabled
    };

    for (const row of data) {
      const val =
        typeof row.value === "object" && row.value !== null && !Array.isArray(row.value)
          ? (row.value as Record<string, unknown>)
          : {};

      if (row.key === "global_banner") {
        settings.globalBanner = {
          active:
            typeof val.active === "boolean"
              ? val.active
              : DEFAULT_SITE_SETTINGS.globalBanner.active,
          textEn:
            typeof val.textEn === "string" && val.textEn.trim().length > 0
              ? val.textEn.trim()
              : DEFAULT_SITE_SETTINGS.globalBanner.textEn,
          textEs:
            typeof val.textEs === "string" && val.textEs.trim().length > 0
              ? val.textEs.trim()
              : DEFAULT_SITE_SETTINGS.globalBanner.textEs
        };
      } else if (row.key === "free_ai_daily_limit") {
        const parsed = Number(val.limit);
        if (Number.isFinite(parsed) && parsed >= 1) {
          settings.freeAiDailyLimit = Math.min(50, Math.max(1, Math.round(parsed)));
        }
      } else if (row.key === "maintenance_mode") {
        if (typeof val.enabled === "boolean") {
          settings.maintenanceMode = val.enabled;
        }
      } else if (row.key === "glitches_tab_enabled") {
        if (typeof val.enabled === "boolean") {
          settings.glitchesTabEnabled = val.enabled;
        }
      }
    }

    return settings;
  } catch {
    return {
      globalBanner: { ...DEFAULT_SITE_SETTINGS.globalBanner },
      freeAiDailyLimit: DEFAULT_SITE_SETTINGS.freeAiDailyLimit,
      maintenanceMode: DEFAULT_SITE_SETTINGS.maintenanceMode,
      glitchesTabEnabled: DEFAULT_SITE_SETTINGS.glitchesTabEnabled
    };
  }
}

export function mapAuditLogRow(row: VicelinkAdminAuditLogRow): AdminAuditLogItem {
  const detailsObj =
    typeof row.details === "object" && row.details !== null && !Array.isArray(row.details)
      ? (row.details as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    adminId: row.admin_id ?? "",
    adminEmail: row.admin_email,
    actionType: row.action_type,
    targetId: row.target_id,
    details: detailsObj,
    createdAt: row.created_at
  };
}

export async function recordAdminAuditLog(
  supabase: VicelinkSupabaseClient,
  params: {
    adminId: string;
    adminEmail: string;
    actionType: string;
    targetId?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await supabase.from("vicelink_admin_audit_logs").insert({
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      action_type: params.actionType,
      target_id: params.targetId ?? "",
      details: (params.details ?? {}) as Json
    });
  } catch {
    // Non-fatal: audit log write failure should not block primary admin mutation.
  }
}

export async function loadAdminAuditLogs(
  supabase: VicelinkSupabaseClient,
  limit = 50
): Promise<AdminAuditLogItem[]> {
  try {
    const { data, error } = await supabase
      .from("vicelink_admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapAuditLogRow);
  } catch {
    return [];
  }
}

export async function loadAdminTelemetry(
  supabase: VicelinkSupabaseClient
): Promise<AdminKpiTelemetry> {
  const fallback: AdminKpiTelemetry = {
    grossRevenueUsd: 0,
    yappyRevenueUsd: 0,
    cardRevenueUsd: 0,
    totalUsers: 0,
    freeUsers: 0,
    streetUsers: 0,
    kingpinUsers: 0,
    conversionRatePct: 0,
    linkedConsoleUsers: 0,
    aiCallsToday: 0,
    mfaEnabledUsers: 0
  };

  try {
    const { data, error } = await supabase.rpc("vicelink_admin_telemetry");
    if (error || !data || data.length === 0) return fallback;
    const row = data[0]!;
    return {
      grossRevenueUsd: Number(row.gross_revenue_usd ?? 0),
      yappyRevenueUsd: Number(row.yappy_revenue_usd ?? 0),
      cardRevenueUsd: Number(row.card_revenue_usd ?? 0),
      totalUsers: Number(row.total_users ?? 0),
      freeUsers: Number(row.free_users ?? 0),
      streetUsers: Number(row.street_users ?? 0),
      kingpinUsers: Number(row.kingpin_users ?? 0),
      conversionRatePct: Number(row.conversion_rate_pct ?? 0),
      linkedConsoleUsers: Number(row.linked_console_users ?? 0),
      aiCallsToday: Number(row.ai_calls_today ?? 0),
      mfaEnabledUsers: Number(row.mfa_enabled_users ?? 0)
    };
  } catch {
    return fallback;
  }
}

export async function loadAdminUsersV2(
  supabase: VicelinkSupabaseClient,
  query = ""
): Promise<AdminUserRecord[]> {
  const v3Res = await supabase.rpc("vicelink_admin_list_users_v3", {
    p_query: query
  });

  if (!v3Res.error && v3Res.data) {
    return v3Res.data.map((row) => ({
      userId: row.user_id,
      email: row.email,
      handle: row.handle,
      displayName: row.display_name,
      tier: isCoFounderEmail(row.email) ? "kingpin" : row.access_tier,
      isAdmin: isCoFounderEmail(row.email) || Boolean(row.is_admin),
      createdAt: row.created_at,
      avatarPreset: row.avatar_preset || "neon_vice",
      psnId: row.psn_id ?? "",
      psnVerified: Boolean(row.psn_verified),
      xboxGamertag: row.xbox_gamertag ?? "",
      xboxVerified: Boolean(row.xbox_verified),
      mfaEnabled: Boolean(row.mfa_enabled),
      isBanned: isCoFounderEmail(row.email) ? false : Boolean(row.is_banned),
      marketingOptIn: row.marketing_opt_in ?? true
    }));
  }

  if (v3Res.error?.code === "42501") {
    throw v3Res.error;
  }

  const v2Res = await supabase.rpc("vicelink_admin_list_users_v2", {
    p_query: query
  });

  if (!v2Res.error && v2Res.data) {
    return v2Res.data.map((row) => ({
      userId: row.user_id,
      email: row.email,
      handle: row.handle,
      displayName: row.display_name,
      tier: isCoFounderEmail(row.email) ? "kingpin" : row.access_tier,
      isAdmin: isCoFounderEmail(row.email) || Boolean(row.is_admin),
      createdAt: row.created_at,
      avatarPreset: row.avatar_preset || "neon_vice",
      psnId: row.psn_id ?? "",
      psnVerified: Boolean(row.psn_verified),
      xboxGamertag: row.xbox_gamertag ?? "",
      xboxVerified: Boolean(row.xbox_verified),
      mfaEnabled: Boolean(row.mfa_enabled),
      isBanned: isCoFounderEmail(row.email) ? false : Boolean(row.is_banned),
      marketingOptIn: true
    }));
  }

  if (v2Res.error?.code === "42501") {
    throw v2Res.error;
  }

  const v1Res = await supabase.rpc("vicelink_admin_search_users", {
    p_query: query
  });
  if (v1Res.error) throw v1Res.error;

  return (v1Res.data ?? []).map((row) => ({
    userId: row.user_id,
    email: row.email,
    handle: row.handle,
    displayName: row.display_name,
    tier: isCoFounderEmail(row.email) ? "kingpin" : row.access_tier,
    isAdmin: isCoFounderEmail(row.email) || Boolean(row.is_admin),
    createdAt: row.created_at,
    avatarPreset: "neon_vice",
    psnId: "",
    psnVerified: false,
    xboxGamertag: "",
    xboxVerified: false,
    mfaEnabled: false,
    isBanned: false,
    marketingOptIn: true
  }));
}

export function computePromoPriceUsd(baseUsd: number, discountPct: number): number {
  const pct = Math.min(100, Math.max(0, Math.round(discountPct)));
  if (pct >= 100) return 0;
  if (pct <= 0) return baseUsd;
  const baseCents = Math.round(baseUsd * 100);
  const discountedCents = Math.max(50, Math.round((baseCents * (100 - pct)) / 100));
  return Number((discountedCents / 100).toFixed(2));
}

export const DEFAULT_PROMO_CODES: PromoCodeItem[] = [
  {
    code: "PANAMA50",
    discountPct: 50,
    targetTier: "both",
    maxUses: 500,
    usesCount: 0,
    expiresAt: null,
    active: true,
    createdBy: "system",
    createdAt: "2026-11-21T00:00:00.000Z"
  },
  {
    code: "LEONIDA25",
    discountPct: 25,
    targetTier: "both",
    maxUses: 1000,
    usesCount: 0,
    expiresAt: null,
    active: true,
    createdBy: "system",
    createdAt: "2026-11-21T00:00:00.000Z"
  },
  {
    code: "FOUNDERVIP",
    discountPct: 100,
    targetTier: "kingpin",
    maxUses: 25,
    usesCount: 0,
    expiresAt: null,
    active: true,
    createdBy: "system",
    createdAt: "2026-11-21T00:00:00.000Z"
  }
];

export function mapPromoCodeRow(row: VicelinkPromoCodeRow): PromoCodeItem {
  return {
    code: row.code,
    discountPct: Number(row.discount_pct),
    targetTier: row.target_tier,
    maxUses: Number(row.max_uses),
    usesCount: Number(row.uses_count),
    expiresAt: row.expires_at ?? null,
    active: Boolean(row.active),
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

export async function loadPromoCodes(
  supabase: VicelinkSupabaseClient
): Promise<PromoCodeItem[]> {
  try {
    const { data, error } = await supabase
      .from("vicelink_promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      return DEFAULT_PROMO_CODES.map((item) => ({ ...item }));
    }
    return data.map(mapPromoCodeRow);
  } catch {
    return DEFAULT_PROMO_CODES.map((item) => ({ ...item }));
  }
}

export function mapEmailCampaignRow(row: VicelinkEmailCampaignRow): EmailCampaignItem {
  return {
    id: row.id,
    adminEmail: row.admin_email,
    audience: row.audience,
    subjectEn: row.subject_en,
    subjectEs: row.subject_es,
    bodyEn: row.body_en,
    bodyEs: row.body_es,
    promoCode: row.promo_code ?? "",
    recipientsCount: Number(row.recipients_count ?? 0),
    deliveredCount: Number(row.delivered_count ?? 0),
    deliveryMode: row.delivery_mode,
    createdAt: row.created_at
  };
}

export async function loadEmailCampaigns(
  supabase: VicelinkSupabaseClient,
  limit = 30
): Promise<EmailCampaignItem[]> {
  try {
    const { data, error } = await supabase
      .from("vicelink_email_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(mapEmailCampaignRow);
  } catch {
    return [];
  }
}

function toDirectionSeq(value: unknown): DirectionKey[] {
  if (!Array.isArray(value)) return [];
  const valid: DirectionKey[] = [];
  for (const item of value) {
    if (item === "UP" || item === "DOWN" || item === "LEFT" || item === "RIGHT") {
      valid.push(item);
    }
  }
  return valid;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function localizeGlitchStatus(patchStatus: string, isPatched: boolean): LocalizedText {
  const clean = patchStatus.trim();
  if (!clean || clean.toUpperCase() === "PATCHED") {
    return isPatched
      ? { en: "PATCHED", es: "PARCHEADO" }
      : { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" };
  }
  if (clean.toUpperCase() === "WORKING ON PATCH 01.002.001") {
    return { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" };
  }
  return { en: clean, es: clean };
}

export function mapDynamicCheatRow(row: VicelinkDynamicCheatRow): CheatItem {
  return {
    id: row.id,
    title: { en: row.title_en, es: row.title_es },
    category: row.category,
    unlock: { en: row.unlock_en, es: row.unlock_es },
    howToUnlock: { en: row.how_to_unlock_en, es: row.how_to_unlock_es },
    desc: { en: row.desc_en, es: row.desc_es },
    seq: toDirectionSeq(row.button_sequence)
  };
}

export function mapDynamicGlitchRow(
  row: VicelinkDynamicGlitchRow,
  votes = 0,
  voted = false
): GlitchItem {
  const isPatched = Boolean(row.is_patched);
  return {
    id: row.id,
    category: row.category,
    status: localizeGlitchStatus(row.patch_status, isPatched),
    isPatched,
    title: { en: row.title_en, es: row.title_es },
    votes,
    voted,
    warning: { en: row.warning_en, es: row.warning_es },
    steps: {
      en: toStringArray(row.steps_en),
      es: toStringArray(row.steps_es)
    }
  };
}

export function mapDynamicPinRow(row: VicelinkDynamicMapPinRow): MapPin {
  return {
    id: row.id,
    tier: row.tier,
    name: { en: row.name_en, es: row.name_es },
    region: row.region,
    type: row.pin_type,
    icon: row.icon,
    x: Number(row.coord_x),
    y: Number(row.coord_y),
    note: { en: row.note_en, es: row.note_es },
    locked: false
  };
}

export function mergeDynamicCheats(
  seedCheats: CheatItem[],
  dynamicRows: VicelinkDynamicCheatRow[]
): CheatItem[] {
  const seedIds = new Set(seedCheats.map((c) => c.id));
  const overrides = new Map<string, CheatItem>();
  const added: CheatItem[] = [];

  for (const row of dynamicRows) {
    const mapped = mapDynamicCheatRow(row);
    if (seedIds.has(mapped.id)) overrides.set(mapped.id, mapped);
    else added.push(mapped);
  }

  return [...added, ...seedCheats.map((c) => overrides.get(c.id) ?? c)];
}

export function mergeDynamicGlitches(
  seedGlitches: GlitchItem[],
  dynamicRows: VicelinkDynamicGlitchRow[],
  voteCounts: Map<string, number>,
  userVoted: Set<string>
): GlitchItem[] {
  const seedById = new Map(seedGlitches.map((g) => [g.id, g]));
  const overrides = new Map<string, GlitchItem>();
  const added: GlitchItem[] = [];

  for (const row of dynamicRows) {
    const seed = seedById.get(row.id);
    const totalVotes = (seed?.votes ?? 0) + (voteCounts.get(row.id) ?? 0);
    const mapped = mapDynamicGlitchRow(row, totalVotes, userVoted.has(row.id));
    if (seed) overrides.set(mapped.id, mapped);
    else added.push(mapped);
  }

  const mergedSeed = seedGlitches.map((g) => {
    const override = overrides.get(g.id);
    if (override) return override;
    return {
      ...g,
      isPatched: Boolean(g.isPatched),
      votes: g.votes + (voteCounts.get(g.id) ?? 0),
      voted: userVoted.has(g.id)
    };
  });

  return [...added, ...mergedSeed];
}

export function mergeDynamicPins(
  seedPins: MapPin[],
  dynamicRows: VicelinkDynamicMapPinRow[]
): MapPin[] {
  const seedIds = new Set(seedPins.map((p) => p.id));
  const overrides = new Map<string, MapPin>();
  const added: MapPin[] = [];

  for (const row of dynamicRows) {
    const mapped = mapDynamicPinRow(row);
    if (seedIds.has(mapped.id)) overrides.set(mapped.id, mapped);
    else added.push(mapped);
  }

  return [...added, ...seedPins.map((p) => overrides.get(p.id) ?? p)];
}

export async function loadGlitchVotes(
  supabase: VicelinkSupabaseClient,
  currentUserId: string
): Promise<{ voteCounts: Map<string, number>; userVoted: Set<string> }> {
  const { data: voteRows, error: voteErr } = await supabase
    .from("vicelink_glitch_votes")
    .select("glitch_id, user_id");
  if (voteErr) throw voteErr;

  const voteCounts = new Map<string, number>();
  const userVoted = new Set<string>();
  for (const row of voteRows ?? []) {
    voteCounts.set(row.glitch_id, (voteCounts.get(row.glitch_id) ?? 0) + 1);
    if (row.user_id === currentUserId) userVoted.add(row.glitch_id);
  }

  return { voteCounts, userVoted };
}

type AuthorBadgeMeta = {
  handle: string;
  tier: UserTier;
  avatarPreset: string;
  psnVerified: boolean;
  xboxVerified: boolean;
};

async function loadAuthorBadgesMap(
  supabase: VicelinkSupabaseClient,
  userIds: string[]
): Promise<Map<string, AuthorBadgeMeta>> {
  const map = new Map<string, AuthorBadgeMeta>();
  if (userIds.length === 0) return map;

  const badgesRes = await supabase.rpc("vicelink_author_badges", {
    p_user_ids: userIds
  });

  if (!badgesRes.error && badgesRes.data) {
    for (const row of badgesRes.data) {
      map.set(row.user_id, {
        handle: row.handle,
        tier: row.access_tier,
        avatarPreset: row.avatar_preset || "neon_vice",
        psnVerified: Boolean(row.psn_verified),
        xboxVerified: Boolean(row.xbox_verified)
      });
    }
    return map;
  }

  const tiersRes = await supabase.rpc("vicelink_author_tiers", {
    p_user_ids: userIds
  });
  if (tiersRes.error) throw tiersRes.error;
  for (const row of tiersRes.data ?? []) {
    map.set(row.user_id, {
      handle: row.handle,
      tier: row.access_tier,
      avatarPreset: "neon_vice",
      psnVerified: false,
      xboxVerified: false
    });
  }
  return map;
}

export async function buildCommunitySubmissions(
  supabase: VicelinkSupabaseClient,
  currentUserId: string,
  options?: { onlyPublicOrMine?: boolean; onlySubmissionId?: string }
): Promise<CommunitySubmission[]> {
  let query = supabase
    .from("vicelink_community_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (options?.onlySubmissionId) {
    query = query.eq("id", options.onlySubmissionId);
  } else if (options?.onlyPublicOrMine) {
    query = query.or(`status.in.(approved,implemented),user_id.eq.${currentUserId}`);
  }

  const { data: rows, error: rowsErr } = await query;
  if (rowsErr) throw rowsErr;

  const submissions: VicelinkCommunitySubmissionRow[] = rows ?? [];
  if (submissions.length === 0) return [];

  const submissionIds = submissions.map((s) => s.id);
  const { data: votesData, error: votesErr } = await supabase
    .from("vicelink_submission_votes")
    .select("submission_id, user_id")
    .in("submission_id", submissionIds);
  if (votesErr) throw votesErr;

  const userIds = Array.from(
    new Set(submissions.map((s) => s.user_id).filter((id): id is string => Boolean(id)))
  );
  const authorMeta = await loadAuthorBadgesMap(supabase, userIds);

  const voteCounts = new Map<string, number>();
  const userVoted = new Set<string>();
  for (const v of votesData ?? []) {
    voteCounts.set(v.submission_id, (voteCounts.get(v.submission_id) ?? 0) + 1);
    if (v.user_id === currentUserId) userVoted.add(v.submission_id);
  }

  return submissions.map((row) => {
    const meta = row.user_id ? authorMeta.get(row.user_id) : undefined;
    return {
      id: row.id,
      authorHandle: meta?.handle ?? row.author_handle,
      authorTier: meta?.tier ?? "free",
      authorPsnVerified: meta?.psnVerified ?? false,
      authorXboxVerified: meta?.xboxVerified ?? false,
      authorAvatarPreset: meta?.avatarPreset ?? "neon_vice",
      submissionType: row.submission_type,
      regionOrCategory: row.region_or_category,
      title: row.title,
      details: row.details,
      status: row.status,
      adminNotes: row.admin_notes,
      votes: voteCounts.get(row.id) ?? 0,
      upvoted: userVoted.has(row.id),
      isMine: row.user_id === currentUserId,
      createdAt: row.created_at
    };
  });
}

/**
 * Merges static seed theories (`defaultTheories`) with DB-persisted user
 * theories, votes, emoji reactions, comments, comment likes and verified author
 * tiers + console badges. Pass `onlyTheoryId` to rebuild a single post after an action.
 */
export async function buildMergedTheoryPosts(
  supabase: VicelinkSupabaseClient,
  currentUserId: string,
  defaultTheories: TheoryPost[],
  reactionEmojis: readonly string[],
  onlyTheoryId?: string
): Promise<TheoryPost[]> {
  const defaultTargets = onlyTheoryId
    ? defaultTheories.filter((t) => t.id === onlyTheoryId)
    : defaultTheories;

  const theoriesQuery = onlyTheoryId
    ? supabase.from("vicelink_theories").select("*").eq("id", onlyTheoryId)
    : supabase.from("vicelink_theories").select("*").order("created_at", { ascending: false }).limit(200);

  const votesQuery = onlyTheoryId
    ? supabase.from("vicelink_theory_votes").select("theory_id, user_id").eq("theory_id", onlyTheoryId)
    : supabase.from("vicelink_theory_votes").select("theory_id, user_id");

  const reactionsQuery = onlyTheoryId
    ? supabase.from("vicelink_theory_reactions").select("theory_id, emoji").eq("theory_id", onlyTheoryId)
    : supabase.from("vicelink_theory_reactions").select("theory_id, emoji");

  const commentsQuery = onlyTheoryId
    ? supabase
        .from("vicelink_comments")
        .select("*")
        .eq("theory_id", onlyTheoryId)
        .order("created_at", { ascending: true })
    : supabase
        .from("vicelink_comments")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(500);

  const [theoriesRes, votesRes, reactionsRes, commentsRes] = await Promise.all([
    theoriesQuery,
    votesQuery,
    reactionsQuery,
    commentsQuery
  ]);

  if (theoriesRes.error) throw theoriesRes.error;
  if (votesRes.error) throw votesRes.error;
  if (reactionsRes.error) throw reactionsRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const dbTheories = theoriesRes.data ?? [];
  const dbVotes = votesRes.data ?? [];
  const dbReactions = reactionsRes.data ?? [];
  const dbComments = commentsRes.data ?? [];

  // Comment likes: scope to visible comments when loading a single thread.
  const commentIds = [
    ...defaultTargets.flatMap((t) => t.comments.map((c) => c.id)),
    ...dbComments.map((c) => c.id)
  ];
  const likesRes =
    onlyTheoryId && commentIds.length > 0
      ? await supabase.from("vicelink_comment_likes").select("comment_id, user_id").in("comment_id", commentIds)
      : onlyTheoryId
        ? { data: [] as { comment_id: string; user_id: string }[], error: null }
        : await supabase.from("vicelink_comment_likes").select("comment_id, user_id");

  if (likesRes.error) throw likesRes.error;
  const dbCommentLikes = likesRes.data ?? [];

  // Verified author tiers + console badges via SECURITY DEFINER RPC.
  const userIds = Array.from(
    new Set([...dbTheories.map((t) => t.user_id), ...dbComments.map((c) => c.user_id)])
  );
  const authorMeta = await loadAuthorBadgesMap(supabase, userIds);

  const voteCounts = new Map<string, number>();
  const userVotedTheories = new Set<string>();
  for (const v of dbVotes) {
    voteCounts.set(v.theory_id, (voteCounts.get(v.theory_id) ?? 0) + 1);
    if (v.user_id === currentUserId) userVotedTheories.add(v.theory_id);
  }

  const reactionCounts = new Map<string, Record<string, number>>();
  for (const r of dbReactions) {
    let rec = reactionCounts.get(r.theory_id);
    if (!rec) {
      rec = {};
      reactionCounts.set(r.theory_id, rec);
    }
    rec[r.emoji] = (rec[r.emoji] ?? 0) + 1;
  }

  const commentLikeCounts = new Map<string, number>();
  const userLikedComments = new Set<string>();
  for (const l of dbCommentLikes) {
    commentLikeCounts.set(l.comment_id, (commentLikeCounts.get(l.comment_id) ?? 0) + 1);
    if (l.user_id === currentUserId) userLikedComments.add(l.comment_id);
  }

  const dbCommentsByTheory = new Map<string, TheoryComment[]>();
  for (const c of dbComments) {
    const meta = authorMeta.get(c.user_id);
    const list = dbCommentsByTheory.get(c.theory_id) ?? [];
    list.push({
      id: c.id,
      author: meta?.handle ?? c.author_handle,
      authorTier: meta?.tier ?? "free",
      authorPsnVerified: meta?.psnVerified ?? false,
      authorXboxVerified: meta?.xboxVerified ?? false,
      authorAvatarPreset: meta?.avatarPreset ?? "neon_vice",
      text: c.body,
      gifId: c.gif_id,
      likes: commentLikeCounts.get(c.id) ?? 0,
      liked: userLikedComments.has(c.id),
      createdAt: c.created_at
    });
    dbCommentsByTheory.set(c.theory_id, list);
  }

  const mergeReactions = (theoryId: string, base?: Record<string, number>): Record<string, number> => {
    const out: Record<string, number> = {};
    const extra = reactionCounts.get(theoryId);
    for (const em of reactionEmojis) {
      out[em] = (base?.[em] ?? 0) + (extra?.[em] ?? 0);
    }
    return out;
  };

  const posts: TheoryPost[] = [];

  for (const row of dbTheories) {
    const meta = authorMeta.get(row.user_id);
    posts.push({
      id: row.id,
      title: { en: row.title, es: row.title },
      tag: row.tag,
      author: meta?.handle ?? row.author_handle,
      authorTier: meta?.tier ?? "free",
      authorPsnVerified: meta?.psnVerified ?? false,
      authorXboxVerified: meta?.xboxVerified ?? false,
      authorAvatarPreset: meta?.avatarPreset ?? "neon_vice",
      coords: row.coords,
      body: { en: row.body, es: row.body },
      votes: voteCounts.get(row.id) ?? 0,
      upvoted: userVotedTheories.has(row.id),
      reactions: mergeReactions(row.id),
      comments: dbCommentsByTheory.get(row.id) ?? [],
      timestamp: Date.parse(row.created_at) || Date.now()
    });
  }

  for (const base of defaultTargets) {
    const baseComments: TheoryComment[] = base.comments.map((c) => ({
      ...c,
      likes: c.likes + (commentLikeCounts.get(c.id) ?? 0),
      liked: userLikedComments.has(c.id)
    }));
    posts.push({
      ...base,
      votes: base.votes + (voteCounts.get(base.id) ?? 0),
      upvoted: userVotedTheories.has(base.id),
      reactions: mergeReactions(base.id, base.reactions),
      comments: [...baseComments, ...(dbCommentsByTheory.get(base.id) ?? [])]
    });
  }

  posts.sort((a, b) => b.timestamp - a.timestamp);
  return posts;
}
