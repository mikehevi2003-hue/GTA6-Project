"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent
} from "react";
import type {
  AdminAuditLogItem,
  AdminKpiTelemetry,
  AdminUserRecord,
  CheatCategory,
  CheatItem,
  CommunitySubmission,
  DirectionKey,
  EmailCampaignAudience,
  EmailCampaignItem,
  GlitchCategory,
  GlitchItem,
  KeywordAnalyticsSummary,
  Language,
  MapPin,
  PatchReportItem,
  PaymentProvider,
  PinType,
  PromoCodeItem,
  SiteSettingsPayload,
  SubmissionStatus,
  UserTier
} from "@/types/vicelink";
import { ARROW_MAP, REGIONS } from "@/lib/constants/forum";
import { tField } from "@/lib/i18n/helpers";
import { createClient } from "@/lib/supabase/client";
import AdminPatchAiPanel from "./AdminPatchAiPanel";

export type AdminViewProps = {
  lang: Language;
  isAdmin: boolean;
  userEmail?: string;
  initialAal?: "aal1" | "aal2";
  requireAal2Notice?: boolean;
  onNavigateToAccount?: () => void;
  onAdminDataChanged?: () => Promise<void> | void;
  onSiteSettingsChanged?: (s: SiteSettingsPayload) => void;
  onToast?: (kind: "success" | "info" | "error", text: string) => void;
};

type AdminTab =
  | "telemetry_flags"
  | "patch_ai"
  | "glitches_cheats"
  | "pins"
  | "users"
  | "submissions"
  | "promos_email";

const DEFAULT_TELEMETRY: AdminKpiTelemetry = {
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

const DEFAULT_SITE_SETTINGS: SiteSettingsPayload = {
  globalBanner: {
    active: false,
    textEn: "",
    textEs: ""
  },
  freeAiDailyLimit: 3,
  maintenanceMode: false,
  glitchesTabEnabled: true
};

const DEFAULT_PROMO_CODES: PromoCodeItem[] = [
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

type OverviewPayload = {
  telemetry: AdminKpiTelemetry;
  siteSettings: SiteSettingsPayload;
  auditLogs: AdminAuditLogItem[];
  callerAal: "aal1" | "aal2";
  cheats: CheatItem[];
  glitches: GlitchItem[];
  dynamicPins: MapPin[];
  submissions: CommunitySubmission[];
  promoCodes?: PromoCodeItem[];
  emailCampaigns?: EmailCampaignItem[];
};

const CO_FOUNDER_EMAILS = ["mikehevi2003@gmail.com", "felipedleon@gmail.com"];
const GLITCH_CAT_OPTIONS: GlitchCategory[] = ["Money", "Camera", "Stealth", "Physics"];
const CHEAT_CAT_OPTIONS: CheatCategory[] = ["Player", "Combat", "Vehicles", "World"];
const PIN_TYPE_OPTIONS: { value: PinType; icon: string; en: string; es: string }[] = [
  { value: "Money", icon: "💰", en: "Money Spot", es: "Zona de Dinero" },
  { value: "ATM", icon: "🏧", en: "Hackable ATM", es: "Cajero ATM" },
  { value: "RareCar", icon: "🏎️", en: "Rare Free Car", es: "Auto Raro Gratis" },
  { value: "Fence", icon: "🤝", en: "Fence Buyer", es: "Comprador Fence" },
  { value: "EasterEgg", icon: "🥚", en: "Easter Egg", es: "Easter Egg" },
  { value: "Collectible", icon: "🦩", en: "Collectible", es: "Coleccionable" }
];
const DIRECTION_KEYS: DirectionKey[] = ["UP", "DOWN", "LEFT", "RIGHT"];
const PROVIDER_OPTIONS: { value: PaymentProvider; label: string }[] = [
  { value: "yappy", label: "Yappy (Banco General)" },
  { value: "paguelofacil", label: "PagueloFacil" },
  { value: "tilopay", label: "Tilopay" },
  { value: "stripe", label: "Stripe" }
];

function formatDateTime(iso: string, isEs: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(isEs ? "es-PA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatAuditTimestamp(iso: string, isEs: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "";
  return d.toLocaleString(isEs ? "es-PA" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function summarizeAuditDetails(details: Record<string, unknown> | undefined): string {
  if (!details || typeof details !== "object") return "—";
  const entries = Object.entries(details).filter(([, val]) => val !== undefined && val !== null);
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => {
      if (typeof v === "object") {
        try {
          return `${k}: ${JSON.stringify(v)}`;
        } catch {
          return `${k}: [object]`;
        }
      }
      return `${k}: ${String(v)}`;
    })
    .join(" • ");
}

export function AdminView({
  lang,
  isAdmin,
  userEmail,
  initialAal,
  requireAal2Notice,
  onNavigateToAccount,
  onAdminDataChanged,
  onSiteSettingsChanged,
  onToast
}: AdminViewProps) {
  const isEs = lang === "es";

  const [activeTab, setActiveTab] = useState<AdminTab>("telemetry_flags");
  const [forbidden, setForbidden] = useState(!isAdmin);
  const [aal2Required, setAal2Required] = useState<boolean>(
    Boolean(isAdmin && (requireAal2Notice || initialAal === "aal1"))
  );
  const [aal2SetupUrl, setAal2SetupUrl] = useState<string>("/?setup2fa=1");
  const [aal2Message, setAal2Message] = useState<string | null>(null);
  const [loading, setLoading] = useState(isAdmin);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const [overview, setOverview] = useState<OverviewPayload>({
    telemetry: DEFAULT_TELEMETRY,
    siteSettings: DEFAULT_SITE_SETTINGS,
    auditLogs: [],
    callerAal: initialAal === "aal2" ? "aal2" : "aal1",
    cheats: [],
    glitches: [],
    dynamicPins: [],
    submissions: [],
    promoCodes: DEFAULT_PROMO_CODES,
    emailCampaigns: []
  });

  // Co-founder & Inline TOTP AAL2 Verification State
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Tab 0: Telemetry, Feature Flags & Live Global Ticker state
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerTextEn, setBannerTextEn] = useState("");
  const [bannerTextEs, setBannerTextEs] = useState("");
  const [glitchesTabEnabled, setGlitchesTabEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [freeAiDailyLimit, setFreeAiDailyLimit] = useState<number>(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Tab 1: Glitch & Cheat manager state
  const [togglingGlitchId, setTogglingGlitchId] = useState<string | null>(null);
  const [savingGlitch, setSavingGlitch] = useState(false);
  const [glitchId, setGlitchId] = useState("");
  const [glitchCategory, setGlitchCategory] = useState<GlitchCategory>("Money");
  const [glitchIsPatched, setGlitchIsPatched] = useState(false);
  const [glitchPatchStatus, setGlitchPatchStatus] = useState("WORKING ON PATCH 01.002.001");
  const [glitchTitleEn, setGlitchTitleEn] = useState("");
  const [glitchTitleEs, setGlitchTitleEs] = useState("");
  const [glitchStepsEn, setGlitchStepsEn] = useState("");
  const [glitchStepsEs, setGlitchStepsEs] = useState("");
  const [glitchWarningEn, setGlitchWarningEn] = useState("");
  const [glitchWarningEs, setGlitchWarningEs] = useState("");

  const [savingCheat, setSavingCheat] = useState(false);
  const [cheatId, setCheatId] = useState("");
  const [cheatTitleEn, setCheatTitleEn] = useState("");
  const [cheatTitleEs, setCheatTitleEs] = useState("");
  const [cheatCategory, setCheatCategory] = useState<CheatCategory>("Player");
  const [cheatUnlockEn, setCheatUnlockEn] = useState("");
  const [cheatUnlockEs, setCheatUnlockEs] = useState("");
  const [cheatHowEn, setCheatHowEn] = useState("");
  const [cheatHowEs, setCheatHowEs] = useState("");
  const [cheatDescEn, setCheatDescEn] = useState("");
  const [cheatDescEs, setCheatDescEs] = useState("");
  const [cheatSeq, setCheatSeq] = useState<DirectionKey[]>([]);
  const [comboPendingOnly, setComboPendingOnly] = useState(false);

  // Tab 2: Map Pin Publisher state
  const [pinTier, setPinTier] = useState<UserTier>("street");
  const [pinType, setPinType] = useState<PinType>("Money");
  const [pinRegion, setPinRegion] = useState<string>(REGIONS[0] ?? "Vice City");
  const [pinIcon, setPinIcon] = useState("💰");
  const [pinX, setPinX] = useState<number>(68.5);
  const [pinY, setPinY] = useState<number>(42.0);
  const [pinNameEn, setPinNameEn] = useState("");
  const [pinNameEs, setPinNameEs] = useState("");
  const [pinNoteEn, setPinNoteEn] = useState("");
  const [pinNoteEs, setPinNoteEs] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [deletingPinId, setDeletingPinId] = useState<string | null>(null);

  // Tab 3: Submissions Moderation Queue state
  const [subFilter, setSubFilter] = useState<"all" | SubmissionStatus>("pending");
  const [adminNotesDraft, setAdminNotesDraft] = useState<Record<string, string>>({});
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);

  // Tab 4: Users, Manual VIP Pass Granter & Ban Toggle state
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [grantTier, setGrantTier] = useState<UserTier>("street");
  const [grantProvider, setGrantProvider] = useState<PaymentProvider>("yappy");
  const [grantReference, setGrantReference] = useState("");
  const [grantingPass, setGrantingPass] = useState(false);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);

  // Tab 5: Stage 12 Promo Code Generator & Bilingual Promotional Email Broadcast state
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscountPct, setNewPromoDiscountPct] = useState<number>(50);
  const [newPromoTargetTier, setNewPromoTargetTier] = useState<"both" | "street" | "kingpin">("both");
  const [newPromoMaxUses, setNewPromoMaxUses] = useState<number>(250);
  const [savingPromo, setSavingPromo] = useState(false);
  const [togglingPromoCode, setTogglingPromoCode] = useState<string | null>(null);

  const [campaignAudience, setCampaignAudience] = useState<EmailCampaignAudience>("all_opted_in");
  const [testEmailOnly, setTestEmailOnly] = useState("");
  const [campaignPromoCode, setCampaignPromoCode] = useState("PANAMA50");
  const [campaignSubjectEn, setCampaignSubjectEn] = useState("");
  const [campaignSubjectEs, setCampaignSubjectEs] = useState("");
  const [campaignBodyEn, setCampaignBodyEn] = useState("");
  const [campaignBodyEs, setCampaignBodyEs] = useState("");
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [lastDeliverySummary, setLastDeliverySummary] = useState<{
    recipientsCount: number;
    deliveredCount: number;
    deliveryMode: "resend_live" | "dry_run_logged";
    samplePreviewHtml?: string;
  } | null>(null);

  // Tab 6: Stage 17 AI Patch & Update Intelligence + Keyword Analytics
  const [patchReports, setPatchReports] = useState<PatchReportItem[]>([]);
  const [keywordAnalytics, setKeywordAnalytics] = useState<KeywordAnalyticsSummary>({
    totalSearches: 0,
    topKeywords: [],
    areaBreakdown: [],
    zeroResultGaps: []
  });
  const [loadingPatchAi, setLoadingPatchAi] = useState(false);

  const normalizedEmail = (userEmail || "").trim().toLowerCase();
  const isCoFounder = CO_FOUNDER_EMAILS.includes(normalizedEmail);

  const showBanner = useCallback(
    (kind: "success" | "error", text: string) => {
      setBanner({ kind, text });
      if (onToast) {
        onToast(kind, text);
      }
    },
    [onToast]
  );

  const handle403Response = useCallback((data: Record<string, unknown>) => {
    if (data?.error === "MFA_AAL2_REQUIRED") {
      setAal2Required(true);
      setForbidden(false);
      setOverview((prev) => ({ ...prev, callerAal: "aal1" }));
      if (typeof data?.setupUrl === "string" && data.setupUrl.startsWith("/")) {
        setAal2SetupUrl(data.setupUrl);
      }
      if (typeof data?.message === "string" && data.message.trim()) {
        setAal2Message(data.message.trim());
      }
      return;
    }
    setForbidden(true);
  }, []);

  // Inspect browser MFA factor status for inline 6-digit OTP step-up verification
  const checkMfaStatus = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const supabase = createClient();
      const [aalRes, factorsRes] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors()
      ]);
      if (aalRes.data?.currentLevel === "aal2") {
        setOverview((prev) => ({ ...prev, callerAal: "aal2" }));
      }
      const verifiedTotp = factorsRes.data?.totp?.find((f) => f.status === "verified");
      setTotpFactorId(verifiedTotp?.id ?? null);
    } catch {
      // Ignore if offline or Supabase env not configured in test
    }
  }, [isAdmin]);

  const loadOverview = useCallback(async () => {
    if (!isAdmin) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "Error al cargar el panel de administración." : "Failed to load admin overview.")
        );
      }

      const rawSettings = data.siteSettings as Partial<SiteSettingsPayload> | undefined;
      const nextSettings: SiteSettingsPayload = {
        globalBanner: {
          active: Boolean(rawSettings?.globalBanner?.active),
          textEn: rawSettings?.globalBanner?.textEn ?? "",
          textEs: rawSettings?.globalBanner?.textEs ?? ""
        },
        freeAiDailyLimit:
          typeof rawSettings?.freeAiDailyLimit === "number" ? rawSettings.freeAiDailyLimit : 3,
        maintenanceMode: Boolean(rawSettings?.maintenanceMode),
        glitchesTabEnabled:
          typeof rawSettings?.glitchesTabEnabled === "boolean"
            ? rawSettings.glitchesTabEnabled
            : true
      };

      const rawTelemetry = data.telemetry as Partial<AdminKpiTelemetry> | undefined;
      const nextTelemetry: AdminKpiTelemetry = {
        grossRevenueUsd: Number(rawTelemetry?.grossRevenueUsd ?? 0),
        yappyRevenueUsd: Number(rawTelemetry?.yappyRevenueUsd ?? 0),
        cardRevenueUsd: Number(rawTelemetry?.cardRevenueUsd ?? 0),
        totalUsers: Number(rawTelemetry?.totalUsers ?? 0),
        freeUsers: Number(rawTelemetry?.freeUsers ?? 0),
        streetUsers: Number(rawTelemetry?.streetUsers ?? 0),
        kingpinUsers: Number(rawTelemetry?.kingpinUsers ?? 0),
        conversionRatePct: Number(rawTelemetry?.conversionRatePct ?? 0),
        linkedConsoleUsers: Number(rawTelemetry?.linkedConsoleUsers ?? 0),
        aiCallsToday: Number(rawTelemetry?.aiCallsToday ?? 0),
        mfaEnabledUsers: Number(rawTelemetry?.mfaEnabledUsers ?? 0)
      };

      const nextOverview: OverviewPayload = {
        telemetry: nextTelemetry,
        siteSettings: nextSettings,
        auditLogs: Array.isArray(data.auditLogs) ? (data.auditLogs as AdminAuditLogItem[]) : [],
        callerAal: data.callerAal === "aal2" ? "aal2" : "aal1",
        cheats: Array.isArray(data.cheats) ? (data.cheats as CheatItem[]) : [],
        glitches: Array.isArray(data.glitches) ? (data.glitches as GlitchItem[]) : [],
        dynamicPins: Array.isArray(data.dynamicPins) ? (data.dynamicPins as MapPin[]) : [],
        submissions: Array.isArray(data.submissions)
          ? (data.submissions as CommunitySubmission[])
          : [],
        promoCodes:
          Array.isArray(data.promoCodes) && data.promoCodes.length > 0
            ? (data.promoCodes as PromoCodeItem[])
            : DEFAULT_PROMO_CODES,
        emailCampaigns: Array.isArray(data.emailCampaigns)
          ? (data.emailCampaigns as EmailCampaignItem[])
          : []
      };

      setOverview(nextOverview);
      setBannerActive(nextSettings.globalBanner.active);
      setBannerTextEn(nextSettings.globalBanner.textEn);
      setBannerTextEs(nextSettings.globalBanner.textEs);
      setGlitchesTabEnabled(nextSettings.glitchesTabEnabled);
      setMaintenanceMode(nextSettings.maintenanceMode);
      setFreeAiDailyLimit(nextSettings.freeAiDailyLimit);

      if (Array.isArray(data.users) && data.users.length > 0) {
        setUsers(data.users as AdminUserRecord[]);
      }

      setAdminNotesDraft((prev) => {
        const merged = { ...prev };
        for (const s of nextOverview.submissions) {
          if (!(s.id in merged)) {
            merged[s.id] = s.adminNotes || "";
          }
        }
        return merged;
      });
      setForbidden(false);
      if (requireAal2Notice && nextOverview.callerAal !== "aal2") {
        setAal2Required(true);
      } else {
        setAal2Required(false);
        setAal2Message(null);
      }
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo cargar el panel admin."
            : "Could not load admin workspace."
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isEs, showBanner, handle403Response, requireAal2Notice]);

  const searchUsers = useCallback(
    async (queryText: string) => {
      if (!isAdmin) return;
      setSearchingUsers(true);
      try {
        const res = await fetch(
          `/api/admin/users?q=${encodeURIComponent(queryText.trim())}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          handle403Response(data);
          return;
        }
        if (!res.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              (isEs ? "Error al buscar usuarios." : "Could not search users.")
          );
        }
        const found = Array.isArray(data.users) ? (data.users as AdminUserRecord[]) : [];
        setUsers(found);
      } catch (err) {
        showBanner(
          "error",
          err instanceof Error
            ? err.message
            : isEs
              ? "No se pudo consultar la lista de usuarios."
              : "Failed to search user accounts."
        );
      } finally {
        setSearchingUsers(false);
      }
    },
    [isAdmin, isEs, showBanner, handle403Response]
  );

  const loadPatchAi = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingPatchAi(true);
    try {
      const res = await fetch("/api/admin/patch-ai", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to load AI patch analytics.");
      }
      if (Array.isArray(data.reports)) {
        setPatchReports(data.reports as PatchReportItem[]);
      }
      if (data.keywordAnalytics) {
        setKeywordAnalytics(data.keywordAnalytics as KeywordAnalyticsSummary);
      }
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : "Could not load Patch AI reports."
      );
    } finally {
      setLoadingPatchAi(false);
    }
  }, [isAdmin, showBanner, handle403Response]);

  useEffect(() => {
    void loadOverview();
    void checkMfaStatus();
  }, [loadOverview, checkMfaStatus]);

  useEffect(() => {
    if (activeTab === "users" && !forbidden && !aal2Required && isAdmin && users.length === 0) {
      void searchUsers("");
    }
    if (activeTab === "patch_ai" && !forbidden && !aal2Required && isAdmin) {
      void loadPatchAi();
    }
  }, [activeTab, forbidden, aal2Required, isAdmin, users.length, searchUsers, loadPatchAi]);

  // --- Inline 6-Digit OTP Verification Handler ---
  const handleVerifyInlineOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!totpFactorId || otpCode.trim().length < 6) return;
    setVerifyingOtp(true);
    setBanner(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactorId,
        code: otpCode.trim()
      });
      if (error) {
        throw error;
      }
      setOtpCode("");
      setOverview((prev) => ({ ...prev, callerAal: "aal2" }));
      setAal2Required(false);
      setAal2Message(null);
      showBanner(
        "success",
        isEs
          ? "🔒 Sesión de Co-Fundador elevada a AAL2 (2FA Verificado)."
          : "🔒 Co-Founder session elevated to AAL2 (2FA Verified)."
      );
      await loadOverview();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Código 2FA inválido."
            : "Invalid 6-digit 2FA code."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  // --- Tab 0 Handler: Save Site Settings, Feature Flags & Live Global Ticker ---
  const handleSaveSiteSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setBanner(null);
    const clampedLimit = Math.max(1, Math.min(20, Math.round(Number(freeAiDailyLimit) || 3)));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalBanner: {
            active: bannerActive,
            textEn: bannerTextEn.trim(),
            textEs: bannerTextEs.trim() || bannerTextEn.trim()
          },
          freeAiDailyLimit: clampedLimit,
          maintenanceMode,
          glitchesTabEnabled
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo guardar la configuración." : "Failed to save site settings.")
        );
      }

      const updatedSettings: SiteSettingsPayload = data.siteSettings ?? {
        globalBanner: {
          active: bannerActive,
          textEn: bannerTextEn.trim(),
          textEs: bannerTextEs.trim() || bannerTextEn.trim()
        },
        freeAiDailyLimit: clampedLimit,
        maintenanceMode,
        glitchesTabEnabled
      };

      setOverview((prev) => ({ ...prev, siteSettings: updatedSettings }));
      onSiteSettingsChanged?.(updatedSettings);
      showBanner(
        "success",
        isEs
          ? "✓ Ticker Global, Feature Flags y Límite de IA sincronizados en vivo."
          : "✓ Live Global Ticker, Feature Flags & Free AI Limit synced across Hub."
      );
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al actualizar configuración global."
            : "Could not save global settings."
      );
    } finally {
      setSavingSettings(false);
    }
  };

  // --- Tab 1 Handlers: Glitches & Cheats ---
  const handleToggleGlitchStatus = async (glitch: GlitchItem) => {
    setTogglingGlitchId(glitch.id);
    setBanner(null);
    const nextPatched = !Boolean(glitch.isPatched);
    try {
      const res = await fetch("/api/admin/glitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: glitch.id,
          category: glitch.category,
          isPatched: nextPatched,
          patchStatus: nextPatched ? "PATCHED" : "WORKING ON PATCH 01.002.001",
          titleEn: glitch.title.en,
          titleEs: glitch.title.es,
          stepsEn: glitch.steps.en,
          stepsEs: glitch.steps.es,
          warningEn: glitch.warning.en,
          warningEs: glitch.warning.es
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo actualizar el estado del glitch." : "Failed to update glitch status.")
        );
      }
      showBanner(
        "success",
        nextPatched
          ? isEs
            ? `🔴 Glitch marcado como PARCHEADO: ${tField(glitch.title, lang)}`
            : `🔴 Glitch marked PATCHED: ${tField(glitch.title, lang)}`
          : isEs
            ? `🟢 Glitch marcado como ACTIVO: ${tField(glitch.title, lang)}`
            : `🟢 Glitch marked WORKING: ${tField(glitch.title, lang)}`
      );
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al actualizar glitch." : "Glitch update failed."
      );
    } finally {
      setTogglingGlitchId(null);
    }
  };

  const populateGlitchForm = (g: GlitchItem) => {
    setGlitchId(g.id);
    setGlitchCategory(g.category);
    setGlitchIsPatched(Boolean(g.isPatched));
    setGlitchPatchStatus(g.status.en || "WORKING ON PATCH 01.002.001");
    setGlitchTitleEn(g.title.en);
    setGlitchTitleEs(g.title.es);
    setGlitchStepsEn((g.steps.en || []).join("\n"));
    setGlitchStepsEs((g.steps.es || []).join("\n"));
    setGlitchWarningEn(g.warning.en || "");
    setGlitchWarningEs(g.warning.es || "");
  };

  const resetGlitchForm = () => {
    setGlitchId("");
    setGlitchCategory("Money");
    setGlitchIsPatched(false);
    setGlitchPatchStatus("WORKING ON PATCH 01.002.001");
    setGlitchTitleEn("");
    setGlitchTitleEs("");
    setGlitchStepsEn("");
    setGlitchStepsEs("");
    setGlitchWarningEn("");
    setGlitchWarningEs("");
  };

  const handleSaveGlitch = async (e: FormEvent) => {
    e.preventDefault();
    if (!glitchTitleEn.trim()) {
      showBanner("error", isEs ? "Ingresa al menos el título en inglés." : "Title (EN) is required.");
      return;
    }
    setSavingGlitch(true);
    setBanner(null);
    try {
      const stepsEnArr = glitchStepsEn
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const stepsEsArr = glitchStepsEs
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/glitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: glitchId.trim() || undefined,
          category: glitchCategory,
          isPatched: glitchIsPatched,
          patchStatus: glitchPatchStatus.trim() || (glitchIsPatched ? "PATCHED" : "WORKING ON PATCH 01.002.001"),
          titleEn: glitchTitleEn.trim(),
          titleEs: glitchTitleEs.trim() || glitchTitleEn.trim(),
          stepsEn: stepsEnArr,
          stepsEs: stepsEsArr.length > 0 ? stepsEsArr : stepsEnArr,
          warningEn: glitchWarningEn.trim(),
          warningEs: glitchWarningEs.trim() || glitchWarningEn.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo guardar el glitch." : "Could not save glitch.")
        );
      }
      showBanner(
        "success",
        isEs
          ? "✓ Glitch publicado y sincronizado en vivo con el Hub."
          : "✓ Glitch saved and synced live to the Hub."
      );
      resetGlitchForm();
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al guardar el glitch." : "Failed to save glitch."
      );
    } finally {
      setSavingGlitch(false);
    }
  };

  const populateCheatForm = (c: CheatItem) => {
    setCheatId(c.id);
    setCheatTitleEn(c.title.en);
    setCheatTitleEs(c.title.es);
    setCheatCategory(c.category);
    setCheatUnlockEn(c.unlock.en);
    setCheatUnlockEs(c.unlock.es);
    setCheatHowEn(c.howToUnlock.en);
    setCheatHowEs(c.howToUnlock.es);
    setCheatDescEn(c.desc.en);
    setCheatDescEs(c.desc.es);
    setCheatSeq([...c.seq]);
  };

  const resetCheatForm = () => {
    setCheatId("");
    setCheatTitleEn("");
    setCheatTitleEs("");
    setCheatCategory("Player");
    setCheatUnlockEn("");
    setCheatUnlockEs("");
    setCheatHowEn("");
    setCheatHowEs("");
    setCheatDescEn("");
    setCheatDescEs("");
    setCheatSeq([]);
  };

  const handleSaveCheat = async (e: FormEvent) => {
    e.preventDefault();
    if (!cheatTitleEn.trim()) {
      showBanner("error", isEs ? "El título del truco (EN) es obligatorio." : "Cheat title (EN) is required.");
      return;
    }
    setSavingCheat(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/cheats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cheatId.trim() || undefined,
          titleEn: cheatTitleEn.trim(),
          titleEs: cheatTitleEs.trim() || cheatTitleEn.trim(),
          category: cheatCategory,
          unlockEn: cheatUnlockEn.trim(),
          unlockEs: cheatUnlockEs.trim() || cheatUnlockEn.trim(),
          howToUnlockEn: cheatHowEn.trim(),
          howToUnlockEs: cheatHowEs.trim() || cheatHowEn.trim(),
          descEn: cheatDescEn.trim(),
          descEs: cheatDescEs.trim() || cheatDescEn.trim(),
          seq: cheatSeq
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo guardar el truco." : "Could not save cheat.")
        );
      }
      showBanner(
        "success",
        isEs
          ? "✓ Truco y secuencia D-Pad publicados en vivo."
          : "✓ Cheat code & D-Pad sequence published live."
      );
      resetCheatForm();
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al publicar el truco." : "Failed to publish cheat."
      );
    } finally {
      setSavingCheat(false);
    }
  };

  // --- Tab 2 Handlers: Interactive Leonida Map Pin Publisher ---
  const handleRadarClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, Number(rawX.toFixed(1))));
    const clampedY = Math.max(0, Math.min(100, Number(rawY.toFixed(1))));
    setPinX(clampedX);
    setPinY(clampedY);
  };

  const handlePublishPin = async (e: FormEvent) => {
    e.preventDefault();
    if (!pinNameEn.trim()) {
      showBanner("error", isEs ? "Ingresa el nombre del pin (EN)." : "Pin name (EN) is required.");
      return;
    }
    setSavingPin(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: pinTier,
          type: pinType,
          region: pinRegion,
          icon: pinIcon.trim() || "📍",
          x: Number(pinX),
          y: Number(pinY),
          nameEn: pinNameEn.trim(),
          nameEs: pinNameEs.trim() || pinNameEn.trim(),
          noteEn: pinNoteEn.trim(),
          noteEs: pinNoteEs.trim() || pinNoteEn.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo publicar el pin." : "Failed to publish pin.")
        );
      }
      showBanner(
        "success",
        isEs
          ? `✓ Pin publicado en (${pinX}%, ${pinY}%) y sincronizado en el Mapa Táctico.`
          : `✓ Map pin published at (${pinX}%, ${pinY}%) and synced live to Tactical Map.`
      );
      setPinNameEn("");
      setPinNameEs("");
      setPinNoteEn("");
      setPinNoteEs("");
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al publicar pin." : "Could not publish pin."
      );
    } finally {
      setSavingPin(false);
    }
  };

  const handleDeletePin = async (id: string) => {
    setDeletingPinId(id);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/pins?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || (isEs ? "No se pudo eliminar el pin." : "Could not delete pin.")
        );
      }
      showBanner(
        "success",
        isEs ? "✓ Pin dinámico eliminado del mapa." : "✓ Dynamic map pin deleted."
      );
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al eliminar el pin." : "Delete failed."
      );
    } finally {
      setDeletingPinId(null);
    }
  };

  // --- Tab 3 Handlers: Submissions Moderation ---
  const handleModerateSubmission = async (
    subId: string,
    status: "approved" | "implemented" | "rejected"
  ) => {
    setUpdatingSubId(subId);
    setBanner(null);
    const adminNotes = (adminNotesDraft[subId] ?? "").trim();
    try {
      const res = await fetch(`/api/admin/submissions/${encodeURIComponent(subId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo actualizar el envío." : "Could not update submission.")
        );
      }
      setOverview((prev) => ({
        ...prev,
        submissions: prev.submissions.map((item) =>
          item.id === subId
            ? { ...item, status: (data.status as SubmissionStatus) ?? status, adminNotes: data.adminNotes ?? adminNotes }
            : item
        )
      }));
      showBanner(
        "success",
        isEs
          ? `✓ Envío actualizado a "${status}".`
          : `✓ Submission updated to "${status}".`
      );
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al moderar envío." : "Moderation update failed."
      );
    } finally {
      setUpdatingSubId(null);
    }
  };

  // --- Tab 4 Handlers: Manual VIP Pass Granter & User Ban/Unban ---
  const handleUserSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    void searchUsers(userQuery);
  };

  const handleGrantPass = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showBanner(
        "error",
        isEs
          ? "Selecciona primero un usuario de la lista."
          : "Please select a user account from the search results first."
      );
      return;
    }
    setGrantingPass(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/users/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          targetTier: grantTier,
          provider: grantProvider,
          reference: grantReference.trim() || undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo otorgar el pase." : "Failed to grant VIP pass.")
        );
      }
      const selectedUser = users.find((u) => u.userId === selectedUserId);
      showBanner(
        "success",
        isEs
          ? `✓ Pase actualizado a ${(data.tier || grantTier).toUpperCase()} para ${selectedUser?.handle || selectedUserId}.`
          : `✓ Tier updated to ${(data.tier || grantTier).toUpperCase()} for ${selectedUser?.handle || selectedUserId}.`
      );
      setGrantReference("");
      await searchUsers(userQuery);
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error ? err.message : isEs ? "Error al otorgar el pase." : "Pass grant failed."
      );
    } finally {
      setGrantingPass(false);
    }
  };

  const handleToggleBanUser = async (userRecord: AdminUserRecord) => {
    const nextBanned = !Boolean(userRecord.isBanned);
    setBanningUserId(userRecord.userId);
    setBanner(null);
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.userId === userRecord.userId ? { ...u, isBanned: nextBanned } : u))
    );
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userRecord.userId,
          isBanned: nextBanned
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo actualizar el estado de baneo." : "Could not update ban status.")
        );
      }
      showBanner(
        "success",
        nextBanned
          ? isEs
            ? `🚫 Cuenta suspendida: ${userRecord.handle}`
            : `🚫 Account banned: ${userRecord.handle}`
          : isEs
            ? `🔓 Cuenta reactivada: ${userRecord.handle}`
            : `🔓 Account unbanned: ${userRecord.handle}`
      );
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.userId === userRecord.userId ? { ...u, isBanned: !nextBanned } : u))
      );
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al cambiar estado de baneo."
            : "Failed to toggle user ban."
      );
    } finally {
      setBanningUserId(null);
    }
  };

  // --- Tab 5 Handlers: Stage 12 Promo Code Generator & Bilingual Promotional Email Broadcast ---
  const handleCreatePromoCode = async (e: FormEvent) => {
    e.preventDefault();
    const cleanedCode = newPromoCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");
    if (!/^[A-Z0-9_-]{3,24}$/.test(cleanedCode)) {
      showBanner(
        "error",
        isEs
          ? "El código promo debe tener entre 3 y 24 caracteres (A-Z, 0-9, _ o -)."
          : "Promo code must be 3–24 uppercase characters (A-Z, 0-9, _ or -)."
      );
      return;
    }

    const clampedDiscount = Math.max(1, Math.min(100, Math.round(Number(newPromoDiscountPct) || 50)));
    const clampedMaxUses = Math.max(1, Math.round(Number(newPromoMaxUses) || 100));

    setSavingPromo(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanedCode,
          discountPct: clampedDiscount,
          targetTier: newPromoTargetTier,
          maxUses: clampedMaxUses,
          active: true
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo guardar el código promocional." : "Could not save promo code.")
        );
      }

      setNewPromoCode("");
      setCampaignPromoCode(cleanedCode);
      showBanner(
        "success",
        isEs
          ? `✓ Código promocional ${cleanedCode} (${clampedDiscount}% OFF) guardado en vivo.`
          : `✓ Promo code ${cleanedCode} (${clampedDiscount}% OFF) saved live.`
      );
      await loadOverview();
      await onAdminDataChanged?.();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al crear código promocional."
            : "Failed to create promo code."
      );
    } finally {
      setSavingPromo(false);
    }
  };

  const handleTogglePromoActive = async (promo: PromoCodeItem) => {
    const nextActive = !promo.active;
    setTogglingPromoCode(promo.code);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promo.code,
          active: nextActive
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo actualizar el código promocional." : "Could not toggle promo code.")
        );
      }
      showBanner(
        "success",
        nextActive
          ? isEs
            ? `🟢 Código ${promo.code} activado.`
            : `🟢 Promo code ${promo.code} enabled.`
          : isEs
            ? `🔴 Código ${promo.code} desactivado.`
            : `🔴 Promo code ${promo.code} disabled.`
      );
      await loadOverview();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al cambiar estado del código."
            : "Failed to update promo status."
      );
    } finally {
      setTogglingPromoCode(null);
    }
  };

  const handleLoadWeekendPromoTemplate = () => {
    setCampaignPromoCode("PANAMA50");
    setCampaignSubjectEn(
      "⚡ 50% OFF Weekend Flash: Unlock the $250K/hr GTA VI First-Hour Cash Route ($1.00 USD)"
    );
    setCampaignSubjectEs(
      "⚡ 50% OFF Fin de Semana: Desbloquea la Ruta GTA VI de $250K/hr en tu Primera Hora ($1.00 USD)"
    );
    setCampaignBodyEn(
      [
        "Ready to dominate Leonida from minute one?",
        "",
        "Unlock ViceLink Street Pass ($1.99 -> $1.00 USD) or Kingpin VIP ($4.99 -> $2.50 USD) with promo code PANAMA50 (50% OFF — one-time payment, zero subscriptions):",
        "• 💸 6-Stop First-Hour Cash & Supercar Route ($250K+/hr + 2 Free Cars: Paul Walker's Eclipse & '67 Off-Road Buggy)",
        "• ⚡ All Working Patch 01.002.001 Money Glitches & Duplication Steps",
        "• 🗺️ All 32 Tactical Map Coordinates, Hackable ATMs & Fence Keypad Codes (7700)",
        "• 🏆 All 55 Platinum Trophy Guides & Unlimited Leonida AI Mission Advisor",
        "",
        "Enter code PANAMA50 inside the ViceLink Pricing Modal and pay securely with Yappy (Banco General) or Visa/Mastercard."
      ].join("\n")
    );
    setCampaignBodyEs(
      [
        "¿Listo para dominar Leonida desde el primer minuto?",
        "",
        "Desbloquea ViceLink Street Pass ($1.99 -> $1.00 USD) o Kingpin VIP ($4.99 -> $2.50 USD) con el código PANAMA50 (50% de descuento — pago único de por vida, sin suscripciones):",
        "• 💸 Ruta Táctica de 6 Paradas en la Primera Hora ($250K+/hr + 2 Autos Gratis: Eclipse de Paul Walker y Buggy 4x4 '67)",
        "• ⚡ Todos los Glitches de Dinero Activos en el Parche 01.002.001",
        "• 🗺️ Las 32 Coordenadas del Mapa Táctico, Cajeros ATM y Fences (Código 7700)",
        "• 🏆 Guía completa de los 55 Trofeos de Platino y Asesor IA Ilimitado",
        "",
        "Ingresa el código PANAMA50 en el modal de pases de ViceLink y paga al instante con Yappy (Banco General) o Visa/Mastercard."
      ].join("\n")
    );
    setShowEmailPreview(true);
    showBanner(
      "success",
      isEs
        ? "⚡ Plantilla bilingüe de 50% OFF (PANAMA50) cargada y lista para enviar."
        : "⚡ 50% Weekend Promo Template (PANAMA50) loaded and ready to broadcast."
    );
  };

  const handleSendPromoBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!campaignSubjectEn.trim() || !campaignBodyEn.trim()) {
      showBanner(
        "error",
        isEs
          ? "Completa el Asunto (EN) y el Mensaje (EN) o usa el botón 'Cargar Plantilla 50%'."
          : "Subject (EN) and Body (EN) are required — or click 'Load 50% Weekend Promo Template'."
      );
      return;
    }

    setSendingCampaign(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/send-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: campaignAudience,
          testEmailOnly: testEmailOnly.trim() || undefined,
          promoCode: campaignPromoCode.trim().toUpperCase(),
          subjectEn: campaignSubjectEn.trim(),
          subjectEs: campaignSubjectEs.trim() || campaignSubjectEn.trim(),
          bodyEn: campaignBodyEn.trim(),
          bodyEs: campaignBodyEs.trim() || campaignBodyEn.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        handle403Response(data);
        return;
      }
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs
              ? "No se pudo enviar la campaña promocional."
              : "Failed to send promotional email broadcast.")
        );
      }

      const mode: "resend_live" | "dry_run_logged" =
        data?.deliveryMode === "resend_live" ? "resend_live" : "dry_run_logged";
      const recipientsCount = Number(data?.recipientsCount ?? 0);
      const deliveredCount = Number(data?.deliveredCount ?? recipientsCount);

      setLastDeliverySummary({
        recipientsCount,
        deliveredCount,
        deliveryMode: mode,
        samplePreviewHtml:
          typeof data?.samplePreviewHtml === "string" ? data.samplePreviewHtml : undefined
      });
      setShowEmailPreview(true);

      showBanner(
        "success",
        mode === "resend_live"
          ? isEs
            ? `🚀 Campaña enviada en vivo vía Resend SMTP a ${deliveredCount}/${recipientsCount} destinatarios.`
            : `🚀 Broadcast delivered live via Resend SMTP to ${deliveredCount}/${recipientsCount} recipients.`
          : isEs
            ? `🧪 Campaña registrada en modo Dry-Run (${deliveredCount}/${recipientsCount} destinatarios). Configura RESEND_API_KEY para envío SMTP en vivo.`
            : `🧪 Broadcast logged in Dry-Run mode (${deliveredCount}/${recipientsCount} recipients). Configure RESEND_API_KEY for live SMTP delivery.`
      );
      await loadOverview();
    } catch (err) {
      showBanner(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al enviar la campaña."
            : "Promotional broadcast failed."
      );
    } finally {
      setSendingCampaign(false);
    }
  };

  const promoCodesList = useMemo(
    () =>
      overview.promoCodes && overview.promoCodes.length > 0
        ? overview.promoCodes
        : DEFAULT_PROMO_CODES,
    [overview.promoCodes]
  );

  const emailCampaignsList = useMemo(
    () => overview.emailCampaigns ?? [],
    [overview.emailCampaigns]
  );

  const computedEmailPreviewHtml = useMemo(() => {
    if (lastDeliverySummary?.samplePreviewHtml) {
      return lastDeliverySummary.samplePreviewHtml;
    }
    const subj =
      (isEs ? campaignSubjectEs || campaignSubjectEn : campaignSubjectEn) ||
      "⚡ 50% OFF Weekend Flash: Unlock the $250K/hr GTA VI First-Hour Cash Route ($1.00 USD)";
    const body =
      (isEs ? campaignBodyEs || campaignBodyEn : campaignBodyEn) ||
      "Use code PANAMA50 at checkout for 50% off Street Pass ($1.00 USD) or Kingpin VIP ($2.50 USD) — one-time lifetime access.";
    const code = campaignPromoCode.trim().toUpperCase() || "PANAMA50";
    const safeBodyHtml = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:18px;background:#05070e;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0b1120;border:1px solid rgba(0,229,255,0.45);border-radius:16px;padding:22px;">
    <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;color:#00e5ff;text-transform:uppercase;">VICELINK // LEONIDA TACTICAL HUB</div>
    <h2 style="margin:10px 0 12px;font-size:19px;color:#ffffff;">${subj.replace(/</g, "&lt;")}</h2>
    <div style="font-size:13.5px;line-height:1.6;color:#cbd5e1;">${safeBodyHtml}</div>
    ${
      code
        ? `<div style="margin:18px 0;padding:12px 16px;border-radius:12px;background:rgba(255,42,133,0.16);border:1px dashed #ff2a85;text-align:center;">
            <div style="font-size:11px;color:#fda4af;font-weight:700;">PROMO / DISCOUNT CODE</div>
            <div style="font-size:22px;font-weight:900;letter-spacing:3px;color:#facc15;margin-top:4px;">${code}</div>
          </div>`
        : ""
    }
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:18px 0;"/>
    <p style="font-size:11px;color:#94a3b8;line-height:1.5;margin:0;">
      Panama Law 81 of 2019 (Personal Data Protection) • 1-Click Opt-Out:
      <a href="/api/unsubscribe?uid=00000000-0000-0000-0000-000000000000&token=law81-preview" style="color:#00e5ff;text-decoration:underline;">Unsubscribe / Darse de baja (/api/unsubscribe)</a>
    </p>
  </div>
</body>
</html>`;
  }, [
    lastDeliverySummary,
    isEs,
    campaignSubjectEn,
    campaignSubjectEs,
    campaignBodyEn,
    campaignBodyEs,
    campaignPromoCode
  ]);

  const pendingCheatsCount = useMemo(
    () => overview.cheats.filter((c) => c.seq.length === 0).length,
    [overview.cheats]
  );

  const displayedCheats = useMemo(
    () => (comboPendingOnly ? overview.cheats.filter((c) => c.seq.length === 0) : overview.cheats),
    [overview.cheats, comboPendingOnly]
  );

  const submissionCounts = useMemo(() => {
    const counts = { all: overview.submissions.length, pending: 0, approved: 0, implemented: 0, rejected: 0 };
    for (const s of overview.submissions) {
      if (s.status in counts) {
        counts[s.status] += 1;
      }
    }
    return counts;
  }, [overview.submissions]);

  const filteredSubmissions = useMemo(() => {
    if (subFilter === "all") return overview.submissions;
    return overview.submissions.filter((s) => s.status === subFilter);
  }, [overview.submissions, subFilter]);

  const selectedUserRecord = useMemo(
    () => users.find((u) => u.userId === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  // Graceful 403 / non-admin guard
  if (!isAdmin || forbidden) {
    return (
      <section id="view-admin" className="view active">
        <div className="paywall-box">
          <span className="status-patched">403 • {isEs ? "ACCESO DENEGADO" : "ACCESS DENIED"}</span>
          <h3 style={{ marginTop: 12 }}>
            🛡️ {isEs ? "Área Exclusiva de Administradores" : "Admin Command Center Restricted"}
          </h3>
          <p>
            {isEs
              ? "Tu cuenta no tiene permisos de administrador (is_admin). Todas las rutas administrativas están protegidas en el servidor con RBAC y Row-Level Security."
              : "Your account does not hold administrator privileges (is_admin). All admin API routes are strictly protected server-side via RBAC and Postgres RLS."}
          </p>
        </div>
      </section>
    );
  }

  // Stage 13 SEC-05 Hard AAL2 Step-Up Gate: hides ALL 4 KPI cards & CMS tabs until AAL2 verified
  if (aal2Required) {
    return (
      <section id="view-admin" className="view active">
        <div
          id="adminAal2GateCard"
          className="paywall-box"
          style={{
            maxWidth: 680,
            margin: "18px auto",
            textAlign: "left",
            padding: "28px 28px 26px",
            background:
              "linear-gradient(145deg, rgba(10, 15, 30, 0.96), rgba(24, 10, 32, 0.94))",
            border: "1px solid rgba(255, 42, 133, 0.55)",
            boxShadow: "0 20px 54px rgba(0, 0, 0, 0.65)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              className="status-patched"
              style={{
                background: "rgba(245, 158, 11, 0.18)",
                border: "1px solid rgba(250, 204, 21, 0.55)",
                color: "#fde047"
              }}
            >
              🔒 MANDATORY CO-FOUNDER 2FA (AAL2) GATE
            </span>
            <span className="brand-badge">SEC-05 ZERO-TRUST</span>
            {isCoFounder && (
              <span className="kingpin-badge">👑 {normalizedEmail}</span>
            )}
          </div>

          <h2 style={{ marginTop: 14, fontSize: 22, fontWeight: 900, color: "#ffffff" }}>
            {isEs
              ? "Verificación 2FA (AAL2) Obligatoria para Desbloquear /admin"
              : "Mandatory Co-Founder 2FA (AAL2) Security Gate"}
          </h2>

          <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6, color: "#cbd5e1" }}>
            {isEs
              ? "Las cuentas de Co-Fundador (mikehevi2003@gmail.com y felipedleon@gmail.com) requieren una sesión 2FA verificada en nivel AAL2 antes de desbloquear /admin, las tarjetas KPI de telemetría o cualquier ruta /api/admin/*."
              : "Co-Founder accounts (mikehevi2003@gmail.com & felipedleon@gmail.com) require an AAL2 verified 2FA session before /admin, live KPI telemetry cards, or any /api/admin/* endpoint unlocks."}
          </p>

          {aal2Message && (
            <div
              className="auth-alert"
              style={{
                marginTop: 12,
                background: "rgba(0, 229, 255, 0.08)",
                borderColor: "rgba(0, 229, 255, 0.35)",
                color: "#bae6fd",
                fontSize: 12.5
              }}
            >
              {aal2Message}
            </div>
          )}

          {banner && (
            <div
              className={`auth-alert ${banner.kind === "error" ? "auth-alert-error" : "auth-alert-success"}`}
              role={banner.kind === "error" ? "alert" : "status"}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginTop: 12
              }}
            >
              <span>{banner.text}</span>
              <button
                type="button"
                onClick={() => setBanner(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>
          )}

          {totpFactorId ? (
            <form
              id="adminAal2InlineTotpForm"
              onSubmit={handleVerifyInlineOtp}
              style={{
                marginTop: 18,
                padding: "16px 18px",
                borderRadius: 12,
                background: "rgba(5, 7, 14, 0.85)",
                border: "1px solid rgba(0, 229, 255, 0.42)",
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              <strong style={{ fontSize: 13.5, color: "#00e5ff" }}>
                🔑{" "}
                {isEs
                  ? "Factor TOTP Detectado — Ingresa tu Código de 6 Dígitos"
                  : "Verified TOTP Authenticator Detected — Enter 6-Digit Code"}
              </strong>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {isEs
                  ? "Abre Google Authenticator, Authy o 1Password e ingresa el código actual para elevar tu sesión a AAL2 al instante."
                  : "Open Google Authenticator, Authy, or 1Password and enter your current 6-digit code to elevate this session to AAL2 immediately."}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  id="adminAal2OtpInput"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  style={{
                    width: 150,
                    background: "#080c16",
                    border: "1px solid rgba(0, 229, 255, 0.55)",
                    color: "#ffffff",
                    padding: "10px 14px",
                    borderRadius: 9,
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "4px",
                    textAlign: "center",
                    fontVariantNumeric: "tabular-nums"
                  }}
                />
                <button
                  type="submit"
                  className="btn-pro"
                  style={{ width: "auto", padding: "10px 18px", fontSize: 13 }}
                  disabled={verifyingOtp || otpCode.length < 6}
                >
                  {verifyingOtp
                    ? isEs
                      ? "Verificando AAL2..."
                      : "Verifying AAL2..."
                    : isEs
                      ? "🔓 Verificar Código y Desbloquear Admin"
                      : "🔓 Verify 6-Digit Code & Unlock Admin"}
                </button>
              </div>
            </form>
          ) : (
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255, 42, 133, 0.08)",
                border: "1px dashed rgba(255, 42, 133, 0.45)",
                fontSize: 12.5,
                color: "#fda4af",
                lineHeight: 1.5
              }}
            >
              {isEs
                ? "Aún no se detecta un autenticador TOTP verificado en tu sesión. Escanea tu código QR 2FA en la Bóveda de Seguridad de tu cuenta para activar AAL2."
                : "No verified TOTP authenticator factor was found yet for this session. Enroll your 2FA Authenticator QR code in your Account Security Vault to unlock AAL2."}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 18
            }}
          >
            {onNavigateToAccount ? (
              <button
                type="button"
                className="btn-pro"
                style={{ width: "auto", padding: "10px 16px", fontSize: 13 }}
                onClick={onNavigateToAccount}
              >
                🔐{" "}
                {isEs
                  ? "Registrar / Gestionar Código QR 2FA"
                  : "Enroll / Manage 2FA Authenticator QR Code"}
              </button>
            ) : (
              <a
                href={aal2SetupUrl}
                className="btn-pro"
                style={{
                  width: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  padding: "10px 16px",
                  fontSize: 13
                }}
              >
                🔐{" "}
                {isEs
                  ? "Registrar / Gestionar Código QR 2FA"
                  : "Enroll / Manage 2FA Authenticator QR Code"}
              </a>
            )}

            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => {
                void checkMfaStatus();
                void loadOverview();
              }}
              style={{ padding: "10px 14px", fontSize: 12.5 }}
            >
              {loading
                ? isEs
                  ? "Comprobando AAL2..."
                  : "Checking AAL2..."
                : isEs
                  ? "↻ Comprobar Sesión AAL2"
                  : "↻ Recheck AAL2 Session"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const { telemetry } = overview;

  return (
    <section id="view-admin" className="view active">
      <header className="view-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="brand-badge">
              🛡️ {isEs ? "CENTRO DE COMANDO CO-FUNDADOR" : "CO-FOUNDER & DEVELOPER COMMAND CENTER"}
            </span>
            {isCoFounder && (
              <span className="kingpin-badge">
                👑 CO-FOUNDER • {normalizedEmail}
              </span>
            )}
            <span className="verified-badge">ADMIN RBAC</span>
            {overview.callerAal === "aal2" ? (
              <span
                className="aal-badge verified implemented-badge"
                style={{
                  background: "rgba(34, 197, 94, 0.18)",
                  border: "1px solid rgba(34, 197, 94, 0.55)",
                  color: "#4ade80"
                }}
              >
                🔒 AAL2 VERIFIED
              </span>
            ) : (
              <span
                className="aal-badge warn status-patched"
                style={{
                  background: "rgba(245, 158, 11, 0.16)",
                  border: "1px solid rgba(245, 158, 11, 0.55)",
                  color: "#fde047"
                }}
              >
                ⚠️ {isEs ? "AAL1 — 2FA Recomendado" : "AAL1 — 2FA Recommended"}
              </span>
            )}
          </div>
          <h2 style={{ marginTop: 6 }}>
            {isEs
              ? "Telemetría en Vivo, Feature Flags, CMS y Auditoría"
              : "Live Telemetry, Feature Flags, CMS & Security Audit Center"}
          </h2>
          <p>
            {isEs
              ? "Controla el Ticker Global, límites de IA, glitches parcheados, combos D-Pad, pines de Leonida, pases VIP manuales y registro inmutable de auditoría."
              : "Control the Live Global Ticker, AI rate limits, patched glitches, cracked D-Pad cheats, Leonida map pins, VIP passes, user bans, and immutable audit logs."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {overview.callerAal !== "aal2" && totpFactorId && (
            <form
              onSubmit={handleVerifyInlineOtp}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit 2FA"
                style={{
                  width: 108,
                  background: "#080c16",
                  border: "1px solid rgba(250, 204, 21, 0.5)",
                  color: "#fff",
                  padding: "7px 10px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontVariantNumeric: "tabular-nums"
                }}
              />
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto", padding: "7px 12px", fontSize: 12 }}
                disabled={verifyingOtp || otpCode.length < 6}
              >
                {verifyingOtp ? "..." : isEs ? "Verificar AAL2" : "Verify AAL2"}
              </button>
            </form>
          )}

          {onNavigateToAccount && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onNavigateToAccount}
              style={{ fontSize: 12, padding: "8px 12px" }}
            >
              🔐 {isEs ? "2FA y Seguridad en Cuenta" : "2FA & Security in Account"}
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => void loadOverview()}
          >
            {loading
              ? isEs
                ? "Sincronizando..."
                : "Syncing..."
              : isEs
                ? "↻ Recargar Datos"
                : "↻ Reload Overview"}
          </button>
        </div>
      </header>

      {banner && (
        <div
          className={`auth-alert ${banner.kind === "error" ? "auth-alert-error" : "auth-alert-success"}`}
          role={banner.kind === "error" ? "alert" : "status"}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginBottom: 16
          }}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontWeight: 800,
              cursor: "pointer"
            }}
            aria-label={isEs ? "Cerrar aviso" : "Dismiss"}
          >
            ✕
          </button>
        </div>
      )}

      {/* =================================================================
          4 REAL-TIME TELEMETRY KPI CARDS (.admin-kpi-grid / .admin-kpi-card)
         ================================================================= */}
      <div
        className="admin-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: 14,
          marginBottom: 18
        }}
      >
        <div className="admin-card admin-kpi-card" style={{ padding: "15px 16px", gap: 6 }}>
          <span className="cat-tag">
            💵 {isEs ? "INGRESOS BRUTOS (USD)" : "GROSS REVENUE (USD)"}
          </span>
          <strong
            className="admin-kpi-value"
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#4ade80",
              fontVariantNumeric: "tabular-nums"
            }}
          >
            ${telemetry.grossRevenueUsd.toFixed(2)}
          </strong>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            ⚡ Yappy: <strong>${telemetry.yappyRevenueUsd.toFixed(2)}</strong> • 💳{" "}
            {isEs ? "Tarjeta" : "Card"}: <strong>${telemetry.cardRevenueUsd.toFixed(2)}</strong>
          </span>
        </div>

        <div className="admin-card admin-kpi-card" style={{ padding: "15px 16px", gap: 6 }}>
          <span className="cat-tag">
            📈 {isEs ? "TASA DE CONVERSIÓN VIP" : "CONVERSION RATE %"}
          </span>
          <strong
            className="admin-kpi-value"
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "var(--accent-cyan)",
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {telemetry.conversionRatePct.toFixed(1)}%
          </strong>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            Free: <strong>{telemetry.freeUsers}</strong> • Street:{" "}
            <strong>{telemetry.streetUsers}</strong> • Kingpin:{" "}
            <strong style={{ color: "#facc15" }}>{telemetry.kingpinUsers}</strong>
          </span>
        </div>

        <div className="admin-card admin-kpi-card" style={{ padding: "15px 16px", gap: 6 }}>
          <span className="cat-tag">
            🎮 {isEs ? "EXPLORADORES DE LEONIDA" : "ACTIVE LEONIDA EXPLORERS"}
          </span>
          <strong
            className="admin-kpi-value"
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#ffffff",
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {telemetry.totalUsers}
          </strong>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            PSN/Xbox: <strong>{telemetry.linkedConsoleUsers}</strong> • 🔒 2FA/MFA:{" "}
            <strong style={{ color: "#4ade80" }}>{telemetry.mfaEnabledUsers}</strong>
          </span>
        </div>

        <div className="admin-card admin-kpi-card" style={{ padding: "15px 16px", gap: 6 }}>
          <span className="cat-tag">
            🤖 {isEs ? "CARGA DEL ASESOR IA (HOY)" : "AI ADVISOR LOAD (TODAY)"}
          </span>
          <strong
            className="admin-kpi-value"
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "var(--accent-pink)",
              fontVariantNumeric: "tabular-nums"
            }}
          >
            {telemetry.aiCallsToday}
          </strong>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            {isEs ? "Consultas hoy" : "Queries today"} •{" "}
            {isEs ? "Límite Free:" : "Free Limit:"}{" "}
            <strong>{overview.siteSettings.freeAiDailyLimit}/day</strong>
          </span>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="admin-tabs admin-subnav" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "telemetry_flags"}
          className={`admin-tab ${activeTab === "telemetry_flags" ? "active" : ""}`}
          onClick={() => setActiveTab("telemetry_flags")}
        >
          🚩 {isEs ? "Flags y Ticker en Vivo" : "Flags & Live Ticker"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "patch_ai"}
          className={`admin-tab ${activeTab === "patch_ai" ? "active" : ""}`}
          onClick={() => setActiveTab("patch_ai")}
        >
          🤖 {isEs ? "IA Parches y Keywords" : "AI Patch Agent & Keywords"} ({patchReports.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "glitches_cheats"}
          className={`admin-tab ${activeTab === "glitches_cheats" ? "active" : ""}`}
          onClick={() => setActiveTab("glitches_cheats")}
        >
          ⚡ {isEs ? "Glitches y Trucos" : "Glitches & Cheats"} ({overview.glitches.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pins"}
          className={`admin-tab ${activeTab === "pins" ? "active" : ""}`}
          onClick={() => setActiveTab("pins")}
        >
          🗺️ {isEs ? "Publicar Pines" : "Map Pin Publisher"} ({overview.dynamicPins.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👑 {isEs ? "Usuarios, VIP y Bans" : "Users, VIP & Bans"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "submissions"}
          className={`admin-tab ${activeTab === "submissions" ? "active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          🛡️ {isEs ? "Moderación y Auditoría" : "Moderation & Audit Log"} ({submissionCounts.pending})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "promos_email"}
          className={`admin-tab ${activeTab === "promos_email" ? "active" : ""}`}
          onClick={() => setActiveTab("promos_email")}
        >
          📧 {isEs ? "Promos y Email" : "Promos & Email"} ({promoCodesList.length})
        </button>
      </div>

      {/* =================================================================
          TAB: STAGE 17 AI PATCH AGENT & PLAYER KEYWORD SEARCH ANALYTICS
         ================================================================= */}
      {activeTab === "patch_ai" && (
        <AdminPatchAiPanel
          lang={lang}
          reports={patchReports}
          keywordAnalytics={keywordAnalytics}
          loading={loadingPatchAi}
          onRefresh={loadPatchAi}
          onPatchChanged={async () => {
            await loadOverview();
            if (onAdminDataChanged) await onAdminDataChanged();
          }}
          onBanner={showBanner}
        />
      )}

      {/* =================================================================
          TAB 0: TELEMETRY, FEATURE FLAGS & LIVE GLOBAL TICKER
         ================================================================= */}
      {activeTab === "telemetry_flags" && (
        <form className="admin-grid" onSubmit={handleSaveSiteSettings}>
          {/* Live Global Alert Ticker Card */}
          <div className="admin-card">
            <span className="cat-tag">
              📢 {isEs ? "TICKER DE ALERTA GLOBAL EN VIVO" : "LIVE GLOBAL ALERT TICKER"}
            </span>
            <h3>
              {isEs
                ? "Mensaje Urgente en la Barra Superior del Hub"
                : "Top-Bar Broadcast Banner (EN / ES)"}
            </h3>
            <p className="muted-sub" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {isEs
                ? "Publica avisos instantáneos sobre nuevos parches de Rockstar, glitches activos o mantenimiento programado."
                : "Broadcast instant alerts across every player's screen for Rockstar patch updates, working money glitches, or events."}
            </p>

            <label
              className="flag-toggle-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "11px 13px",
                borderRadius: 10,
                background: "#080c16",
                border: "1px solid var(--border)",
                cursor: "pointer"
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: "#fff", display: "block" }}>
                  {isEs ? "Activar Ticker Global en el Hub" : "Enable Global Alert Ticker"}
                </strong>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {bannerActive
                    ? isEs
                      ? "🟢 Visible ahora mismo para todos los jugadores"
                      : "🟢 Currently broadcasting live to all players"
                    : isEs
                      ? "⚪ Oculto"
                      : "⚪ Hidden"}
                </span>
              </div>
              <input
                type="checkbox"
                checked={bannerActive}
                onChange={(e) => setBannerActive(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "var(--accent-cyan)" }}
              />
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs ? "Texto del Ticker (Inglés - EN)" : "Ticker Message (English - EN)"}
              </label>
              <input
                type="text"
                maxLength={240}
                value={bannerTextEn}
                onChange={(e) => setBannerTextEn(e.target.value)}
                placeholder="🚨 Patch 01.002.001 Live: Leonida Garage Duplication Glitch still WORKING!"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs ? "Texto del Ticker (Español - ES)" : "Ticker Message (Spanish - ES)"}
              </label>
              <input
                type="text"
                maxLength={240}
                value={bannerTextEs}
                onChange={(e) => setBannerTextEs(e.target.value)}
                placeholder="🚨 Parche 01.002.001 Activo: ¡El Glitch de Duplicar Autos sigue ACTIVO!"
              />
            </div>
          </div>

          {/* Feature Flags & Dynamic Free AI Daily Limit Card */}
          <div className="admin-card">
            <span className="cat-tag">
              ⚙️ {isEs ? "FEATURE FLAGS Y CUOTA DE IA" : "RUNTIME FEATURE FLAGS & AI QUOTA"}
            </span>
            <h3>
              {isEs
                ? "Interruptores Operativos en Tiempo Real"
                : "Zero-Downtime Feature Switches & Rate Limits"}
            </h3>

            <label
              className="flag-toggle-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "11px 13px",
                borderRadius: 10,
                background: "#080c16",
                border: "1px solid var(--border)",
                cursor: "pointer"
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: "#fff", display: "block" }}>
                  ⚡ {isEs ? "Habilitar Pestaña de Glitches" : "Enable Glitches & Exploits Tab"}
                </strong>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {isEs
                    ? "Si se desactiva, oculta la pestaña Glitches para usuarios no-admin."
                    : "When disabled, hides the Glitches tab for non-admin players."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={glitchesTabEnabled}
                onChange={(e) => setGlitchesTabEnabled(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "var(--accent-cyan)" }}
              />
            </label>

            <label
              className="flag-toggle-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "11px 13px",
                borderRadius: 10,
                background: "#080c16",
                border: maintenanceMode
                  ? "1px solid rgba(245, 158, 11, 0.6)"
                  : "1px solid var(--border)",
                cursor: "pointer"
              }}
            >
              <div>
                <strong style={{ fontSize: 13, color: "#fff", display: "block" }}>
                  🛡️ {isEs ? "Escudo de Modo Mantenimiento" : "Maintenance Mode Shield"}
                </strong>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {isEs
                    ? "Muestra una pantalla de mantenimiento a jugadores regulares (los admins tienen bypass)."
                    : "Displays a sleek Maintenance Shield to non-admins while Admins keep full bypass access."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "#f59e0b" }}
              />
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              <label
                htmlFor="free-ai-daily-limit"
                style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}
              >
                🤖{" "}
                {isEs
                  ? "Límite Diario de Consultas IA para Reclutas Gratis (1–20)"
                  : "Dynamic Free Tier Daily AI Advisor Limit (1–20 queries/day)"}
              </label>
              <input
                id="free-ai-daily-limit"
                type="number"
                min={1}
                max={20}
                value={freeAiDailyLimit}
                onChange={(e) =>
                  setFreeAiDailyLimit(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                }
              />
            </div>

            <div className="composer-actions" style={{ marginTop: "auto", paddingTop: 8 }}>
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={savingSettings}
              >
                {savingSettings
                  ? isEs
                    ? "Guardando Configuración..."
                    : "Saving Settings..."
                  : isEs
                    ? "💾 Guardar Ticker y Feature Flags"
                    : "💾 Save Live Ticker & Feature Flags"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =================================================================
          TAB 1: LIVE GLITCH & CHEAT MANAGER
         ================================================================= */}
      {activeTab === "glitches_cheats" && (
        <div className="admin-grid">
          {/* Glitch Status Live Toggle List */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <span className="cat-tag">
                  {isEs ? "ESTADO EN VIVO (1 CLIC)" : "1-CLICK PATCH STATUS"}
                </span>
                <h3 style={{ fontSize: 17, marginTop: 4 }}>
                  ⚡ {isEs ? "Glitches Activos vs. Parcheados" : "Active vs. Patched Glitches"}
                </h3>
              </div>
              <button type="button" className="btn-secondary" onClick={resetGlitchForm}>
                + {isEs ? "Nuevo Glitch" : "New Glitch"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {overview.glitches.length === 0 ? (
                <p className="muted-sub">
                  {isEs ? "No hay glitches cargados todavía." : "No glitches loaded yet."}
                </p>
              ) : (
                overview.glitches.map((g) => {
                  const patched = Boolean(g.isPatched);
                  return (
                    <div
                      key={g.id}
                      className="admin-user-row"
                      style={{ flexWrap: "wrap", gap: 10 }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span className={patched ? "status-patched" : "status-working"}>
                            ● {patched ? (isEs ? "PARCHEADO" : "PATCHED") : (isEs ? "ACTIVO" : "WORKING")}
                          </span>
                          <span className="cat-tag">{g.category}</span>
                        </div>
                        <strong style={{ display: "block", marginTop: 5, fontSize: 13.5 }}>
                          {tField(g.title, lang)}
                        </strong>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          ID: {g.id} • 👍 {g.votes}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={togglingGlitchId === g.id}
                          style={{
                            borderColor: patched ? "#22c55e" : "#f43f5e",
                            color: patched ? "#4ade80" : "#fda4af",
                            fontSize: 12,
                            padding: "7px 10px"
                          }}
                          onClick={() => void handleToggleGlitchStatus(g)}
                        >
                          {togglingGlitchId === g.id
                            ? "..."
                            : patched
                              ? isEs
                                ? "Marcar ACTIVO"
                                : "Mark WORKING"
                              : isEs
                                ? "Marcar PARCHEADO"
                                : "Mark PATCHED"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: "7px 10px" }}
                          onClick={() => populateGlitchForm(g)}
                        >
                          ✏️ {isEs ? "Editar" : "Edit"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add / Edit Glitch Form */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handleSaveGlitch}>
            <span className="cat-tag">
              {glitchId
                ? isEs
                  ? `EDITANDO GLITCH: ${glitchId}`
                  : `EDITING GLITCH: ${glitchId}`
                : isEs
                  ? "PUBLICAR NUEVO GLITCH"
                  : "ADD / EDIT GLITCH"}
            </span>
            <h3 style={{ fontSize: 17 }}>
              {isEs ? "Editor de Glitch (EN / ES)" : "Glitch Editor (Bilingual EN / ES)"}
            </h3>

            <div className="composer-row">
              <input
                type="text"
                value={glitchId}
                onChange={(e) => setGlitchId(e.target.value)}
                placeholder={isEs ? "ID opcional (vacío = nuevo)" : "Optional ID (blank = new)"}
              />
              <select
                value={glitchCategory}
                onChange={(e) => setGlitchCategory(e.target.value as GlitchCategory)}
              >
                {GLITCH_CAT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="composer-row" style={{ alignItems: "center" }}>
              <input
                type="text"
                value={glitchPatchStatus}
                onChange={(e) => setGlitchPatchStatus(e.target.value)}
                placeholder="WORKING ON PATCH 01.002.001"
              />
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: glitchIsPatched ? "#fda4af" : "#86efac",
                  cursor: "pointer"
                }}
              >
                <input
                  type="checkbox"
                  checked={glitchIsPatched}
                  onChange={(e) => setGlitchIsPatched(e.target.checked)}
                />
                {isEs ? "Marcar como PATCHED" : "Mark as PATCHED"}
              </label>
            </div>

            <div className="composer-row">
              <input
                type="text"
                required
                value={glitchTitleEn}
                onChange={(e) => setGlitchTitleEn(e.target.value)}
                placeholder="Title (EN)"
              />
              <input
                type="text"
                value={glitchTitleEs}
                onChange={(e) => setGlitchTitleEs(e.target.value)}
                placeholder="Título (ES)"
              />
            </div>

            <div className="composer-row">
              <textarea
                rows={3}
                value={glitchStepsEn}
                onChange={(e) => setGlitchStepsEn(e.target.value)}
                placeholder={isEs ? "Pasos EN (uno por línea)" : "Steps EN (one step per line)"}
              />
              <textarea
                rows={3}
                value={glitchStepsEs}
                onChange={(e) => setGlitchStepsEs(e.target.value)}
                placeholder={isEs ? "Pasos ES (uno por línea)" : "Steps ES (one step per line)"}
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                value={glitchWarningEn}
                onChange={(e) => setGlitchWarningEn(e.target.value)}
                placeholder="Warning / Risk note (EN)"
              />
              <input
                type="text"
                value={glitchWarningEs}
                onChange={(e) => setGlitchWarningEs(e.target.value)}
                placeholder="Advertencia / Riesgo (ES)"
              />
            </div>

            <div className="composer-actions">
              {glitchId && (
                <button type="button" className="btn-secondary" onClick={resetGlitchForm}>
                  {isEs ? "Cancelar" : "Clear"}
                </button>
              )}
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={savingGlitch}
              >
                {savingGlitch
                  ? isEs
                    ? "Guardando..."
                    : "Saving..."
                  : isEs
                    ? "Guardar Glitch en Vivo"
                    : "Save Glitch Live"}
              </button>
            </div>
          </form>

          {/* Cheat Code + D-Pad Sequence Publisher */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handleSaveCheat}>
            <span className="cat-tag">
              {cheatId
                ? isEs
                  ? `EDITANDO TRUCO: ${cheatId}`
                  : `EDITING CHEAT: ${cheatId}`
                : isEs
                  ? "PUBLICAR CÓDIGO DE TRUCO"
                  : "PUBLISH CRACKED CHEAT CODE"}
            </span>
            <h3 style={{ fontSize: 17 }}>
              🎮 {isEs ? "Editor de Truco + Secuencia D-Pad" : "Cheat Code & D-Pad Sequence Publisher"}
            </h3>

            <div className="composer-row">
              <input
                type="text"
                value={cheatId}
                onChange={(e) => setCheatId(e.target.value)}
                placeholder={isEs ? "ID opcional (ej. money-250k)" : "Optional ID (e.g., money-250k)"}
              />
              <select
                value={cheatCategory}
                onChange={(e) => setCheatCategory(e.target.value as CheatCategory)}
              >
                {CHEAT_CAT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="composer-row">
              <input
                type="text"
                required
                value={cheatTitleEn}
                onChange={(e) => setCheatTitleEn(e.target.value)}
                placeholder="Cheat Title (EN)"
              />
              <input
                type="text"
                value={cheatTitleEs}
                onChange={(e) => setCheatTitleEs(e.target.value)}
                placeholder="Título del Truco (ES)"
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                value={cheatUnlockEn}
                onChange={(e) => setCheatUnlockEn(e.target.value)}
                placeholder="Unlock Challenge (EN)"
              />
              <input
                type="text"
                value={cheatUnlockEs}
                onChange={(e) => setCheatUnlockEs(e.target.value)}
                placeholder="Desafío de Desbloqueo (ES)"
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                value={cheatHowEn}
                onChange={(e) => setCheatHowEn(e.target.value)}
                placeholder="How to Unlock Guide (EN)"
              />
              <input
                type="text"
                value={cheatHowEs}
                onChange={(e) => setCheatHowEs(e.target.value)}
                placeholder="Cómo Desbloquearlo (ES)"
              />
            </div>

            <div className="composer-row">
              <textarea
                rows={2}
                value={cheatDescEn}
                onChange={(e) => setCheatDescEn(e.target.value)}
                placeholder="Effect Description (EN)"
              />
              <textarea
                rows={2}
                value={cheatDescEs}
                onChange={(e) => setCheatDescEs(e.target.value)}
                placeholder="Descripción del Efecto (ES)"
              />
            </div>

            {/* Interactive D-Pad Sequence Builder */}
            <div className="combo-visual-wrap">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 6
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--accent-cyan)" }}>
                  {isEs ? "CONSTRUCTOR DE SECUENCIA D-PAD" : "D-PAD SEQUENCE BUILDER"} ({cheatSeq.length})
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                    onClick={() => setCheatSeq((prev) => prev.slice(0, -1))}
                    disabled={cheatSeq.length === 0}
                  >
                    ⌫ {isEs ? "Borrar Último" : "Undo"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                    onClick={() => setCheatSeq([])}
                    disabled={cheatSeq.length === 0}
                  >
                    {isEs ? "Limpiar" : "Clear"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DIRECTION_KEYS.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    className="ctrl-key dpad"
                    style={{ cursor: "pointer" }}
                    onClick={() => setCheatSeq((prev) => (prev.length < 16 ? [...prev, dir] : prev))}
                  >
                    {ARROW_MAP[dir]}
                  </button>
                ))}
              </div>

              <div className="combo-keys-row" style={{ minHeight: 30 }}>
                {cheatSeq.length === 0 ? (
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    {isEs
                      ? "Toca ↑ ↓ ← → arriba para armar la secuencia (déjalo vacío si sigue en búsqueda)."
                      : "Click ↑ ↓ ← → above to build the button combo (leave empty if combo is still pending)."}
                  </span>
                ) : (
                  cheatSeq.map((dir, idx) => (
                    <span key={`${dir}-${idx}`} className="ctrl-key dpad">
                      {ARROW_MAP[dir]}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="composer-actions">
              {cheatId && (
                <button type="button" className="btn-secondary" onClick={resetCheatForm}>
                  {isEs ? "Cancelar" : "Clear"}
                </button>
              )}
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={savingCheat}
              >
                {savingCheat
                  ? isEs
                    ? "Publicando..."
                    : "Publishing..."
                  : isEs
                    ? "Publicar Truco en Vivo"
                    : "Publish Cheat Live"}
              </button>
            </div>
          </form>

          {/* Existing Cheats Quick-Edit List with "Combo Pending Only" Toggle Filter */}
          <div className="admin-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8
              }}
            >
              <div>
                <span className="cat-tag">
                  {isEs ? "TRUCOS PUBLICADOS" : "PUBLISHED CHEAT CODES"} ({displayedCheats.length} /{" "}
                  {overview.cheats.length})
                </span>
                <h3 style={{ fontSize: 17, marginTop: 4 }}>
                  {isEs
                    ? "Seleccionar para Editar o Añadir Combo"
                    : "Quick-Select to Edit or Add Cracked Combo"}
                </h3>
              </div>

              <button
                type="button"
                className={`layer-chip ${comboPendingOnly ? "active" : ""}`}
                onClick={() => setComboPendingOnly((prev) => !prev)}
                style={{ fontSize: 11.5, padding: "6px 11px" }}
              >
                ⏳{" "}
                {isEs
                  ? `Solo Combos Pendientes (${pendingCheatsCount})`
                  : `Combo Pending Only (${pendingCheatsCount})`}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
                maxHeight: 420,
                overflowY: "auto"
              }}
            >
              {displayedCheats.length === 0 ? (
                <p className="muted-sub">
                  {isEs
                    ? "No hay trucos con combo pendiente en este momento."
                    : "No cheats match the current filter."}
                </p>
              ) : (
                displayedCheats.map((c) => (
                  <div key={c.id} className="admin-user-row">
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <strong style={{ fontSize: 13 }}>{tField(c.title, lang)}</strong>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {c.category} •{" "}
                        {c.seq.length > 0 ? (
                          <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                            {c.seq.map((k) => ARROW_MAP[k]).join(" ")}
                          </span>
                        ) : (
                          <span style={{ color: "#fde047" }}>
                            ⏳ {isEs ? "Combo pendiente" : "Combo pending"}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: 11.5, padding: "6px 10px" }}
                      onClick={() => populateCheatForm(c)}
                    >
                      ✏️ {isEs ? "Editar" : "Edit"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 2: MAP PIN PUBLISHER (INTERACTIVE LEONIDA SVG RADAR PICKER)
         ================================================================= */}
      {activeTab === "pins" && (
        <div className="admin-grid">
          <div className="admin-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10
              }}
            >
              <div>
                <span className="cat-tag">
                  {isEs ? "RADAR INTERACTIVO DE LEONIDA" : "INTERACTIVE LEONIDA RADAR PICKER"}
                </span>
                <h3 style={{ fontSize: 17, marginTop: 3 }}>
                  🗺️ {isEs ? "Haz Clic en el Mapa para Fijar Coordenadas" : "Click Anywhere on Radar to Set Coordinates"}
                </h3>
              </div>
              <span className="verified-badge">
                X: {pinX}% • Y: {pinY}%
              </span>
            </div>

            <div
              className="admin-map-picker"
              onClick={handleRadarClick}
              role="button"
              tabIndex={0}
              aria-label={
                isEs
                  ? "Selector interactivo de coordenadas del mapa de Leonida"
                  : "Interactive Leonida map coordinate picker"
              }
            >
              <svg viewBox="0 0 900 680" className="leonida-svg" style={{ display: "block" }}>
                <defs>
                  <pattern id="adminGrid" width="36" height="36" patternUnits="userSpaceOnUse">
                    <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#16223b" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="adminOceanGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#060b16" />
                    <stop offset="100%" stopColor="#091326" />
                  </linearGradient>
                  <linearGradient id="adminLandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#18243d" />
                    <stop offset="60%" stopColor="#142036" />
                    <stop offset="100%" stopColor="#111b2e" />
                  </linearGradient>
                </defs>
                <rect width="900" height="680" fill="url(#adminOceanGrad)" />
                <rect width="900" height="680" fill="url(#adminGrid)" />
                <path
                  d="M165,30 L615,30 L685,210 L725,425 L675,525 L555,585 L370,635 L220,665 L205,645 L350,605 L465,550 L395,485 L295,455 L235,345 L145,255 L125,130 Z"
                  fill="rgba(0, 229, 255, 0.05)"
                />
                <path
                  d="M185,40 L595,40 L645,165 L675,310 L692,415 L665,485 L620,518 L555,535 L490,515 L440,468 L360,445 L290,415 L258,340 L215,318 L185,250 L160,150 Z"
                  fill="url(#adminLandGrad)"
                  stroke="#00e5ff"
                  strokeWidth="2"
                  strokeOpacity="0.6"
                />
                <path
                  d="M706,335 L722,338 L715,438 L698,435 Z"
                  fill="#1b2947"
                  stroke="#ff2a85"
                  strokeWidth="1.5"
                />
                <path
                  d="M455,255 Q515,245 535,288 Q525,335 475,332 Q435,320 455,255 Z"
                  fill="#070d19"
                  stroke="#00e5ff"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
                <path
                  d="M565,535 Q485,585 375,615 Q290,635 225,650"
                  fill="none"
                  stroke="#ff2a85"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  strokeOpacity="0.75"
                />
                <text x="365" y="82" className="region-label">MOUNT KALAGA</text>
                <text x="245" y="245" className="region-label">PORT GELLHORN</text>
                <text x="490" y="232" className="region-label">AMBROSIA</text>
                <text x="615" y="378" className="region-label">VICE CITY</text>
                <text x="485" y="492" className="region-label">GRASSRIVERS</text>
                <text x="385" y="655" className="region-label">LEONIDA KEYS</text>
              </svg>

              {/* Existing Dynamic Pins */}
              {overview.dynamicPins.map((p) => (
                <span
                  key={p.id}
                  title={`${p.icon} ${tField(p.name, lang)} (${p.x}%, ${p.y}%)`}
                  style={{
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: 13,
                    opacity: 0.72,
                    pointerEvents: "none"
                  }}
                >
                  {p.icon}
                </span>
              ))}

              {/* Active Clicked Preview Dot */}
              <div
                className="admin-map-dot"
                style={{ left: `${pinX}%`, top: `${pinY}%` }}
                title={`(${pinX}%, ${pinY}%)`}
              >
                {pinIcon}
              </div>
            </div>

            <p className="muted-sub" style={{ marginTop: 8 }}>
              {isEs
                ? "El punto brillante marca exactamente dónde aparecerá el nuevo pin en el Mapa Táctico."
                : "The glowing marker previews the exact location where your new pin will appear on the Tactical Map."}
            </p>
          </div>

          {/* New Pin Form */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handlePublishPin}>
            <span className="cat-tag">{isEs ? "PUBLICAR NUEVO PIN" : "PUBLISH DYNAMIC MAP PIN"}</span>
            <h3 style={{ fontSize: 17 }}>
              📍 {isEs ? "Detalles del Pin Táctico" : "Tactical Pin Details"}
            </h3>

            <div className="composer-row">
              <select
                value={pinType}
                onChange={(e) => {
                  const nextType = e.target.value as PinType;
                  setPinType(nextType);
                  const found = PIN_TYPE_OPTIONS.find((opt) => opt.value === nextType);
                  if (found) setPinIcon(found.icon);
                }}
              >
                {PIN_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {isEs ? opt.es : opt.en}
                  </option>
                ))}
              </select>

              <select value={pinTier} onChange={(e) => setPinTier(e.target.value as UserTier)}>
                <option value="free">Free ($0)</option>
                <option value="street">Street Pass ($1.99)</option>
                <option value="kingpin">Kingpin VIP ($4.99)</option>
              </select>
            </div>

            <div className="composer-row">
              <select value={pinRegion} onChange={(e) => setPinRegion(e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <input
                type="text"
                maxLength={8}
                value={pinIcon}
                onChange={(e) => setPinIcon(e.target.value)}
                placeholder="Icon (e.g. 💰)"
                style={{ maxWidth: 120 }}
              />
            </div>

            <div className="composer-row">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={pinX}
                onChange={(e) => setPinX(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                placeholder="X %"
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={pinY}
                onChange={(e) => setPinY(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                placeholder="Y %"
              />
            </div>

            <div className="composer-row">
              <input
                type="text"
                required
                value={pinNameEn}
                onChange={(e) => setPinNameEn(e.target.value)}
                placeholder="Pin Name (EN)"
              />
              <input
                type="text"
                value={pinNameEs}
                onChange={(e) => setPinNameEs(e.target.value)}
                placeholder="Nombre del Pin (ES)"
              />
            </div>

            <div className="composer-row">
              <textarea
                rows={2}
                value={pinNoteEn}
                onChange={(e) => setPinNoteEn(e.target.value)}
                placeholder="Tactical Note / Loot Details (EN)"
              />
              <textarea
                rows={2}
                value={pinNoteEs}
                onChange={(e) => setPinNoteEs(e.target.value)}
                placeholder="Nota Táctica / Botín (ES)"
              />
            </div>

            <div className="composer-actions">
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={savingPin}
              >
                {savingPin
                  ? isEs
                    ? "Publicando..."
                    : "Publishing..."
                  : isEs
                    ? "Publicar Pin en el Mapa"
                    : "Publish Pin to Live Map"}
              </button>
            </div>

            {/* Dynamic Pins List with Delete */}
            <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <span className="cat-tag">
                {isEs ? "PINES DINÁMICOS PUBLICADOS" : "CUSTOM DYNAMIC PINS"} ({overview.dynamicPins.length})
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {overview.dynamicPins.length === 0 ? (
                  <p className="muted-sub">
                    {isEs
                      ? "Aún no has publicado pines dinámicos personalizados."
                      : "No custom dynamic pins published yet."}
                  </p>
                ) : (
                  overview.dynamicPins.map((p) => (
                    <div key={p.id} className="admin-user-row">
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <strong style={{ fontSize: 13 }}>
                          {p.icon} {tField(p.name, lang)}
                        </strong>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {p.region} • {p.type} • {p.tier.toUpperCase()} • ({p.x}%, {p.y}%)
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={deletingPinId === p.id}
                        style={{
                          borderColor: "rgba(244, 63, 94, 0.55)",
                          color: "#fda4af",
                          fontSize: 11.5,
                          padding: "6px 10px"
                        }}
                        onClick={() => void handleDeletePin(p.id)}
                      >
                        {deletingPinId === p.id
                          ? "..."
                          : isEs
                            ? "🗑️ Eliminar"
                            : "🗑️ Delete"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================
          TAB 3: COMMUNITY INTEL MODERATION & IMMUTABLE CO-FOUNDER AUDIT LOG
         ================================================================= */}
      {activeTab === "submissions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <div className="map-layer-chips">
              {(
                [
                  { id: "pending", en: `⏳ Pending (${submissionCounts.pending})`, es: `⏳ Pendientes (${submissionCounts.pending})` },
                  { id: "approved", en: `✓ Approved (${submissionCounts.approved})`, es: `✓ Aprobados (${submissionCounts.approved})` },
                  { id: "implemented", en: `🚀 Implemented (${submissionCounts.implemented})`, es: `🚀 Implementados (${submissionCounts.implemented})` },
                  { id: "rejected", en: `✕ Rejected (${submissionCounts.rejected})`, es: `✕ Rechazados (${submissionCounts.rejected})` },
                  { id: "all", en: `📋 All (${submissionCounts.all})`, es: `📋 Todos (${submissionCounts.all})` }
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={`layer-chip ${subFilter === chip.id ? "active" : ""}`}
                  onClick={() => setSubFilter(chip.id)}
                >
                  {isEs ? chip.es : chip.en}
                </button>
              ))}
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="paywall-box" style={{ maxWidth: 480 }}>
                <h3>{isEs ? "Cola Limpia" : "Queue Is Clear"}</h3>
                <p>
                  {isEs
                    ? "No hay envíos de la comunidad en este estado."
                    : "There are no community submissions matching this status filter."}
                </p>
              </div>
            ) : (
              <div className="forum-feed">
                {filteredSubmissions.map((sub) => (
                  <div key={sub.id} className="admin-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          className={
                            sub.status === "approved"
                              ? "verified-badge"
                              : sub.status === "implemented"
                                ? "implemented-badge"
                                : sub.status === "rejected"
                                  ? "status-patched"
                                  : "submission-badge"
                          }
                        >
                          {sub.status.toUpperCase()}
                        </span>
                        <span className="submission-badge">{sub.submissionType}</span>
                        {sub.regionOrCategory && (
                          <span className="coord-pill">📍 {sub.regionOrCategory}</span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap"
                        }}
                      >
                        <strong style={{ color: "var(--accent-cyan)" }}>{sub.authorHandle}</strong>
                        {sub.authorPsnVerified && (
                          <span className="console-verified-pill">PSN ✓</span>
                        )}
                        {sub.authorXboxVerified && (
                          <span className="console-verified-pill">XBOX ✓</span>
                        )}
                        • ▲ {sub.votes} • {formatDateTime(sub.createdAt, isEs)}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>{sub.title}</h4>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#cbd5e1",
                        lineHeight: 1.5,
                        marginTop: 6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word"
                      }}
                    >
                      {sub.details}
                    </p>

                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <label
                        htmlFor={`admin-note-${sub.id}`}
                        style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}
                      >
                        {isEs
                          ? "Nota Pública del Equipo ViceLink (visible para el jugador)"
                          : "ViceLink Admin Notes (shown on card)"}
                      </label>
                      <input
                        id={`admin-note-${sub.id}`}
                        type="text"
                        className="auth-input"
                        value={adminNotesDraft[sub.id] ?? sub.adminNotes ?? ""}
                        onChange={(e) =>
                          setAdminNotesDraft((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        placeholder={
                          isEs
                            ? "ej., ¡Verificado en el parche 01.002.001 y añadido al mapa!"
                            : "e.g., Verified on Patch 01.002.001 and added to the Tactical Map!"
                        }
                      />
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={updatingSubId === sub.id}
                        style={{ borderColor: "#22c55e", color: "#4ade80" }}
                        onClick={() => void handleModerateSubmission(sub.id, "approved")}
                      >
                        ✓ {isEs ? "Aprobar" : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={updatingSubId === sub.id}
                        style={{ borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}
                        onClick={() => void handleModerateSubmission(sub.id, "implemented")}
                      >
                        🚀 {isEs ? "Marcar Implementado" : "Mark Implemented"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={updatingSubId === sub.id}
                        style={{ borderColor: "#f43f5e", color: "#fda4af" }}
                        onClick={() => void handleModerateSubmission(sub.id, "rejected")}
                      >
                        ✕ {isEs ? "Rechazar" : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Immutable Co-Founder Audit Log Table */}
          <div className="admin-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8
              }}
            >
              <div>
                <span className="cat-tag">
                  🔒 {isEs ? "REGISTRO INMUTABLE DE AUDITORÍA" : "IMMUTABLE CO-FOUNDER AUDIT LOG"}
                </span>
                <h3 style={{ fontSize: 17, marginTop: 4 }}>
                  📜{" "}
                  {isEs
                    ? "Historial de Acciones Administrativas (vicelink_admin_audit_logs)"
                    : "Recent Administrative Actions (vicelink_admin_audit_logs)"}
                </h3>
              </div>
              <span className="verified-badge">{overview.auditLogs.length} entries</span>
            </div>

            <div className="fence-table-wrap audit-log-table-wrap">
              <table className="receipt-table audit-log-table">
                <thead>
                  <tr>
                    <th>{isEs ? "Fecha / Hora" : "Timestamp"}</th>
                    <th>{isEs ? "Admin / Co-Fundador" : "Admin Email"}</th>
                    <th>{isEs ? "Acción" : "Action Type"}</th>
                    <th>{isEs ? "Objetivo" : "Target ID"}</th>
                    <th>{isEs ? "Detalles" : "Details"}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
                        {isEs
                          ? "Aún no hay eventos registrados en la bitácora de auditoría."
                          : "No audit events recorded yet."}
                      </td>
                    </tr>
                  ) : (
                    overview.auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          {formatAuditTimestamp(log.createdAt, isEs)}
                        </td>
                        <td>
                          <strong style={{ color: "var(--accent-cyan)" }}>
                            {log.adminEmail || log.adminId}
                          </strong>
                        </td>
                        <td>
                          <span className="submission-badge">{log.actionType}</span>
                        </td>
                        <td>
                          <code>{log.targetId || "—"}</code>
                        </td>
                        <td style={{ fontSize: 11.5, color: "#cbd5e1", maxWidth: 360 }}>
                          {summarizeAuditDetails(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 4: USERS, MANUAL VIP PASS GRANTER & BAN / UNBAN TOGGLE
         ================================================================= */}
      {activeTab === "users" && (
        <div className="admin-grid">
          <div className="admin-card">
            <span className="cat-tag">
              {isEs ? "DIRECTORIO DE CUENTAS Y CONSOLAS" : "PLAYER ACCOUNT & CONSOLE DIRECTORY"}
            </span>
            <h3 style={{ fontSize: 17, marginTop: 4 }}>
              🔎{" "}
              {isEs
                ? "Buscar por @usuario, Correo, PSN ID o Xbox Gamertag"
                : "Search by @handle, Email, PSN ID, or Xbox Gamertag"}
            </h3>

            <form
              onSubmit={handleUserSearchSubmit}
              className="controls-bar"
              style={{ marginTop: 12, marginBottom: 12 }}
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder={
                  isEs
                    ? "Buscar @usuario, correo, PSN ID o Xbox Gamertag..."
                    : "Search @handle, email, PSN ID, or Xbox Gamertag..."
                }
              />
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={searchingUsers}
              >
                {searchingUsers
                  ? isEs
                    ? "Buscando..."
                    : "Searching..."
                  : isEs
                    ? "Buscar"
                    : "Search"}
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflowY: "auto" }}>
              {users.length === 0 ? (
                <p className="muted-sub">
                  {searchingUsers
                    ? isEs
                      ? "Consultando usuarios..."
                      : "Loading users..."
                    : isEs
                      ? "Sin resultados. Intenta buscar por correo, @handle o consola."
                      : "No matching accounts. Try searching by email, @handle, or console ID."}
                </p>
              ) : (
                users.map((u) => {
                  const selected = u.userId === selectedUserId;
                  const banned = Boolean(u.isBanned);
                  return (
                    <div
                      key={u.userId}
                      className="admin-user-row"
                      style={
                        selected
                          ? { borderColor: "var(--accent-cyan)", background: "rgba(0, 229, 255, 0.08)" }
                          : banned
                            ? { borderColor: "rgba(244, 63, 94, 0.45)", background: "rgba(244, 63, 94, 0.06)" }
                            : undefined
                      }
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <strong style={{ color: "var(--accent-cyan)", fontSize: 13 }}>
                            {u.handle}
                          </strong>
                          <span className={`tier-chip tier-${u.tier}`}>
                            {u.tier.toUpperCase()}
                          </span>
                          {u.isAdmin && <span className="verified-badge">ADMIN</span>}
                          {u.mfaEnabled && <span className="implemented-badge">🔒 2FA</span>}
                          {u.marketingOptIn === false ? (
                            <span className="cat-tag" style={{ fontSize: 10 }}>
                              Opt-Out
                            </span>
                          ) : (
                            <span
                              className="implemented-badge"
                              style={{ fontSize: 10, padding: "2px 6px" }}
                            >
                              📧 Opt-In
                            </span>
                          )}
                          {banned && (
                            <span className="status-patched">
                              🚫 {isEs ? "BANEADO" : "BANNED"}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                          {u.email}
                        </div>
                        {(u.psnId || u.xboxGamertag) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                            {u.psnId && (
                              <span
                                className={u.psnVerified ? "console-verified-pill" : "cat-tag"}
                                style={{ fontSize: 10 }}
                              >
                                PSN: {u.psnId} {u.psnVerified ? "✓" : ""}
                              </span>
                            )}
                            {u.xboxGamertag && (
                              <span
                                className={u.xboxVerified ? "console-verified-pill" : "cat-tag"}
                                style={{ fontSize: 10 }}
                              >
                                XBOX: {u.xboxGamertag} {u.xboxVerified ? "✓" : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className={selected ? "btn-pro" : "btn-secondary"}
                          style={{ width: "auto", fontSize: 11.5, padding: "6px 10px" }}
                          onClick={() => {
                            setSelectedUserId(u.userId);
                            setGrantTier(u.tier === "free" ? "street" : u.tier);
                          }}
                        >
                          {selected
                            ? isEs
                              ? "✓ Seleccionado"
                              : "✓ Selected"
                            : isEs
                              ? "Seleccionar"
                              : "Select"}
                        </button>

                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={banningUserId === u.userId}
                          style={{
                            fontSize: 11.5,
                            padding: "6px 10px",
                            borderColor: banned ? "#22c55e" : "rgba(244, 63, 94, 0.55)",
                            color: banned ? "#4ade80" : "#fda4af"
                          }}
                          onClick={() => void handleToggleBanUser(u)}
                        >
                          {banningUserId === u.userId
                            ? "..."
                            : banned
                              ? isEs
                                ? "🔓 Desbanear"
                                : "🔓 Unban"
                              : isEs
                                ? "🚫 Banear"
                                : "🚫 Ban"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Grant Pass Form */}
          <form className="admin-card theory-composer" style={{ marginBottom: 0 }} onSubmit={handleGrantPass}>
            <span className="cat-tag">
              {isEs ? "OTORGAR PASE DE POR VIDA" : "MANUAL VIP PASS GRANTER"}
            </span>
            <h3 style={{ fontSize: 17 }}>
              👑 {isEs ? "Aprobar Pago Manual / Yappy QR" : "Grant Pass / Approve Yappy Receipt"}
            </h3>

            {selectedUserRecord ? (
              <div className="unlock-pill">
                <strong>{selectedUserRecord.handle}</strong> ({selectedUserRecord.email}) —{" "}
                {isEs ? "Nivel actual:" : "Current tier:"}{" "}
                <strong>{selectedUserRecord.tier.toUpperCase()}</strong>
                {selectedUserRecord.isBanned && (
                  <span className="status-patched" style={{ marginLeft: 8 }}>
                    🚫 {isEs ? "BANEADO" : "BANNED"}
                  </span>
                )}
              </div>
            ) : (
              <p className="muted-sub">
                {isEs
                  ? "Selecciona una cuenta a la izquierda para cambiar su nivel de acceso y registrar la referencia de pago."
                  : "Select a user account on the left to update their lifetime tier and log an optional receipt reference."}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="grant-tier" style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs ? "Nivel de Pase Objetivo" : "Target Access Tier"}
              </label>
              <select
                id="grant-tier"
                value={grantTier}
                onChange={(e) => setGrantTier(e.target.value as UserTier)}
              >
                <option value="free">Free Recruit ($0)</option>
                <option value="street">Street Pass ($1.99 One-Time)</option>
                <option value="kingpin">Kingpin VIP ($4.99 One-Time)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="grant-provider" style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs ? "Método de Pago" : "Payment Provider"}
              </label>
              <select
                id="grant-provider"
                value={grantProvider}
                onChange={(e) => setGrantProvider(e.target.value as PaymentProvider)}
              >
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="grant-ref" style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
                {isEs
                  ? "Referencia de Recibo / Comprobante (Opcional)"
                  : "Receipt / Reference Number (Optional)"}
              </label>
              <input
                id="grant-ref"
                type="text"
                maxLength={100}
                value={grantReference}
                onChange={(e) => setGrantReference(e.target.value)}
                placeholder={isEs ? "ej., YAPPY-QR-984321" : "e.g., YAPPY-QR-984321"}
              />
            </div>

            <div className="composer-actions">
              <button
                type="submit"
                className="btn-pro"
                style={{ width: "auto" }}
                disabled={!selectedUserId || grantingPass}
              >
                {grantingPass
                  ? isEs
                    ? "Aplicando Pase..."
                    : "Granting Pass..."
                  : isEs
                    ? "Otorgar Pase Ahora ➤"
                    : "Grant Pass Now ➤"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================
          TAB 5: STAGE 12 PROMO CODE GENERATOR & BILINGUAL EMAIL BROADCASTER
         ================================================================= */}
      {activeTab === "promos_email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="admin-grid">
            {/* CARD A: Promo & Discount Code Generator + Live Table */}
            <div className="admin-card">
              <span className="cat-tag">
                🎟️ {isEs ? "MOTOR DE CÓDIGOS PROMOCIONALES" : "PROMO & DISCOUNT CODE ENGINE"}
              </span>
              <h3 style={{ fontSize: 17, marginTop: 4 }}>
                {isEs
                  ? "Generador de Descuentos (1%–100%) y Tabla en Vivo"
                  : "Promo & Discount Code Generator (1%–100% Off)"}
              </h3>
              <p className="muted-sub" style={{ fontSize: 12.5 }}>
                {isEs
                  ? "Crea códigos de descuento (% OFF en Yappy/Tarjeta) o códigos VIP 100% gratuitos (ej. FOUNDERVIP) con límite de usos."
                  : "Create checkout discount codes (% OFF across Yappy & Card) or 100% instant VIP unlock codes (e.g. FOUNDERVIP) with max redemption caps."}
              </p>

              {/* Quick Seed Presets */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                <button
                  type="button"
                  className="layer-chip"
                  style={{ fontSize: 11, padding: "4px 9px" }}
                  onClick={() => {
                    setNewPromoCode("PANAMA50");
                    setNewPromoDiscountPct(50);
                    setNewPromoTargetTier("both");
                    setNewPromoMaxUses(500);
                  }}
                >
                  ⚡ PANAMA50 (50% • Both)
                </button>
                <button
                  type="button"
                  className="layer-chip"
                  style={{ fontSize: 11, padding: "4px 9px" }}
                  onClick={() => {
                    setNewPromoCode("LEONIDA25");
                    setNewPromoDiscountPct(25);
                    setNewPromoTargetTier("both");
                    setNewPromoMaxUses(1000);
                  }}
                >
                  🌴 LEONIDA25 (25% • Both)
                </button>
                <button
                  type="button"
                  className="layer-chip"
                  style={{ fontSize: 11, padding: "4px 9px" }}
                  onClick={() => {
                    setNewPromoCode("FOUNDERVIP");
                    setNewPromoDiscountPct(100);
                    setNewPromoTargetTier("kingpin");
                    setNewPromoMaxUses(25);
                  }}
                >
                  👑 FOUNDERVIP (100% • Kingpin)
                </button>
              </div>

              <form
                onSubmit={handleCreatePromoCode}
                style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}
              >
                <div className="composer-row">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                      {isEs ? "Código ([A-Z0-9_-]{3,24})" : "Promo Code ([A-Z0-9_-]{3,24})"}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={24}
                      value={newPromoCode}
                      onChange={(e) =>
                        setNewPromoCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_-]/g, "")
                            .slice(0, 24)
                        )
                      }
                      placeholder="e.g. PANAMA50"
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 120 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                      {isEs ? "Descuento %" : "Discount %"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={newPromoDiscountPct}
                      onChange={(e) =>
                        setNewPromoDiscountPct(
                          Math.max(1, Math.min(100, Number(e.target.value) || 50))
                        )
                      }
                    />
                  </div>
                </div>

                <div className="composer-row">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                      {isEs ? "Pase Aplicable" : "Target Pass Tier"}
                    </label>
                    <select
                      value={newPromoTargetTier}
                      onChange={(e) =>
                        setNewPromoTargetTier(
                          e.target.value as "both" | "street" | "kingpin"
                        )
                      }
                    >
                      <option value="both">
                        {isEs
                          ? "Ambos Pases (Street $1.99 + Kingpin $4.99)"
                          : "Both Passes (Street $1.99 + Kingpin $4.99)"}
                      </option>
                      <option value="street">Street Pass Only ($1.99)</option>
                      <option value="kingpin">Kingpin VIP Only ($4.99)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 130 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                      {isEs ? "Límite de Usos" : "Max Redemptions"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      required
                      value={newPromoMaxUses}
                      onChange={(e) =>
                        setNewPromoMaxUses(Math.max(1, Number(e.target.value) || 100))
                      }
                    />
                  </div>
                </div>

                <div className="composer-actions">
                  <button
                    type="submit"
                    className="btn-pro"
                    style={{ width: "auto" }}
                    disabled={savingPromo}
                  >
                    {savingPromo
                      ? isEs
                        ? "Guardando Código..."
                        : "Saving Code..."
                      : isEs
                        ? "➕ Crear / Actualizar Código Promo"
                        : "➕ Create / Upsert Promo Code"}
                  </button>
                </div>
              </form>

              {/* Live Promo Codes Table */}
              <div
                className="fence-table-wrap"
                style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}
              >
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>{isEs ? "Código" : "Code"}</th>
                      <th>{isEs ? "Descuento" : "Discount"}</th>
                      <th>{isEs ? "Nivel" : "Target"}</th>
                      <th>{isEs ? "Usos" : "Redemptions"}</th>
                      <th>{isEs ? "Acciones" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodesList.map((p) => (
                      <tr key={p.code}>
                        <td>
                          <strong style={{ color: "#facc15", letterSpacing: 1 }}>{p.code}</strong>
                        </td>
                        <td>
                          <span
                            className={
                              p.discountPct === 100 ? "kingpin-badge" : "implemented-badge"
                            }
                          >
                            {p.discountPct}% OFF
                          </span>
                        </td>
                        <td>
                          <span className="cat-tag">{p.targetTier.toUpperCase()}</span>
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {p.usesCount} / {p.maxUses}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={togglingPromoCode === p.code}
                              style={{
                                fontSize: 11,
                                padding: "4px 8px",
                                borderColor: p.active ? "#22c55e" : "#f43f5e",
                                color: p.active ? "#4ade80" : "#fda4af"
                              }}
                              onClick={() => void handleTogglePromoActive(p)}
                            >
                              {togglingPromoCode === p.code
                                ? "..."
                                : p.active
                                  ? isEs
                                    ? "🟢 Activo (Desactivar)"
                                    : "🟢 Active (Disable)"
                                  : isEs
                                    ? "🔴 Inactivo (Activar)"
                                    : "🔴 Disabled (Enable)"}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                              onClick={() => setCampaignPromoCode(p.code)}
                            >
                              📎 {isEs ? "Adjuntar" : "Attach"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARD B: Bilingual Promotional Email Broadcast Composer */}
            <form
              className="admin-card theory-composer"
              style={{ marginBottom: 0 }}
              onSubmit={handleSendPromoBroadcast}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8
                }}
              >
                <div>
                  <span className="cat-tag">
                    📧 {isEs ? "DIFUSIÓN PROMOCIONAL BILINGÜE (LEY 81)" : "BILINGUAL PROMOTIONAL EMAIL BROADCASTER"}
                  </span>
                  <h3 style={{ fontSize: 17, marginTop: 4 }}>
                    {isEs
                      ? "Enviar Ofertas y Códigos a Jugadores Opt-In (Gmail / iCloud)"
                      : "Broadcast Promo Codes to Opted-In Players (Gmail / Apple iCloud)"}
                  </h3>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    fontSize: 11.5,
                    padding: "6px 10px",
                    borderColor: "var(--accent-cyan)",
                    color: "var(--accent-cyan)"
                  }}
                  onClick={handleLoadWeekendPromoTemplate}
                >
                  ⚡{" "}
                  {isEs
                    ? "Cargar Plantilla 50% Fin de Semana"
                    : "Load 50% Weekend Promo Template"}
                </button>
              </div>

              <div className="composer-row">
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                    {isEs ? "Audiencia Objetivo (Solo Opt-In)" : "Target Audience (Opted-In Only)"}
                  </label>
                  <select
                    value={campaignAudience}
                    onChange={(e) =>
                      setCampaignAudience(e.target.value as EmailCampaignAudience)
                    }
                  >
                    <option value="all_opted_in">
                      {isEs
                        ? "Todos los Usuarios con Opt-In (all_opted_in)"
                        : "All Opted-In Members (all_opted_in)"}
                    </option>
                    <option value="free_only">
                      {isEs
                        ? "Solo Reclutas Gratis — Conversión a Street/VIP (free_only)"
                        : "Free Recruits Only — High-Conversion Upgrade (free_only)"}
                    </option>
                    <option value="street_only">
                      {isEs
                        ? "Solo Street Pass — Upsell a Kingpin VIP (street_only)"
                        : "Street Pass Owners Only — Kingpin VIP Upsell (street_only)"}
                    </option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 175 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                    {isEs ? "Código Promo Adjunto" : "Attach Promo Code"}
                  </label>
                  <select
                    value={campaignPromoCode}
                    onChange={(e) => setCampaignPromoCode(e.target.value)}
                  >
                    {promoCodesList.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} ({p.discountPct}% OFF)
                      </option>
                    ))}
                    <option value="">{isEs ? "Sin código" : "No Promo Code"}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                  🧪{" "}
                  {isEs
                    ? "Correo de Prueba Opcional (Gmail / Apple iCloud / Outlook — vacío para enviar a toda la audiencia)"
                    : "Optional Test Email Only (Gmail / Apple iCloud / Outlook — leave blank for full broadcast)"}
                </label>
                <input
                  type="email"
                  value={testEmailOnly}
                  onChange={(e) => setTestEmailOnly(e.target.value)}
                  placeholder="e.g. mikehevi2003@gmail.com or founder@icloud.com"
                />
              </div>

              <div className="composer-row">
                <input
                  type="text"
                  required
                  value={campaignSubjectEn}
                  onChange={(e) => setCampaignSubjectEn(e.target.value)}
                  placeholder="Subject (English - EN)"
                />
                <input
                  type="text"
                  value={campaignSubjectEs}
                  onChange={(e) => setCampaignSubjectEs(e.target.value)}
                  placeholder="Asunto (Español - ES)"
                />
              </div>

              <div className="composer-row">
                <textarea
                  rows={4}
                  required
                  value={campaignBodyEn}
                  onChange={(e) => setCampaignBodyEn(e.target.value)}
                  placeholder="Promotional Email Body (English - EN)"
                />
                <textarea
                  rows={4}
                  value={campaignBodyEs}
                  onChange={(e) => setCampaignBodyEs(e.target.value)}
                  placeholder="Cuerpo del Correo Promocional (Español - ES)"
                />
              </div>

              <div className="composer-actions" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEmailPreview((prev) => !prev)}
                >
                  👁️{" "}
                  {showEmailPreview
                    ? isEs
                      ? "Ocultar Vista Previa HTML (Ley 81)"
                      : "Hide HTML Email Preview (Law 81)"
                    : isEs
                      ? "Ver Vista Previa HTML + Enlace /api/unsubscribe"
                      : "Preview HTML Email + /api/unsubscribe Link"}
                </button>

                <button
                  type="submit"
                  className="btn-pro"
                  style={{ width: "auto" }}
                  disabled={sendingCampaign}
                >
                  {sendingCampaign
                    ? isEs
                      ? "Enviando Difusión..."
                      : "Sending Broadcast..."
                    : isEs
                      ? "🚀 Enviar Difusión Promocional"
                      : "🚀 Send Promotional Broadcast"}
                </button>
              </div>

              {/* Live Delivery Summary Card */}
              {lastDeliverySummary && (
                <div
                  className="unlock-pill"
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10
                  }}
                >
                  <div>
                    <strong>
                      {isEs ? "Resumen de Entrega:" : "Delivery Summary:"}{" "}
                    </strong>
                    {lastDeliverySummary.deliveredCount} / {lastDeliverySummary.recipientsCount}{" "}
                    {isEs ? "entregados" : "delivered"}
                  </div>
                  <span
                    className={
                      lastDeliverySummary.deliveryMode === "resend_live"
                        ? "implemented-badge"
                        : "verified-badge"
                    }
                  >
                    {lastDeliverySummary.deliveryMode === "resend_live"
                      ? "🟢 resend_live (Resend SMTP)"
                      : "🧪 dry_run_logged"}
                  </span>
                </div>
              )}

              {/* Collapsible HTML Email Preview showing 1-click /api/unsubscribe link */}
              {showEmailPreview && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 12,
                    background: "#060a14",
                    border: "1px solid rgba(0, 229, 255, 0.38)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 8
                    }}
                  >
                    <span className="cat-tag">
                      🇵🇦{" "}
                      {isEs
                        ? "VISTA PREVIA HTML + BAJA EN 1 CLIC (/api/unsubscribe)"
                        : "NEO-GLASS HTML PREVIEW + 1-CLICK LAW 81 OPT-OUT (/api/unsubscribe)"}
                    </span>
                    <code style={{ fontSize: 11, color: "var(--accent-cyan)" }}>
                      List-Unsubscribe: &lt;/api/unsubscribe?uid=...&amp;token=...&gt;
                    </code>
                  </div>
                  <iframe
                    title="ViceLink Promotional Email HTML Preview"
                    sandbox=""
                    srcDoc={computedEmailPreviewHtml}
                    style={{
                      width: "100%",
                      height: 290,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 10,
                      background: "#05070e"
                    }}
                  />
                </div>
              )}
            </form>
          </div>

          {/* Recent Campaigns Log Table */}
          <div className="admin-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8
              }}
            >
              <div>
                <span className="cat-tag">
                  📬 {isEs ? "HISTORIAL DE CAMPAÑAS DE CORREO" : "RECENT PROMOTIONAL CAMPAIGNS LOG"}
                </span>
                <h3 style={{ fontSize: 17, marginTop: 4 }}>
                  {isEs
                    ? "Bitácora de Difusiones (vicelink_email_campaigns)"
                    : "Email Broadcast Audit Trail (vicelink_email_campaigns)"}
                </h3>
              </div>
              <span className="verified-badge">{emailCampaignsList.length} campaigns</span>
            </div>

            <div className="fence-table-wrap">
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>{isEs ? "Fecha / Hora" : "Timestamp"}</th>
                    <th>{isEs ? "Admin" : "Admin Email"}</th>
                    <th>{isEs ? "Audiencia" : "Audience"}</th>
                    <th>{isEs ? "Código" : "Promo Code"}</th>
                    <th>{isEs ? "Asunto" : "Subject"}</th>
                    <th>{isEs ? "Entregados" : "Delivered"}</th>
                    <th>{isEs ? "Modo" : "Delivery Mode"}</th>
                  </tr>
                </thead>
                <tbody>
                  {emailCampaignsList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ color: "var(--text-muted)", textAlign: "center", padding: 16 }}
                      >
                        {isEs
                          ? "Aún no se han enviado campañas promocionales."
                          : "No promotional email campaigns sent yet."}
                      </td>
                    </tr>
                  ) : (
                    emailCampaignsList.map((camp) => (
                      <tr key={camp.id}>
                        <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          {formatAuditTimestamp(camp.createdAt, isEs)}
                        </td>
                        <td>
                          <strong style={{ color: "var(--accent-cyan)" }}>{camp.adminEmail}</strong>
                        </td>
                        <td>
                          <span className="cat-tag">{camp.audience}</span>
                        </td>
                        <td>
                          {camp.promoCode ? (
                            <strong style={{ color: "#facc15" }}>{camp.promoCode}</strong>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          {isEs ? camp.subjectEs || camp.subjectEn : camp.subjectEn}
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>
                          {camp.deliveredCount} / {camp.recipientsCount}
                        </td>
                        <td>
                          <span
                            className={
                              camp.deliveryMode === "resend_live"
                                ? "implemented-badge"
                                : "submission-badge"
                            }
                          >
                            {camp.deliveryMode}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminView;
