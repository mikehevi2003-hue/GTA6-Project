"use client";

import { useMemo, useState } from "react";
import type {
  CriminalProfileTier,
  Language,
  TrophyGrade,
  TrophyItem
} from "@/types/vicelink";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export type TrophiesViewProps = {
  lang: Language;
  trophies: TrophyItem[];
  trophiesLocked: boolean;
  totalTrophiesCount: number;
  criminalProfileTiers: CriminalProfileTier[];
  unlockedTrophies: string[];
  onToggleTrophy: (trophyId: string) => void;
  onOpenPricing: () => void;
};

const GRADE_META: Record<
  TrophyGrade,
  { icon: string; label: { en: string; es: string }; total: number }
> = {
  platinum: { icon: "🏆", label: { en: "Platinum", es: "Platino" }, total: 1 },
  gold: { icon: "🥇", label: { en: "Gold", es: "Oro" }, total: 2 },
  silver: { icon: "🥈", label: { en: "Silver", es: "Plata" }, total: 6 },
  bronze: { icon: "🥉", label: { en: "Bronze", es: "Bronce" }, total: 46 }
};

export function TrophiesView({
  lang,
  trophies,
  trophiesLocked,
  totalTrophiesCount,
  criminalProfileTiers,
  unlockedTrophies,
  onToggleTrophy,
  onOpenPricing
}: TrophiesViewProps) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<"ALL" | TrophyGrade>("ALL");
  const [missableOnly, setMissableOnly] = useState(false);
  const [secretOnly, setSecretOnly] = useState(false);
  const [hideUnlocked, setHideUnlocked] = useState(false);
  const [activeTierId, setActiveTierId] = useState<string>("professional");

  const isEs = lang === "es";
  const totalCount = totalTrophiesCount || trophies.length || 55;
  const unlockedSet = useMemo(() => new Set(unlockedTrophies), [unlockedTrophies]);

  const unlockedCount = useMemo(() => {
    if (trophies.length === 0) return unlockedTrophies.length;
    return trophies.filter((tr) => unlockedSet.has(tr.id)).length;
  }, [trophies, unlockedSet, unlockedTrophies.length]);

  const pct = totalCount > 0 ? Math.min(100, Math.round((unlockedCount / totalCount) * 100)) : 0;
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (pct / 100) * ringCircumference;

  const gradeStats = useMemo(() => {
    const counts: Record<TrophyGrade, { unlocked: number; total: number }> = {
      platinum: { unlocked: 0, total: 1 },
      gold: { unlocked: 0, total: 2 },
      silver: { unlocked: 0, total: 6 },
      bronze: { unlocked: 0, total: 46 }
    };
    if (trophies.length > 0) {
      counts.platinum.total = 0;
      counts.gold.total = 0;
      counts.silver.total = 0;
      counts.bronze.total = 0;
      for (const tr of trophies) {
        counts[tr.grade].total += 1;
        if (unlockedSet.has(tr.id)) {
          counts[tr.grade].unlocked += 1;
        }
      }
    }
    return counts;
  }, [trophies, unlockedSet]);

  const filteredTrophies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trophies.filter((tr) => {
      if (gradeFilter !== "ALL" && tr.grade !== gradeFilter) return false;
      if (missableOnly && !tr.missable) return false;
      if (secretOnly && !tr.secret) return false;
      if (hideUnlocked && unlockedSet.has(tr.id)) return false;
      if (!q) return true;
      const title = tField(tr.title, lang).toLowerCase();
      const desc = tField(tr.desc, lang).toLowerCase();
      const guide = tField(tr.guide, lang).toLowerCase();
      const chapter = (tr.chapter ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q) || guide.includes(q) || chapter.includes(q);
    });
  }, [trophies, gradeFilter, missableOnly, secretOnly, hideUnlocked, unlockedSet, search, lang]);

  return (
    <section id="view-trophies" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "trophies.title",
              isEs
                ? `Guía de Platino y ${totalCount} Trofeos de GTA VI ("Vice Got a Price!")`
                : `GTA VI Platinum Trophy & ${totalCount} Achievements Guide ("Vice Got a Price!")`
            )}
          </h2>
          <p>
            {t(
              lang,
              "trophies.sub",
              isEs
                ? "Lista interactiva de los 55 trofeos (1 Platino, 2 Oro, 6 Plata, 46 Bronce), alertas de trofeos perdibles del Capítulo 1 y guía del Perfil Criminal de 5 niveles."
                : "Interactive checklist for all 55 trophies (1 Platinum, 2 Gold, 6 Silver, 46 Bronze), Chapter 1 missable alerts & the 5-Tier Criminal Profile system."
            )}
          </p>
        </div>
      </header>

      {/* Always-visible Critical Missables Alert Banner */}
      <div className="missables-banner" role="region" aria-label={isEs ? "Alertas críticas de trofeos perdibles" : "Critical Missable Trophy Alerts"}>
        <div className="missables-banner-header">
          <span className="missable-pill">
            ⚠️ {isEs ? "ALERTA DE TROFEOS PERDIBLES Y BLOQUEOS" : "CRITICAL MISSABLE TROPHY & LOCKOUT ALERTS"}
          </span>
          <span style={{ fontSize: 12, color: "#fda4af", fontWeight: 700 }}>
            {isEs
              ? "Lee esto antes de terminar el Capítulo 1 en los Cayos de Leonida"
              : "Read before finishing Chapter 1 in the Leonida Keys"}
          </span>
        </div>

        <div className="missables-grid">
          <div className="missable-alert-item">
            <strong>
              🧘 Positive Mental Attitude ({isEs ? "Bronce Perdible • Capítulo 1" : "Missable Bronze • Chapter 1"})
            </strong>
            <p>
              {isEs
                ? "ANTES de iniciar la misión final del Capítulo 1 ('Tourist Trap'), ve al balcón de la Casa de Jason en Leonida Keys y completa la sesión de meditación. La casa se vuelve inaccesible permanentemente en el Capítulo 2."
                : "BEFORE starting the Chapter 1 finale ('Tourist Trap'), go to the balcony at Jason's House in the Leonida Keys and complete the meditation prompt. The house becomes permanently inaccessible in Chapter 2."}
            </p>
          </div>

          <div className="missable-alert-item">
            <strong>
              💸 Tourist Trap ({isEs ? "Reinicio de Efectivo en Capítulo 1" : "Chapter 1 Cash Wipe Warning"})
            </strong>
            <p>
              {isEs
                ? "Al completar 'Tourist Trap' al final del Capítulo 1, pierdes todo el efectivo en mano. Deposita tus ganancias en la cuenta de ahorros BuckMe Savings en tu teléfono o gástalas en equipo antes de iniciar la misión."
                : "Finishing 'Tourist Trap' at the end of Chapter 1 resets all cash on hand. Deposit your money into BuckMe Savings via your in-game phone or spend it on gear before starting the finale."}
            </p>
          </div>

          <div className="missable-alert-item">
            <strong>
              🚫 {isEs ? "Bloqueo de Trofeos por Trucos" : "Cheat Code Trophy Lockout"}
            </strong>
            <p>
              {isEs
                ? "Activar cualquier código de trucos con L1+R1 / LB+RB desactiva todos los trofeos y el autoguardado en esa sesión. Mantén siempre un archivo de guardado manual limpio para tu ruta hacia 'Vice Got a Price!'."
                : "Entering any L1+R1 / LB+RB cheat code disables all trophies and autosaving for that session. Always keep a clean manual save slot dedicated to your 'Vice Got a Price!' Platinum run."}
            </p>
          </div>
        </div>
      </div>

      {trophiesLocked ? (
        <div className="paywall-box">
          <span className="brand-badge">
            {isEs ? "STREET PASS ($1.99 PAGO ÚNICO)" : "STREET PASS ($1.99 ONE-TIME)"}
          </span>
          <h3>
            🏆{" "}
            {isEs
              ? `Desbloquea el Rastreador de ${totalCount} Trofeos y Guía del Perfil Criminal`
              : `Unlock All ${totalCount} Trophies Checklist & Criminal Profile Guide`}
          </h3>
          <p>
            {isEs
              ? "Obtén la guía paso a paso para cada uno de los 55 trofeos, filtros de trofeos secretos y perdibles, progreso en la nube hacia 'Vice Got a Price!' y el análisis completo de los 5 niveles del Perfil Criminal (Profesional hasta Irredimible)."
              : "Get step-by-step unlock guides for all 55 trophies, secret & missable filters, cloud-synced progress toward 'Vice Got a Price!', and the complete 5-Tier Criminal Profile breakdown (Professional to Irredeemable)."}
          </p>
          <button
            type="button"
            className="btn-pro"
            style={{ maxWidth: 290, margin: "0 auto" }}
            onClick={onOpenPricing}
          >
            {isEs ? "Desbloquear con Street Pass — $1.99" : "Unlock with Street Pass — $1.99"}
          </button>
        </div>
      ) : (
        <>
          {/* Circular Progress Ring + Grade Breakdown Card */}
          <div className="trophy-ring-card">
            <div className="trophy-ring-left">
              <div className="trophy-svg-wrap">
                <svg width="104" height="104" viewBox="0 0 104 104" aria-label={`${pct}% Trophy Progress`}>
                  <circle
                    cx="52"
                    cy="52"
                    r={ringRadius}
                    fill="none"
                    stroke="#131a2e"
                    strokeWidth="9"
                  />
                  <circle
                    cx="52"
                    cy="52"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#viceTrophyGrad)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 52 52)"
                  />
                  <defs>
                    <linearGradient id="viceTrophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00e5ff" />
                      <stop offset="100%" stopColor="#ff2a85" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="trophy-ring-center">
                  <strong>{pct}%</strong>
                  <span>
                    {unlockedCount}/{totalCount}
                  </span>
                </div>
              </div>

              <div className="trophy-ring-info">
                <span className="brand-badge">
                  {isEs ? "OBJETIVO PLATINO" : "PLATINUM TARGET"}
                </span>
                <h3>🏆 Vice Got a Price!</h3>
                <p>
                  {isEs
                    ? `Has desbloqueado ${unlockedCount} de ${totalCount} trofeos en Leonida. Marca cada trofeo abajo para guardar tu progreso en la nube.`
                    : `You have unlocked ${unlockedCount} of ${totalCount} Leonida trophies. Check off each trophy below to sync your progress to the cloud.`}
                </p>
              </div>
            </div>

            <div className="trophy-grade-pills">
              {(["platinum", "gold", "silver", "bronze"] as const).map((g) => {
                const meta = GRADE_META[g];
                const stat = gradeStats[g];
                const active = gradeFilter === g;
                return (
                  <button
                    key={g}
                    type="button"
                    className={`trophy-grade-pill ${g} ${active ? "active" : ""}`}
                    onClick={() => setGradeFilter((prev) => (prev === g ? "ALL" : g))}
                  >
                    <span>
                      {meta.icon} {stat.total} {tField(meta.label, lang)}
                    </span>
                    <small>
                      {stat.unlocked}/{stat.total}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive 5-Tier Criminal Profile Guide */}
          {criminalProfileTiers.length > 0 && (
            <div className="criminal-spectrum">
              <div className="criminal-spectrum-header">
                <div>
                  <h3>
                    ⚖️{" "}
                    {isEs
                      ? "Sistema de Perfil Criminal de 5 Niveles (Profesional → Irredimible)"
                      : "5-Tier Criminal Profile System (Professional → Irredeemable)"}
                  </h3>
                  <p>
                    {isEs
                      ? "Tus decisiones en asaltos y tiroteos mueven tu Perfil Criminal. El nivel 5 ('Irredimible') es PERMANente para el resto de la partida."
                      : "Your combat choices during robberies and police chases shift your Criminal Profile. Tier 5 ('Irredeemable') is PERMANENT for the rest of your playthrough."}
                  </p>
                </div>
              </div>

              <div className="criminal-tier-grid">
                {criminalProfileTiers.map((tierItem) => {
                  const isSelected = activeTierId === tierItem.id;
                  return (
                    <div
                      key={tierItem.id}
                      className={`criminal-tier-card ${tierItem.permanent ? "permanent" : ""} ${isSelected ? "selected" : ""}`}
                      style={{ borderColor: isSelected ? tierItem.badgeColor : undefined }}
                      onClick={() => setActiveTierId(tierItem.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveTierId(tierItem.id);
                        }
                      }}
                    >
                      <div className="card-top" style={{ flexWrap: "wrap", gap: 6 }}>
                        <span
                          className="tier-chip"
                          style={{
                            borderColor: tierItem.badgeColor,
                            color: tierItem.badgeColor
                          }}
                        >
                          {tierItem.icon} {isEs ? `NIVEL ${tierItem.rank}` : `TIER ${tierItem.rank}`}
                        </span>
                        {tierItem.permanent && (
                          <span className="missable-pill">
                            💀 {isEs ? "PERMANENTE" : "PERMANENT"}
                          </span>
                        )}
                      </div>

                      <h4 style={{ color: tierItem.badgeColor, fontSize: 16, marginTop: 6 }}>
                        {tField(tierItem.name, lang)}
                      </h4>

                      <div className="criminal-tier-details">
                        <p>
                          <strong>{isEs ? "Comportamiento:" : "Behavior Trigger:"}</strong>{" "}
                          {tField(tierItem.behavior, lang)}
                        </p>
                        <p>
                          <strong>{isEs ? "Ventaja de Enfoque:" : "Focus Perk:"}</strong>{" "}
                          {tField(tierItem.focusPerk, lang)}
                        </p>
                        <p>
                          <strong>{isEs ? "Respuesta Policial:" : "Police Response:"}</strong>{" "}
                          {tField(tierItem.policeResponse, lang)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trophy Search & Filter Controls */}
          <div className="controls-bar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                lang,
                "trophies.search",
                isEs
                  ? "Buscar trofeos (ej. Positive Mental Attitude, Vice Got a Price, A Long Road, OVNI, WAiNK)..."
                  : "Search trophies (e.g., Positive Mental Attitude, Vice Got a Price, A Long Road, UFO, WAiNK)..."
              )}
              aria-label={isEs ? "Buscar trofeos" : "Search trophies"}
            />

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as "ALL" | TrophyGrade)}
              aria-label={isEs ? "Filtrar por grado de trofeo" : "Filter by trophy grade"}
            >
              <option value="ALL">
                {isEs ? `Todos los Grados (${totalCount})` : `All Grades (${totalCount})`}
              </option>
              <option value="platinum">🏆 {isEs ? "Platino (1)" : "Platinum (1)"}</option>
              <option value="gold">🥇 {isEs ? "Oro (2)" : "Gold (2)"}</option>
              <option value="silver">🥈 {isEs ? "Plata (6)" : "Silver (6)"}</option>
              <option value="bronze">🥉 {isEs ? "Bronce (46)" : "Bronze (46)"}</option>
            </select>

            <button
              type="button"
              className={`btn-secondary ${missableOnly ? "active" : ""}`}
              onClick={() => setMissableOnly((prev) => !prev)}
            >
              ⚠️ {isEs ? "Solo Perdibles" : "Missables Only"}
            </button>

            <button
              type="button"
              className={`btn-secondary ${secretOnly ? "active" : ""}`}
              onClick={() => setSecretOnly((prev) => !prev)}
            >
              🔐 {isEs ? "Solo Secretos" : "Secrets Only"}
            </button>

            <button
              type="button"
              className={`btn-secondary ${hideUnlocked ? "active" : ""}`}
              onClick={() => setHideUnlocked((prev) => !prev)}
            >
              {hideUnlocked
                ? isEs
                  ? "👁️ Mostrar Desbloqueados"
                  : "👁️ Show Unlocked"
                : isEs
                  ? "✓ Ocultar Desbloqueados"
                  : "✓ Hide Unlocked"}
            </button>
          </div>

          {filteredTrophies.length === 0 ? (
            <div className="paywall-box" style={{ maxWidth: 460 }}>
              <h3>{isEs ? "Ningún trofeo coincide con tus filtros" : "No Trophies Match Your Filters"}</h3>
              <p>
                {isEs
                  ? "Limpia la búsqueda o desactiva los filtros para ver los 55 trofeos de GTA VI."
                  : "Clear your search or reset filters to view all 55 GTA VI trophies."}
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearch("");
                  setGradeFilter("ALL");
                  setMissableOnly(false);
                  setSecretOnly(false);
                  setHideUnlocked(false);
                }}
              >
                {isEs ? "Mostrar los 55 Trofeos" : "Show All 55 Trophies"}
              </button>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredTrophies.map((tr) => {
                const isUnlocked = unlockedSet.has(tr.id);
                const gMeta = GRADE_META[tr.grade];

                return (
                  <article
                    key={tr.id}
                    className={`cheat-card trophy-card ${isUnlocked ? "unlocked" : ""}`}
                  >
                    <div>
                      <div className="card-top" style={{ flexWrap: "wrap", gap: 6 }}>
                        <span className={`trophy-grade-pill ${tr.grade}`}>
                          {gMeta.icon} {tField(gMeta.label, lang)}
                        </span>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                          {tr.missable && (
                            <span className="missable-pill">
                              ⚠️ {isEs ? "PERDIBLE" : "MISSABLE"}
                            </span>
                          )}
                          {tr.secret && (
                            <span className="secret-pill">
                              🔐 {isEs ? "SECRETO" : "SECRET"}
                            </span>
                          )}
                          {tr.chapter && (
                            <span className="tier-chip">{tr.chapter}</span>
                          )}
                        </div>
                      </div>

                      <h3 style={{ marginTop: 8 }}>{tField(tr.title, lang)}</h3>
                      <p style={{ marginTop: 4 }}>{tField(tr.desc, lang)}</p>
                    </div>

                    <div className="unlock-card-step">
                      <div>
                        <strong>{isEs ? "Guía de Desbloqueo:" : "Unlock Guide:"}</strong>{" "}
                        {tField(tr.guide, lang)}
                      </div>

                      <div className="unlock-check-row">
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            fontSize: 12,
                            color: isUnlocked ? "#4ade80" : "#94a3b8",
                            cursor: "pointer",
                            fontWeight: 700
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isUnlocked}
                            onChange={() => onToggleTrophy(tr.id)}
                            style={{ accentColor: "#00e5ff", width: 15, height: 15 }}
                          />
                          {isUnlocked
                            ? isEs
                              ? "Trofeo Desbloqueado"
                              : "Trophy Unlocked"
                            : isEs
                              ? "Pendiente"
                              : "Locked"}
                        </label>

                        <button
                          type="button"
                          className={`unlock-toggle-btn ${isUnlocked ? "done" : ""}`}
                          onClick={() => onToggleTrophy(tr.id)}
                        >
                          {isUnlocked
                            ? isEs
                              ? "✓ Desbloqueado"
                              : "✓ Unlocked"
                            : isEs
                              ? "Marcar Trofeo"
                              : "Mark Unlocked"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default TrophiesView;
