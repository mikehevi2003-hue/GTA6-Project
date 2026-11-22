"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AiQuotaInfo,
  ContentPayload,
  Language,
  MePayload,
  TheoryPost,
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
import PricingModal from "@/components/modals/PricingModal";
import SocialStudioModal from "@/components/modals/SocialStudioModal";
import AccountModal from "@/components/modals/AccountModal";

type ActiveView = "cheats" | "map" | "glitches" | "forum" | "database" | "mechanics" | "ai";

const EMPTY_PROGRESS: UserProgress = {
  favorites: [],
  unlockedCheats: [],
  foundPins: [],
  plannedVehicles: [],
  plannedProps: []
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

  const [pricingOpen, setPricingOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [toast, setToast] = useState<{ kind: "success" | "info" | "error"; text: string } | null>(
    null
  );

  const showToast = useCallback((kind: "success" | "info" | "error", text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.text === text ? null : prev));
    }, 5000);
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

  // Handle ?checkout=success / ?checkout=canceled query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;

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

    window.history.replaceState({}, "", "/");
  }, [lang, loadAll, showToast]);

  const patchMe = useCallback(
    async (payload: {
      handle?: string;
      displayName?: string;
      preferredLang?: Language;
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
    handle: string;
    displayName: string;
    preferredLang: Language;
  }) => {
    await patchMe(patch);
    setLang(patch.preferredLang);
    try {
      window.localStorage.setItem("vicelink_lang", patch.preferredLang);
    } catch {
      // Ignore storage write errors
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

  return (
    <div className="app-layout">
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
              <strong style={{ color: "var(--accent-cyan)", fontSize: 13.5 }}>
                {me.profile.handle}
              </strong>
              <span className={`tier-chip tier-${me.profile.tier}`}>{tierBadgeLabel}</span>
            </div>
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
                onClick={() => setAccountOpen(true)}
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

            <button
              type="button"
              className={`nav-btn ${activeView === "glitches" ? "active" : ""}`}
              onClick={() => setActiveView("glitches")}
            >
              <span className="nav-icon">⚡</span>
              <span>{t(lang, "navGlitches", isEs ? "Glitches y Trucos" : "Glitches & Exploits")}</span>
              <small className="badge-new">v1.002</small>
            </button>

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
              className={`nav-btn ${activeView === "ai" ? "active" : ""}`}
              onClick={() => setActiveView("ai")}
            >
              <span className="nav-icon">🤖</span>
              <span>{t(lang, "navAi", isEs ? "Guía IA de Misiones" : "AI Mission Guide")}</span>
              <small className="badge-live">LIVE</small>
            </button>
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
      <main className="main-content">
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
            pins={content.pins}
            foundPins={progress.foundPins}
            onTogglePinFound={handleTogglePinFound}
            onOpenPricing={() => setPricingOpen(true)}
            onOpenSocialStudio={() => setSocialOpen(true)}
          />
        )}

        {activeView === "glitches" && (
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
            theories={theories}
            onUpdateHandle={handleUpdateHandle}
            onCreateTheory={handleCreateTheory}
            onTheoryAction={handleTheoryAction}
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
      </main>

      {/* Modals */}
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
