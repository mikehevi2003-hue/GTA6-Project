"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AiQuotaInfo,
  ContentPayload,
  Language,
  MePayload,
  SiteSettingsPayload,
  TheoryPost,
  UserProfile,
  UserProgress
} from "@/types/vicelink";
import { LEGAL_POLICIES } from "@/lib/legal/policies";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";
import CheatsView from "@/components/views/CheatsView";
import MapView from "@/components/views/MapView";
import GlitchesView from "@/components/views/GlitchesView";
import ForumView, { type ForumActionPayload } from "@/components/views/ForumView";
import DatabaseView from "@/components/views/DatabaseView";
import MechanicsView from "@/components/views/MechanicsView";
import AiAdvisorView from "@/components/views/AiAdvisorView";
import ControlsView from "@/components/views/ControlsView";
import RadioView from "@/components/views/RadioView";
import TrophiesView from "@/components/views/TrophiesView";
import FeedbackView from "@/components/views/FeedbackView";
import AccountView from "@/components/views/AccountView";
import AdminView from "@/components/views/AdminView";
import CommandPaletteModal from "@/components/hub/CommandPaletteModal";
import PricingModal from "@/components/modals/PricingModal";
import SocialStudioModal from "@/components/modals/SocialStudioModal";
import AccountModal from "@/components/modals/AccountModal";

export type ActiveView =
  | "cheats"
  | "map"
  | "glitches"
  | "forum"
  | "database"
  | "mechanics"
  | "controls"
  | "radio"
  | "trophies"
  | "ai"
  | "feedback"
  | "account"
  | "admin";

const VALID_ACTIVE_VIEWS = new Set<ActiveView>([
  "cheats",
  "map",
  "glitches",
  "forum",
  "database",
  "mechanics",
  "controls",
  "radio",
  "trophies",
  "ai",
  "feedback",
  "account",
  "admin"
]);

const EMPTY_PROGRESS: UserProgress = {
  favorites: [],
  unlockedCheats: [],
  foundPins: [],
  plannedVehicles: [],
  plannedProps: [],
  unlockedTrophies: []
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

export default function ViceLinkHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [me, setMe] = useState<MePayload | null>(null);
  const [content, setContent] = useState<ContentPayload | null>(null);
  const [theories, setTheories] = useState<TheoryPost[]>([]);
  const [lang, setLang] = useState<Language>("en");
  const [activeView, setActiveView] = useState<ActiveView>("cheats");
  const [deepLinkPinId, setDeepLinkPinId] = useState<string | null>(null);
  const initialQueryHandledRef = useRef(false);

  const [pricingOpen, setPricingOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [tickerDismissed, setTickerDismissed] = useState(false);

  const [toast, setToast] = useState<{ kind: "success" | "info" | "error"; text: string } | null>(
    null
  );

  const showToast = useCallback((kind: "success" | "info" | "error", text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.text === text ? null : prev));
    }, 5000);
  }, []);

  // Global Cmd+K / Ctrl+K shortcut for Stage 11 Command Palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [meRes, contentRes, forumRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/content", { cache: "no-store" }),
        fetch("/api/forum", { cache: "no-store" })
      ]);

      if (meRes.status === 401 || contentRes.status === 401 || forumRes.status === 401) {
        router.replace("/login");
        return;
      }

      if (!meRes.ok || !contentRes.ok || !forumRes.ok) {
        throw new Error("Failed to load ViceLink workspace data.");
      }

      const [meData, contentData, forumData] = (await Promise.all([
        meRes.json(),
        contentRes.json(),
        forumRes.json()
      ])) as [MePayload, ContentPayload, { theories: TheoryPost[] } | TheoryPost[]];

      setMe(meData);
      setContent(contentData);
      setTheories(Array.isArray(forumData) ? forumData : forumData.theories || []);

      const nextLang = meData.profile.preferredLang === "es" ? "es" : "en";
      setLang(nextLang);
      try {
        window.localStorage.setItem("vicelink_lang", nextLang);
      } catch {
        // Ignore storage write errors
      }
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load ViceLink.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Handle ?view=... / ?pin=... / ?checkout=success / ?checkout=canceled / ?setup2fa=1 query parameters
  useEffect(() => {
    if (initialQueryHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const setup2fa = params.get("setup2fa");
    const rawView = params.get("view")?.trim().toLowerCase() ?? "";
    const rawPin = params.get("pin")?.trim() ?? "";

    if (!checkout && !setup2fa && !rawView && !rawPin) return;
    initialQueryHandledRef.current = true;

    if (setup2fa === "1") {
      setActiveView("account");
      showToast(
        "info",
        lang === "es"
          ? "🛡️ Acceso de Co-Fundador activo. Escanea tu código QR 2FA en Bóveda de Seguridad para elevar a AAL2."
          : "🛡️ Co-Founder Admin session active. Scan your 2FA Authenticator QR code below to enable AAL2."
      );
    } else if (rawPin) {
      const cleanedPin = rawPin.slice(0, 48);
      setActiveView("map");
      setDeepLinkPinId(cleanedPin);
    } else if (rawView && VALID_ACTIVE_VIEWS.has(rawView as ActiveView)) {
      setActiveView(rawView as ActiveView);
    }

    if (checkout === "success") {
      showToast(
        "success",
        lang === "es"
          ? "🎉 ¡Pago confirmado! Sincronizando tus beneficios vitalicios de ViceLink..."
          : "🎉 Payment confirmed! Refreshing your lifetime ViceLink pass entitlements..."
      );
      void loadAll();
    } else if (checkout === "canceled") {
      showToast(
        "info",
        lang === "es"
          ? "Pago cancelado. No se realizó ningún cargo a tu cuenta."
          : "Checkout canceled. No charge was made to your account."
      );
    }

    if (checkout || setup2fa) {
      window.history.replaceState({}, "", "/");
    }
  }, [lang, loadAll, showToast]);

  const patchMe = useCallback(
    async (payload: {
      handle?: string;
      displayName?: string;
      preferredLang?: Language;
      avatarPreset?: string;
      psnId?: string;
      xboxGamertag?: string;
      socialClubHandle?: string;
      mfaEnabled?: boolean;
      marketingOptIn?: boolean;
      progress?: Partial<UserProgress>;
    }) => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        router.replace("/login");
        return null;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Sync failed");
      }
      setMe(data as MePayload);
      return data as MePayload;
    },
    [router]
  );

  const handleLanguageChange = async (nextLang: Language) => {
    const prevLang = lang;
    setLang(nextLang);
    try {
      window.localStorage.setItem("vicelink_lang", nextLang);
    } catch {
      // Ignore storage write errors
    }
    try {
      await patchMe({ preferredLang: nextLang });
    } catch {
      setLang(prevLang);
    }
  };

  const updateProgressOptimistic = useCallback(
    async (updater: (prev: UserProgress) => UserProgress) => {
      if (!me) return;
      const previousProgress = me.progress;
      const nextProgress = updater(previousProgress);

      setMe((curr) => (curr ? { ...curr, progress: nextProgress } : curr));

      try {
        await patchMe({ progress: nextProgress });
      } catch {
        setMe((curr) => (curr ? { ...curr, progress: previousProgress } : curr));
        showToast(
          "error",
          lang === "es"
            ? "No se pudo sincronizar el progreso con el servidor."
            : "Could not sync progress with the server. Changes reverted."
        );
      }
    },
    [me, patchMe, showToast, lang]
  );

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const handleToggleFavorite = (cheatId: string) => {
    void updateProgressOptimistic((p) => ({
      ...p,
      favorites: toggleId(p.favorites, cheatId)
    }));
  };

  const handleToggleCheatUnlocked = (cheatId: string) => {
    void updateProgressOptimistic((p) => ({
      ...p,
      unlockedCheats: toggleId(p.unlockedCheats, cheatId)
    }));
  };

  const handleTogglePinFound = (pinId: string) => {
    void updateProgressOptimistic((p) => ({
      ...p,
      foundPins: toggleId(p.foundPins, pinId)
    }));
  };

  const handleToggleVehicle = (vehId: string) => {
    void updateProgressOptimistic((p) => ({
      ...p,
      plannedVehicles: toggleId(p.plannedVehicles, vehId)
    }));
  };

  const handleToggleProperty = (propId: string) => {
    void updateProgressOptimistic((p) => ({
      ...p,
      plannedProps: toggleId(p.plannedProps, propId)
    }));
  };

  const handleClearPlan = () => {
    void updateProgressOptimistic((p) => ({
      ...p,
      plannedVehicles: [],
      plannedProps: []
    }));
  };

  const handleToggleTrophy = (trophyId: string) => {
    void updateProgressOptimistic((p) => ({
      ...p,
      unlockedTrophies: toggleId(p.unlockedTrophies ?? [], trophyId)
    }));
  };

  const handleVoteGlitch = async (glitchId: string) => {
    const res = await fetch("/api/glitches/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ glitchId })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) {
      setPricingOpen(true);
      return;
    }
    if (!res.ok) {
      showToast(
        "error",
        data?.message || (lang === "es" ? "No se pudo registrar el voto." : "Could not record vote.")
      );
      return;
    }
    setContent((curr) => {
      if (!curr) return curr;
      return {
        ...curr,
        glitches: curr.glitches.map((g) =>
          g.id === glitchId ? { ...g, votes: data.votes, voted: data.voted } : g
        )
      };
    });
  };

  const handleUpdateHandle = async (newHandle: string) => {
    await patchMe({ handle: newHandle });
    showToast(
      "success",
      lang === "es" ? "Tu @usuario fue actualizado." : "Your @handle has been updated."
    );
  };

  const handleSaveProfile = async (patch: {
    handle?: string;
    displayName?: string;
    preferredLang?: Language;
    avatarPreset?: string;
    psnId?: string;
    xboxGamertag?: string;
    socialClubHandle?: string;
    mfaEnabled?: boolean;
    marketingOptIn?: boolean;
  }) => {
    await patchMe(patch);
    if (patch.preferredLang) {
      setLang(patch.preferredLang);
      try {
        window.localStorage.setItem("vicelink_lang", patch.preferredLang);
      } catch {
        // Ignore storage write errors
      }
    }
  };

  const handleCreateTheory = async (payload: {
    title: string;
    tag: string;
    coords: string;
    body: string;
  }) => {
    const res = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data?.message ||
          (lang === "es" ? "No se pudo publicar la teoría." : "Could not publish theory.")
      );
    }
    const created = (data.theory || data) as TheoryPost;
    setTheories((prev) => [created, ...prev]);
  };

  const handleTheoryAction = async (theoryId: string, payload: ForumActionPayload) => {
    const res = await fetch(`/api/forum/${encodeURIComponent(theoryId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data?.message ||
          (res.status === 429
            ? lang === "es"
              ? "Límite de frecuencia alcanzado. Espera unos segundos."
              : "Rate limit reached. Please wait a few seconds."
            : lang === "es"
              ? "No se pudo completar la acción."
              : "Action failed.")
      );
    }
    const updated = (data.theory || data) as TheoryPost;
    setTheories((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleUpdateQuota = (aiQuota: AiQuotaInfo) => {
    setContent((curr) => (curr ? { ...curr, aiQuota } : curr));
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const progress = me?.progress ?? EMPTY_PROGRESS;

  const plannedWorthUsd = useMemo(() => {
    if (!content) return 0;
    const vehCost = progress.plannedVehicles.reduce((sum, id) => {
      const v = content.vehicles.find((x) => x.id === id);
      return sum + (v ? v.price : 0);
    }, 0);
    const propCost = progress.plannedProps.reduce((sum, id) => {
      const p = content.properties.find((x) => x.id === id);
      return sum + (p ? p.price : 0);
    }, 0);
    return vehCost + propCost;
  }, [content, progress.plannedVehicles, progress.plannedProps]);

  const siteSettings: SiteSettingsPayload = content?.siteSettings ?? DEFAULT_SITE_SETTINGS;
  const glitchesAllowed =
    siteSettings.glitchesTabEnabled !== false || me?.profile.isAdmin === true;

  // Redirect away from glitches tab if disabled for non-admins
  useEffect(() => {
    if (!glitchesAllowed && activeView === "glitches") {
      setActiveView("cheats");
    }
  }, [glitchesAllowed, activeView]);

  const isEs = lang === "es";

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <span className="brand-badge">VICELINK // LEONIDA HUB</span>
          <h2 style={{ marginTop: 14, fontSize: 20 }}>
            {isEs ? "Sincronizando tu sesión cifrada..." : "Syncing your encrypted workspace..."}
          </h2>
        </div>
      </div>
    );
  }

  if (loadError || !me || !content) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <span className="brand-badge">VICELINK</span>
          <h2 style={{ marginTop: 14, fontSize: 20 }}>
            {isEs ? "No se pudo cargar tu hub" : "Could Not Load Workspace"}
          </h2>
          <p style={{ color: "var(--text-muted)", margin: "10px 0 18px", fontSize: 13.5 }}>
            {loadError || (isEs ? "Error inesperado al cargar datos." : "Unexpected loading error.")}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button type="button" className="btn-pro" style={{ width: "auto" }} onClick={() => void loadAll()}>
              {isEs ? "Reintentar" : "Retry"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => void handleSignOut()}>
              {isEs ? "Volver al Acceso" : "Back to Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tierBadgeLabel =
    me.profile.tier === "kingpin"
      ? "👑 KINGPIN VIP"
      : me.profile.tier === "street"
        ? "STREET PASS ($1.99)"
        : isEs
          ? "RECLUTA GRATIS"
          : "FREE RECRUIT";

  const tickerText = isEs
    ? siteSettings.globalBanner?.textEs || siteSettings.globalBanner?.textEn || ""
    : siteSettings.globalBanner?.textEn || siteSettings.globalBanner?.textEs || "";

  const showGlobalTicker =
    Boolean(siteSettings.globalBanner?.active) && Boolean(tickerText.trim()) && !tickerDismissed;

  const isUnderMaintenanceForUser =
    siteSettings.maintenanceMode === true && me.profile.isAdmin !== true;

  return (
    <div className="app-layout app-shell">
      {/* Verified Neon Sidebar (Zero Tier Simulator!) */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-top-row">
            <span className="brand-badge">
              {t(lang, "badge", isEs ? "HUB NO OFICIAL DE FANS" : "UNOFFICIAL FAN HUB")}
            </span>
            <div className="lang-switch" title="Select Language / Seleccionar Idioma">
              <button
                type="button"
                className={`lang-btn ${lang === "en" ? "active" : ""}`}
                onClick={() => void handleLanguageChange("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === "es" ? "active" : ""}`}
                onClick={() => void handleLanguageChange("es")}
              >
                ES
              </button>
            </div>
          </div>

          <div className="brand">
            <h1>
              VICE<span>LINK</span>
            </h1>
            <p>
              {t(
                lang,
                "subtitle",
                isEs ? "Guía Táctica de Leonida y Secretos" : "Leonida Tactical Hub & Lore Intel"
              )}
            </p>
          </div>

          {/* Authenticated Account Card */}
          <div className="user-account-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setActiveView("account")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--accent-cyan)",
                  fontSize: 13.5,
                  fontWeight: 800
                }}
              >
                {me.profile.handle}
              </button>
              <span className={`tier-chip tier-${me.profile.tier}`}>{tierBadgeLabel}</span>
            </div>

            {(me.profile.psnVerified || me.profile.xboxVerified || me.profile.mfaEnabled) && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
                {me.profile.psnVerified && (
                  <span className="console-verified-pill">PSN ✓</span>
                )}
                {me.profile.xboxVerified && (
                  <span className="console-verified-pill">XBOX ✓</span>
                )}
                {me.profile.mfaEnabled && (
                  <span className="implemented-badge" style={{ fontSize: 9.5, padding: "2px 6px" }}>
                    🔒 2FA
                  </span>
                )}
              </div>
            )}

            <p
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={me.profile.email}
            >
              {me.profile.email}
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: "6px 8px", fontSize: 11.5 }}
                onClick={() => setActiveView("account")}
              >
                👤 {isEs ? "Cuenta" : "Account"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: "6px 8px", fontSize: 11.5 }}
                onClick={() => void handleSignOut()}
              >
                {isEs ? "Salir" : "Sign Out"}
              </button>
            </div>
          </div>

          <nav className="nav-menu" aria-label="Main navigation">
            <button
              type="button"
              className={`nav-btn ${activeView === "cheats" ? "active" : ""}`}
              onClick={() => setActiveView("cheats")}
            >
              <span className="nav-icon">🎮</span>
              <span>{t(lang, "navCheats", isEs ? "Trucos y Desbloqueos" : "Cheats & Unlocks")}</span>
              <small className="badge-live">{content.cheats.length}</small>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "map" ? "active" : ""}`}
              onClick={() => setActiveView("map")}
            >
              <span className="nav-icon">🗺️</span>
              <span>{t(lang, "navMap", isEs ? "Mapa Táctico de Leonida" : "Leonida Tactical Map")}</span>
              <small className="badge-live">{content.pins.length}</small>
            </button>

            {glitchesAllowed && (
              <button
                type="button"
                className={`nav-btn ${activeView === "glitches" ? "active" : ""}`}
                onClick={() => setActiveView("glitches")}
              >
                <span className="nav-icon">⚡</span>
                <span>{t(lang, "navGlitches", isEs ? "Glitches y Trucos" : "Glitches & Exploits")}</span>
                <small className="badge-new">
                  {siteSettings.glitchesTabEnabled === false ? "OFF" : "v1.002"}
                </small>
              </button>
            )}

            <button
              type="button"
              className={`nav-btn ${activeView === "forum" ? "active" : ""}`}
              onClick={() => setActiveView("forum")}
            >
              <span className="nav-icon">👁️</span>
              <span>{t(lang, "navForum", isEs ? "Easter Eggs y Teorías" : "Easter Eggs & Theories")}</span>
              <small className="badge-live">{theories.length}</small>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "database" ? "active" : ""}`}
              onClick={() => setActiveView("database")}
            >
              <span className="nav-icon">🏎️</span>
              <span>{t(lang, "navDb", isEs ? "Vehículos y Economía" : "Vehicles & Economy")}</span>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "mechanics" ? "active" : ""}`}
              onClick={() => setActiveView("mechanics")}
            >
              <span className="nav-icon">📘</span>
              <span>{t(lang, "navMech", isEs ? "Nuevas Mecánicas" : "New Mechanics Guide")}</span>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "controls" ? "active" : ""}`}
              onClick={() => setActiveView("controls")}
            >
              <span className="nav-icon">🕹️</span>
              <span>{t(lang, "nav.controls", isEs ? "Controles Ocultos" : "Hidden Controls")}</span>
              <small className="badge-live">{content.controls.length}</small>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "radio" ? "active" : ""}`}
              onClick={() => setActiveView("radio")}
            >
              <span className="nav-icon">📻</span>
              <span>{t(lang, "nav.radio", isEs ? "Radio de Leonida" : "Leonida Radio")}</span>
              <small className="badge-live">{content.radioStations.length}</small>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "trophies" ? "active" : ""}`}
              onClick={() => setActiveView("trophies")}
            >
              <span className="nav-icon">🏆</span>
              <span>{t(lang, "nav.trophies", isEs ? "Platino y Trofeos" : "Platinum & Trophies")}</span>
              <small className="badge-live">{content.totalTrophiesCount}</small>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "ai" ? "active" : ""}`}
              onClick={() => setActiveView("ai")}
            >
              <span className="nav-icon">🤖</span>
              <span>{t(lang, "navAi", isEs ? "Guía IA de Misiones" : "AI Mission Guide")}</span>
              <small className="badge-live">LIVE</small>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "feedback" ? "active" : ""}`}
              onClick={() => setActiveView("feedback")}
            >
              <span className="nav-icon">💡</span>
              <span>
                {t(
                  lang,
                  "nav.feedback",
                  isEs ? "Enviar Intel y Feedback" : "Submit Intel & Feedback"
                )}
              </span>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeView === "account" ? "active" : ""}`}
              onClick={() => setActiveView("account")}
            >
              <span className="nav-icon">👤</span>
              <span>
                {t(lang, "nav.account", isEs ? "Cuenta y 2FA" : "Account & 2FA")}
              </span>
              {me.profile.mfaEnabled && <small className="badge-live">2FA</small>}
            </button>

            {me.profile.isAdmin === true && (
              <button
                type="button"
                className={`nav-btn ${activeView === "admin" ? "active" : ""}`}
                onClick={() => setActiveView("admin")}
              >
                <span className="nav-icon">🛡️</span>
                <span>{t(lang, "nav.admin", isEs ? "Panel Admin" : "Admin Panel")}</span>
                <small className="badge-new">ADMIN</small>
              </button>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="pro-card">
            <div className="pro-header">
              <h4>{tierBadgeLabel}</h4>
              <span>$1.99 / $4.99</span>
            </div>
            <p>
              {t(
                lang,
                "proDesc",
                isEs
                  ? "Pago único para Mapa Completo, Glitches, Sin Anuncios y Guía IA."
                  : "One-time unlock for Full Money Map, Glitches Hub, Ad-Free & AI Advisor."
              )}
            </p>
            <button
              type="button"
              className="btn-pro"
              onClick={() => setPricingOpen(true)}
            >
              {t(lang, "proBtn", isEs ? "Ver Pases de Pago Único" : "View One-Time Passes")}
            </button>
          </div>

          <div className="sidebar-compliance-links" style={{ marginTop: 12 }}>
            <Link href="/terms">{isEs ? "Términos" : "Terms"}</Link>
            <span>•</span>
            <Link href="/privacy">{isEs ? "Privacidad" : "Privacy"}</Link>
            <span>•</span>
            <Link href="/refunds">{isEs ? "Reembolsos" : "Refunds"}</Link>
          </div>

          <p className="legal-note">{tField(LEGAL_POLICIES.disclaimer, lang)}</p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content main-panel">
        {/* Live Global Alert Ticker (.global-ticker-bar) */}
        {showGlobalTicker && (
          <div
            className="global-ticker-bar"
            role="region"
            aria-label={isEs ? "Alerta global de ViceLink" : "ViceLink global alert"}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              marginBottom: 14,
              borderRadius: 12,
              background:
                "linear-gradient(90deg, rgba(255, 42, 133, 0.22), rgba(0, 229, 255, 0.16))",
              border: "1px solid rgba(0, 229, 255, 0.5)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span className="badge-new" style={{ flexShrink: 0 }}>
                LIVE
              </span>
              <span style={{ lineHeight: 1.4 }}>{tickerText}</span>
            </div>
            <button
              type="button"
              onClick={() => setTickerDismissed(true)}
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: 14,
                flexShrink: 0
              }}
              aria-label={isEs ? "Ocultar alerta" : "Dismiss alert"}
            >
              ✕
            </button>
          </div>
        )}

        {/* Admin Maintenance Bypass Notice */}
        {siteSettings.maintenanceMode === true && me.profile.isAdmin === true && (
          <div
            className="auth-alert"
            role="status"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 14,
              background: "rgba(245, 158, 11, 0.15)",
              borderColor: "rgba(245, 158, 11, 0.55)",
              color: "#fde047"
            }}
          >
            <span>
              🛡️{" "}
              {isEs
                ? "Modo Mantenimiento ACTIVO para jugadores regulares. Como Admin/Co-Fundador tienes acceso completo."
                : "Maintenance Mode is ACTIVE for non-admin players. As an Admin/Co-Founder, you have full bypass access."}
            </span>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 11.5, padding: "5px 10px" }}
              onClick={() => setActiveView("admin")}
            >
              {isEs ? "Gestionar Flags" : "Manage Flags"}
            </button>
          </div>
        )}

        {/* Stage 11 Neo-Glass HUD Top Bar with ⌘K Command Palette Trigger & @handle Account Pill */}
        <div
          className="top-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 13,
            background: "rgba(13, 19, 34, 0.78)",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="brand-badge">VICELINK // LEONIDA HUD</span>
            {me.profile.psnVerified && <span className="console-verified-pill">PSN ✓</span>}
            {me.profile.xboxVerified && <span className="console-verified-pill">XBOX ✓</span>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="cmdk-trigger-btn btn-secondary"
              onClick={() => setCmdkOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 800,
                borderColor: "rgba(0, 229, 255, 0.45)",
                color: "#e2e8f0"
              }}
            >
              <span>🔎 {isEs ? "Buscar en 8 Bases" : "Search 8 Datasets"}</span>
              <kbd
                style={{
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "#060913",
                  border: "1px solid rgba(0, 229, 255, 0.4)",
                  color: "var(--accent-cyan)",
                  fontSize: 11
                }}
              >
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              className={`btn-secondary ${activeView === "account" ? "active" : ""}`}
              onClick={() => setActiveView("account")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 800,
                borderColor:
                  activeView === "account" ? "var(--accent-cyan)" : "rgba(255, 255, 255, 0.14)",
                color: "var(--accent-cyan)"
              }}
              title={isEs ? "Abrir Cuenta, Consolas y 2FA" : "Open Account, Consoles & 2FA"}
            >
              <span>👤 {me.profile.handle}</span>
              {me.profile.mfaEnabled && (
                <span style={{ color: "#4ade80", fontSize: 10.5 }}>🔒</span>
              )}
            </button>
          </div>
        </div>

        {toast && (
          <div className={`toast-banner toast-${toast.kind}`} role="status">
            <span>{toast.text}</span>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 800 }}
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Non-Admin Maintenance Mode Shield */}
        {isUnderMaintenanceForUser && activeView !== "account" ? (
          <section className="view active">
            <div className="paywall-box" style={{ maxWidth: 560, margin: "32px auto" }}>
              <span className="brand-badge">
                🛡️ {isEs ? "ESCUDO DE MANTENIMIENTO ACTIVO" : "LEONIDA MAINTENANCE SHIELD ACTIVE"}
              </span>
              <h2 style={{ marginTop: 12, fontSize: 22 }}>
                {isEs
                  ? "Actualizando Telemetría y Parches de GTA VI"
                  : "Synchronizing GTA VI Patch Intel & Server Nodes"}
              </h2>
              <p style={{ marginTop: 8, color: "var(--text-muted)", lineHeight: 1.55 }}>
                {isEs
                  ? "Los co-fundadores de ViceLink están desplegando una actualización táctica en vivo. Tu progreso en la nube, pases vitalicios y configuración 2FA siguen 100% protegidos."
                  : "ViceLink Co-Founders are deploying a live tactical database update. Your cloud progress, lifetime passes, and 2FA security settings remain 100% protected."}
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-pro"
                  style={{ width: "auto" }}
                  onClick={() => setActiveView("account")}
                >
                  👤 {isEs ? "Ir a Mi Cuenta y 2FA" : "Open My Account & 2FA"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => void loadAll()}
                >
                  ↻ {isEs ? "Comprobar Estado" : "Check Status"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            {activeView === "cheats" && (
              <CheatsView
                lang={lang}
                tier={me.profile.tier}
                cheats={content.cheats}
                favorites={progress.favorites}
                unlockedCheats={progress.unlockedCheats}
                onToggleFavorite={handleToggleFavorite}
                onToggleUnlocked={handleToggleCheatUnlocked}
              />
            )}

            {activeView === "map" && (
              <MapView
                lang={lang}
                tier={me.profile.tier}
                pins={content.pins}
                foundPins={progress.foundPins}
                initialPinId={deepLinkPinId}
                onTogglePinFound={handleTogglePinFound}
                onOpenPricing={() => setPricingOpen(true)}
                onOpenSocialStudio={() => setSocialOpen(true)}
                onShowToast={showToast}
              />
            )}

            {activeView === "glitches" && glitchesAllowed && (
              <GlitchesView
                lang={lang}
                glitches={content.glitches}
                glitchesLocked={content.glitchesLocked}
                onOpenPricing={() => setPricingOpen(true)}
                onVoteGlitch={handleVoteGlitch}
              />
            )}

            {activeView === "forum" && (
              <ForumView
                lang={lang}
                userHandle={me.profile.handle}
                userTier={me.profile.tier}
                psnVerified={me.profile.psnVerified}
                xboxVerified={me.profile.xboxVerified}
                isAdmin={me.profile.isAdmin}
                theories={theories}
                onUpdateHandle={handleUpdateHandle}
                onCreateTheory={handleCreateTheory}
                onTheoryAction={handleTheoryAction}
                onRefreshForum={loadAll}
              />
            )}

            {activeView === "database" && (
              <DatabaseView
                lang={lang}
                vehicles={content.vehicles}
                vehiclesLocked={content.vehiclesLocked}
                totalVehiclesCount={content.totalVehiclesCount}
                properties={content.properties}
                propertiesLocked={content.propertiesLocked}
                plannedVehicles={progress.plannedVehicles}
                plannedProps={progress.plannedProps}
                onToggleVehicle={handleToggleVehicle}
                onToggleProperty={handleToggleProperty}
                onClearPlan={handleClearPlan}
                onOpenPricing={() => setPricingOpen(true)}
              />
            )}

            {activeView === "mechanics" && (
              <MechanicsView lang={lang} mechanics={content.mechanics} />
            )}

            {activeView === "controls" && (
              <ControlsView lang={lang} controls={content.controls} />
            )}

            {activeView === "radio" && (
              <RadioView lang={lang} stations={content.radioStations} />
            )}

            {activeView === "trophies" && (
              <TrophiesView
                lang={lang}
                trophies={content.trophies}
                trophiesLocked={content.trophiesLocked}
                totalTrophiesCount={content.totalTrophiesCount}
                criminalProfileTiers={content.criminalProfileTiers}
                unlockedTrophies={progress.unlockedTrophies ?? []}
                onToggleTrophy={handleToggleTrophy}
                onOpenPricing={() => setPricingOpen(true)}
              />
            )}

            {activeView === "ai" && (
              <AiAdvisorView
                lang={lang}
                tier={me.profile.tier}
                aiQuota={content.aiQuota}
                onUpdateQuota={handleUpdateQuota}
                onOpenPricing={() => setPricingOpen(true)}
                onOpenSocialStudio={() => setSocialOpen(true)}
              />
            )}

            {activeView === "feedback" && (
              <FeedbackView
                lang={lang}
                userHandle={me.profile.handle}
                userTier={me.profile.tier}
              />
            )}

            {activeView === "account" && (
              <AccountView
                lang={lang}
                profile={me.profile}
                progress={progress}
                payments={me.payments}
                onSaveProfile={handleSaveProfile}
                onProfileUpdated={(updatedProfile: UserProfile) => {
                  setMe((curr) => (curr ? { ...curr, profile: updatedProfile } : curr));
                }}
                onProgressSynced={(foundPins: string[]) => {
                  setMe((curr) =>
                    curr
                      ? {
                          ...curr,
                          progress: {
                            ...curr.progress,
                            foundPins
                          }
                        }
                      : curr
                  );
                }}
                onOpenPricing={() => setPricingOpen(true)}
                onSignOut={handleSignOut}
                onToast={showToast}
              />
            )}

            {activeView === "admin" && me.profile.isAdmin === true && (
              <AdminView
                lang={lang}
                isAdmin={me.profile.isAdmin}
                userEmail={me.profile.email}
                initialAal={me.profile.aal}
                onNavigateToAccount={() => setActiveView("account")}
                onAdminDataChanged={loadAll}
                onSiteSettingsChanged={(nextSettings) => {
                  setContent((curr) => (curr ? { ...curr, siteSettings: nextSettings } : curr));
                  setTickerDismissed(false);
                }}
                onToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Stage 11 Mobile-First Floating Glass Bottom Dock (<768px) */}
      <nav
        className="mobile-bottom-dock"
        aria-label={isEs ? "Navegación rápida móvil" : "Mobile quick navigation"}
      >
        <button
          type="button"
          className={`mobile-dock-btn ${activeView === "cheats" ? "active" : ""}`}
          style={{ minWidth: 52, minHeight: 48 }}
          onClick={() => setActiveView("cheats")}
        >
          <span aria-hidden="true">🎮</span>
          <span>{isEs ? "Trucos" : "Cheats"}</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-btn ${activeView === "map" ? "active" : ""}`}
          style={{ minWidth: 52, minHeight: 48 }}
          onClick={() => setActiveView("map")}
        >
          <span aria-hidden="true">🗺️</span>
          <span>{isEs ? "Mapa" : "Map"}</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-btn ${activeView === "glitches" ? "active" : ""}`}
          style={{
            minWidth: 52,
            minHeight: 48,
            opacity: glitchesAllowed ? 1 : 0.45
          }}
          disabled={!glitchesAllowed}
          onClick={() => {
            if (glitchesAllowed) setActiveView("glitches");
          }}
        >
          <span aria-hidden="true">⚡</span>
          <span>Glitches</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-btn ${activeView === "ai" ? "active" : ""}`}
          style={{ minWidth: 52, minHeight: 48 }}
          onClick={() => setActiveView("ai")}
        >
          <span aria-hidden="true">🤖</span>
          <span>{isEs ? "IA" : "AI"}</span>
        </button>

        <button
          type="button"
          className={`mobile-dock-btn ${activeView === "account" ? "active" : ""}`}
          style={{ minWidth: 52, minHeight: 48 }}
          onClick={() => setActiveView("account")}
        >
          <span aria-hidden="true">👤</span>
          <span>{isEs ? "Cuenta" : "Account"}</span>
        </button>
      </nav>

      {/* Modals */}
      <CommandPaletteModal
        open={cmdkOpen}
        lang={lang}
        content={content}
        glitchesAllowed={glitchesAllowed}
        onClose={() => setCmdkOpen(false)}
        onSelectView={(targetView) => setActiveView(targetView)}
        onToast={showToast}
      />

      <PricingModal
        open={pricingOpen}
        lang={lang}
        currentTier={me.profile.tier}
        cheatsCount={content.cheats.length}
        pinsCount={content.pins.length}
        vehiclesCount={content.totalVehiclesCount}
        onClose={() => setPricingOpen(false)}
        onRefreshData={loadAll}
      />

      <SocialStudioModal
        open={socialOpen}
        lang={lang}
        socialStudioLocked={content.socialStudioLocked}
        userHandle={me.profile.handle}
        userTier={me.profile.tier}
        psnVerified={me.profile.psnVerified}
        xboxVerified={me.profile.xboxVerified}
        psnId={me.profile.psnId}
        xboxGamertag={me.profile.xboxGamertag}
        foundPinsCount={progress.foundPins.length}
        totalPinsCount={content.pins.length}
        plannedWorthUsd={plannedWorthUsd}
        unlockedCheatsCount={progress.unlockedCheats.length}
        totalCheatsCount={content.cheats.length}
        onClose={() => setSocialOpen(false)}
        onOpenPricing={() => setPricingOpen(true)}
      />

      <AccountModal
        open={accountOpen}
        lang={lang}
        profile={me.profile}
        payments={me.payments}
        onClose={() => setAccountOpen(false)}
        onSaveProfile={handleSaveProfile}
        onOpenPricing={() => setPricingOpen(true)}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
