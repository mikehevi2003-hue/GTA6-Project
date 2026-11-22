"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LEGAL_POLICIES } from "@/lib/legal/policies";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";
import {
  KEYWORD_AREAS,
  searchSiteKeywords,
  type KeywordMatch
} from "@/lib/search/keyword-tracker";
import type {
  ContentPayload,
  KeywordArea,
  Language,
  MePayload,
  SiteSettingsPayload,
  TheoryPost
} from "@/types/vicelink";
import type { ActiveView } from "./ViceLinkHub";

export interface SidebarNavigatorProps {
  lang: Language;
  me: MePayload;
  content: ContentPayload;
  theories: TheoryPost[];
  activeView: ActiveView;
  glitchesAllowed: boolean;
  siteSettings: SiteSettingsPayload;
  tierBadgeLabel: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLanguageChange: (nextLang: Language) => void;
  onSelectView: (view: ActiveView) => void;
  onJumpFromKeyword: (view: ActiveView, keyword: string, pinId?: string) => void;
  onOpenPricing: () => void;
  onSignOut: () => void;
}

type NavGroupId = "tactical" | "world" | "account";

type NavItemDef = {
  id: ActiveView;
  icon: string;
  label: string;
  badge?: string;
  badgeType?: "live" | "new";
  hidden?: boolean;
};

export default function SidebarNavigator({
  lang,
  me,
  content,
  theories,
  activeView,
  glitchesAllowed,
  siteSettings,
  tierBadgeLabel,
  collapsed,
  onToggleCollapsed,
  onLanguageChange,
  onSelectView,
  onJumpFromKeyword,
  onOpenPricing,
  onSignOut
}: SidebarNavigatorProps) {
  const isEs = lang === "es";
  const router = useRouter();

  const [openGroups, setOpenGroups] = useState<Record<NavGroupId, boolean>>({
    tactical: true,
    world: true,
    account: true
  });
  const [kwArea, setKwArea] = useState<KeywordArea>("all");
  const [kwQuery, setKwQuery] = useState("");
  const lastTrackedSigRef = useRef<string>("");

  const groups: { id: NavGroupId; title: string; items: NavItemDef[] }[] = useMemo(
    () => [
      {
        id: "tactical",
        title: isEs ? "Táctica y Jugabilidad" : "Tactical & Gameplay",
        items: [
          {
            id: "cheats",
            icon: "🎮",
            label: t(lang, "navCheats", isEs ? "Trucos y Desbloqueos" : "Cheats & Unlocks"),
            badge: String(content.cheats.length),
            badgeType: "live"
          },
          {
            id: "map",
            icon: "🗺️",
            label: t(lang, "navMap", isEs ? "Mapa Táctico de Leonida" : "Leonida Tactical Map"),
            badge: String(content.pins.length),
            badgeType: "live"
          },
          {
            id: "glitches",
            icon: "⚡",
            label: t(lang, "nav.glitches", isEs ? "Técnicas Sandbox" : "Sandbox Techniques"),
            badge: siteSettings.glitchesTabEnabled === false ? "OFF" : "v1.002",
            badgeType: "new",
            hidden: !glitchesAllowed
          },
          {
            id: "controls",
            icon: "🕹️",
            label: t(lang, "nav.controls", isEs ? "Controles Ocultos" : "Hidden Controls"),
            badge: String(content.controls.length),
            badgeType: "live"
          }
        ]
      },
      {
        id: "world",
        title: isEs ? "Mundo y Coleccionables" : "World & Collectibles",
        items: [
          {
            id: "forum",
            icon: "👁️",
            label: t(lang, "navForum", isEs ? "Easter Eggs y Teorías" : "Easter Eggs & Theories"),
            badge: String(theories.length),
            badgeType: "live"
          },
          {
            id: "database",
            icon: "🏎️",
            label: t(lang, "navDb", isEs ? "Vehículos y Economía" : "Vehicles & Economy")
          },
          {
            id: "mechanics",
            icon: "📘",
            label: t(lang, "navMech", isEs ? "Nuevas Mecánicas" : "New Mechanics Guide")
          },
          {
            id: "radio",
            icon: "📻",
            label: t(lang, "nav.radio", isEs ? "Radio de Leonida" : "Leonida Radio"),
            badge: String(content.radioStations.length),
            badgeType: "live"
          },
          {
            id: "trophies",
            icon: "🏆",
            label: t(lang, "nav.trophies", isEs ? "Platino y Trofeos" : "Platinum & Trophies"),
            badge: String(content.totalTrophiesCount),
            badgeType: "live"
          }
        ]
      },
      {
        id: "account",
        title: isEs ? "IA, Comunidad y Seguridad" : "AI, Community & Security",
        items: [
          {
            id: "ai",
            icon: "🤖",
            label: t(lang, "navAi", isEs ? "Guía IA de Misiones" : "AI Mission Guide"),
            badge: "LIVE",
            badgeType: "live"
          },
          {
            id: "feedback",
            icon: "💡",
            label: t(lang, "nav.feedback", isEs ? "Enviar Intel y Feedback" : "Submit Intel & Feedback")
          },
          {
            id: "account",
            icon: "👤",
            label: t(lang, "nav.account", isEs ? "Cuenta y 2FA" : "Account & 2FA"),
            badge: me.profile.mfaEnabled ? "2FA" : undefined,
            badgeType: "live"
          },
          {
            id: "admin",
            icon: "🛡️",
            label: t(lang, "nav.admin", isEs ? "Panel Admin & Patch AI" : "Admin & Patch AI"),
            badge: "ADMIN",
            badgeType: "new",
            hidden: me.profile.isAdmin !== true
          }
        ]
      }
    ],
    [
      lang,
      isEs,
      content.cheats.length,
      content.pins.length,
      content.controls.length,
      content.radioStations.length,
      content.totalTrophiesCount,
      siteSettings.glitchesTabEnabled,
      glitchesAllowed,
      theories.length,
      me.profile.mfaEnabled,
      me.profile.isAdmin
    ]
  );

  const flatSelectableItems = useMemo(
    () => groups.flatMap((g) => g.items.filter((i) => !i.hidden)),
    [groups]
  );

  const keywordSearch = useMemo(
    () =>
      searchSiteKeywords({
        query: kwQuery,
        area: kwArea,
        lang,
        content,
        theories,
        glitchesAllowed,
        limit: 12
      }),
    [kwQuery, kwArea, lang, content, theories, glitchesAllowed]
  );

  // Debounced search telemetry tracking for Admin Keyword Analytics
  useEffect(() => {
    const trimmed = kwQuery.trim();
    if (trimmed.length < 2) return;
    const signature = `${kwArea}:${trimmed.toLowerCase()}:${keywordSearch.results.length}`;
    if (lastTrackedSigRef.current === signature) return;

    const timer = window.setTimeout(() => {
      lastTrackedSigRef.current = signature;
      void fetch("/api/search/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: kwArea,
          keyword: trimmed,
          resultCount:
            kwArea === "all" ? keywordSearch.totalMatches : keywordSearch.results.length,
          lang
        })
      }).catch(() => {});
    }, 750);

    return () => window.clearTimeout(timer);
  }, [kwQuery, kwArea, keywordSearch.totalMatches, keywordSearch.results.length, lang]);

  const handleKeywordMatchClick = (item: KeywordMatch) => {
    if (item.routePath) {
      router.push(item.routePath);
      return;
    }
    if (item.targetView === "legal") return;
    onJumpFromKeyword(item.targetView as ActiveView, kwQuery.trim(), item.deepLinkPinId);
  };

  const toggleGroup = (groupId: NavGroupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div>
        <div className="sidebar-top-row">
          {!collapsed && (
            <span className="brand-badge">
              {t(lang, "badge", isEs ? "HUB NO OFICIAL DE FANS" : "UNOFFICIAL FAN HUB")}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: collapsed ? "auto" : undefined }}>
            {!collapsed && (
              <div className="lang-switch" title="Select Language / Seleccionar Idioma">
                <button
                  type="button"
                  className={`lang-btn ${lang === "en" ? "active" : ""}`}
                  onClick={() => onLanguageChange("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === "es" ? "active" : ""}`}
                  onClick={() => onLanguageChange("es")}
                >
                  ES
                </button>
              </div>
            )}
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapsed}
              title={
                collapsed
                  ? isEs
                    ? "Expandir barra lateral"
                    : "Expand sidebar"
                  : isEs
                    ? "Colapsar barra lateral"
                    : "Collapse sidebar"
              }
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
        </div>

        {!collapsed ? (
          <>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap"
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectView("account")}
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
                  {me.profile.psnVerified && <span className="console-verified-pill">PSN ✓</span>}
                  {me.profile.xboxVerified && <span className="console-verified-pill">XBOX ✓</span>}
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
                  onClick={() => onSelectView("account")}
                >
                  👤 {isEs ? "Cuenta" : "Account"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: "6px 8px", fontSize: 11.5 }}
                  onClick={onSignOut}
                >
                  {isEs ? "Salir" : "Sign Out"}
                </button>
              </div>
            </div>

            {/* Quick Jump Section Dropdown */}
            <div className="sidebar-quick-jump">
              <label htmlFor="sidebarQuickJumpSelect">
                🧭 {isEs ? "MENÚ RÁPIDO DE SECCIONES" : "QUICK DESTINATION MENU"}
              </label>
              <select
                id="sidebarQuickJumpSelect"
                className="sidebar-dropdown"
                value={activeView}
                onChange={(e) => onSelectView(e.target.value as ActiveView)}
              >
                {flatSelectableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.icon} {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Internal Web Keyword Tracker */}
            <div className="keyword-tracker-box" role="search" aria-label="Internal Website Keyword Tracker">
              <div className="keyword-tracker-head">
                <span>🔎 {isEs ? "RASTREADOR INTERNO" : "INTERNAL KEYWORD TRACKER"}</span>
                {kwQuery.trim().length >= 2 && (
                  <small className="badge-live">
                    {kwArea === "all" ? keywordSearch.totalMatches : keywordSearch.results.length}{" "}
                    {isEs ? "hits" : "hits"}
                  </small>
                )}
              </div>

              <select
                aria-label={isEs ? "Filtrar área de búsqueda" : "Filter website search area"}
                className="sidebar-dropdown"
                value={kwArea}
                onChange={(e) => setKwArea(e.target.value as KeywordArea)}
              >
                {KEYWORD_AREAS.map((areaDef) => {
                  const count =
                    areaDef.id === "all"
                      ? keywordSearch.totalMatches
                      : keywordSearch.areaCounts[areaDef.id];
                  return (
                    <option key={areaDef.id} value={areaDef.id}>
                      {areaDef.icon} {areaDef.label[lang]}
                      {kwQuery.trim().length >= 2 ? ` (${count})` : ""}
                    </option>
                  );
                })}
              </select>

              <div className="keyword-input-row">
                <input
                  id="internalKeywordTrackerInput"
                  type="search"
                  value={kwQuery}
                  onChange={(e) => setKwQuery(e.target.value)}
                  placeholder={
                    isEs
                      ? "Buscar truco, mapa, auto, radio..."
                      : "Search cheat, pin, car, trophy..."
                  }
                />
                {kwQuery.length > 0 && (
                  <button
                    type="button"
                    className="keyword-clear-btn"
                    onClick={() => setKwQuery("")}
                    aria-label={isEs ? "Limpiar búsqueda" : "Clear keyword search"}
                  >
                    ✕
                  </button>
                )}
              </div>

              {kwQuery.trim().length >= 2 && (
                <div className="keyword-result-list">
                  {keywordSearch.results.length === 0 ? (
                    <p className="keyword-empty-msg">
                      {isEs
                        ? "Sin coincidencias en esta área. Probá 'Todas las Áreas'."
                        : "No matches in this area. Try All Website Areas."}
                    </p>
                  ) : (
                    keywordSearch.results.slice(0, 7).map((match) => (
                      <button
                        key={match.id}
                        type="button"
                        className="keyword-result-item"
                        onClick={() => handleKeywordMatchClick(match)}
                      >
                        <div className="keyword-result-top">
                          <span>
                            {match.icon} <strong>{match.title}</strong>
                          </span>
                          <small>{match.badge}</small>
                        </div>
                        <p>{match.snippet}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Grouped Accordion Navigation Dropdowns */}
            <nav className="nav-menu" aria-label="Main navigation">
              {groups.map((group) => {
                const visibleItems = group.items.filter((item) => !item.hidden);
                const isOpen = openGroups[group.id];
                const hasActive = visibleItems.some((item) => item.id === activeView);

                return (
                  <div key={group.id} className="sidebar-accordion-group">
                    <button
                      type="button"
                      className={`sidebar-accordion-trigger ${hasActive ? "has-active" : ""}`}
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={isOpen}
                    >
                      <span>{group.title}</span>
                      <span className={`accordion-chevron ${isOpen ? "open" : ""}`}>▾</span>
                    </button>

                    {isOpen && (
                      <div className="sidebar-accordion-items">
                        {visibleItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`nav-btn ${activeView === item.id ? "active" : ""}`}
                            onClick={() => onSelectView(item.id)}
                          >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.badge && (
                              <small className={item.badgeType === "new" ? "badge-new" : "badge-live"}>
                                {item.badge}
                              </small>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </>
        ) : (
          /* Collapsed Icon Rail (Desktop) */
          <nav className="nav-menu nav-menu-compact" aria-label="Compact navigation">
            {flatSelectableItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-btn nav-btn-compact ${activeView === item.id ? "active" : ""}`}
                onClick={() => onSelectView(item.id)}
                title={item.label}
                aria-label={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {!collapsed && (
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
                  ? "Pago único para Mapa Completo, Técnicas Sandbox, Sin Anuncios y Guía IA."
                  : "One-time unlock for Full Money Map, Sandbox Techniques, Platinum Trophies, Ad-Free & AI Advisor."
              )}
            </p>
            <button type="button" className="btn-pro" onClick={onOpenPricing}>
              {t(lang, "proBtn", isEs ? "Ver Pases de Pago Único" : "View One-Time Passes")}
            </button>
          </div>

          <div className="sidebar-compliance-links" style={{ marginTop: 12 }}>
            <Link href="/terms">{isEs ? "Términos" : "Terms"}</Link>
            <span>•</span>
            <Link href="/privacy">{isEs ? "Privacidad" : "Privacy"}</Link>
            <span>•</span>
            <Link href="/refunds">{isEs ? "Reembolsos" : "Refunds"}</Link>
            <span>•</span>
            <Link href="/dmca">DMCA</Link>
          </div>

          <p className="legal-note">{tField(LEGAL_POLICIES.disclaimer, lang)}</p>
        </div>
      )}
    </aside>
  );
}
