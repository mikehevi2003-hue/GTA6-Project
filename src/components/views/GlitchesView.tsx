"use client";

import { useMemo, useState } from "react";
import type { GlitchCategory, GlitchItem, Language } from "@/types/vicelink";
import { GLITCH_CATEGORIES } from "@/lib/constants/forum";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export interface GlitchesViewProps {
  lang: Language;
  glitches: GlitchItem[];
  glitchesLocked: boolean;
  onOpenPricing: () => void;
  onVoteGlitch: (glitchId: string) => Promise<void>;
}

export default function GlitchesView({
  lang,
  glitches,
  glitchesLocked,
  onOpenPricing,
  onVoteGlitch
}: GlitchesViewProps) {
  const [category, setCategory] = useState<"ALL" | GlitchCategory>("ALL");
  const [votingId, setVotingId] = useState<string | null>(null);
  const isEs = lang === "es";

  const filtered = useMemo(() => {
    if (category === "ALL") return glitches;
    return glitches.filter((g) => g.category === category);
  }, [glitches, category]);

  const handleVote = async (glitchId: string) => {
    setVotingId(glitchId);
    try {
      await onVoteGlitch(glitchId);
    } finally {
      setVotingId(null);
    }
  };

  return (
    <section id="view-glitches" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "glitchTitle",
              isEs
                ? "Técnicas Sandbox y Estado de Parches (Solo Historia • Parche 01.002.001)"
                : "Single-Player Sandbox Techniques & Patch Tracker (Patch 01.002.001)"
            )}
          </h2>
          <p>
            {t(
              lang,
              "glitchSub",
              isEs
                ? "Mecánicas de modo historia, cámara en primera persona y verificación de parches (sin exploits online)."
                : "Verified story-mode mechanics, first-person camera tricks & patch status tracker (never online exploits)."
            )}
          </p>
        </div>

        {!glitchesLocked && (
          <select
            className="btn-secondary"
            value={category}
            onChange={(e) => setCategory(e.target.value as "ALL" | GlitchCategory)}
            aria-label={isEs ? "Categoría de glitch" : "Glitch category"}
          >
            {GLITCH_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {tField(cat.label, lang)}
              </option>
            ))}
          </select>
        )}
      </header>

      {glitchesLocked ? (
        <div className="paywall-box">
          <span className="brand-badge">
            {isEs ? "STREET PASS ($1.99 PAGO ÚNICO)" : "STREET PASS ($1.99 ONE-TIME)"}
          </span>
          <h3>
            ⚡{" "}
            {isEs
              ? "Desbloquea Técnicas Sandbox de Historia y Estado de Parches"
              : "Unlock Story-Mode Sandbox Techniques & Patch Tracker"}
          </h3>
          <p>
            {isEs
              ? "Accede paso a paso a las mecánicas de modo historia, cámara en primera persona, trucos de física y votos en vivo del parche 01.002.001 (sin herramientas online)."
              : "Get step-by-step single-player story mechanics, First-Person camera tricks, physics tips, and live Patch 01.002.001 status tracking (strictly offline story mode)."}
          </p>
          <button
            type="button"
            className="btn-pro"
            style={{ maxWidth: 280, margin: "0 auto" }}
            onClick={onOpenPricing}
          >
            {isEs ? "Desbloquear por $1.99 (Pago Único)" : "Unlock for $1.99 One-Time"}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="paywall-box" style={{ maxWidth: 460 }}>
          <h3>{isEs ? "No hay glitches en esta categoría" : "No Glitches in This Category"}</h3>
          <p>
            {isEs
              ? "Cambia el filtro para ver todos los exploits verificados en el parche actual."
              : "Switch the category filter to view all verified exploits on the current patch."}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCategory("ALL")}
          >
            {isEs ? "Ver Todos los Glitches" : "Show All Glitches"}
          </button>
        </div>
      ) : (
        <div className="forum-feed">
          {filtered.map((g) => {
            const stepsList = g.steps[lang] || g.steps.en;
            const catMeta = GLITCH_CATEGORIES.find((c) => c.value === g.category);
            const catLabel = catMeta ? tField(catMeta.label, lang) : g.category;
            const isPatched = g.isPatched === true;
            const statusText = isPatched
              ? isEs
                ? "PARCHEADO"
                : "PATCHED"
              : tField(g.status, lang);

            return (
              <div
                key={g.id}
                className="cheat-card"
                style={isPatched ? { opacity: 0.86, borderColor: "rgba(244, 63, 94, 0.38)" } : undefined}
              >
                <div className="card-top" style={{ flexWrap: "wrap", gap: 8 }}>
                  <span className={isPatched ? "status-patched" : "status-working"}>
                    ● {statusText} • {catLabel}
                  </span>
                  <button
                    type="button"
                    disabled={votingId === g.id}
                    className={`unlock-toggle-btn ${g.voted ? "done" : ""}`}
                    onClick={() => handleVote(g.id)}
                  >
                    {isPatched
                      ? isEs
                        ? `⚠️ Reportado Parcheado (${g.votes})`
                        : `⚠️ Reported Patched (${g.votes})`
                      : isEs
                        ? `👍 Sigue Funcionando (${g.votes})`
                        : `👍 Still Working (${g.votes})`}
                  </button>
                </div>

                <h3 style={{ marginTop: 8 }}>{tField(g.title, lang)}</h3>

                <ol className="glitch-steps">
                  {stepsList.map((step, idx) => (
                    <li key={`${g.id}-step-${idx}`}>{step}</li>
                  ))}
                </ol>

                <div className="unlock-pill">
                  ⚠️{" "}
                  {isPatched
                    ? isEs
                      ? `Parcheado por Rockstar — ${tField(g.warning, lang)}`
                      : `Patched by Rockstar — ${tField(g.warning, lang)}`
                    : tField(g.warning, lang)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
