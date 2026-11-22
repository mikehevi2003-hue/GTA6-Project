"use client";

import { useMemo, useState } from "react";
import type { CheatCategory, CheatItem, Language, UserTier } from "@/types/vicelink";
import { ARROW_MAP, CHEAT_CATEGORIES } from "@/lib/constants/forum";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

type PlatformTab = "PS5" | "XBOX" | "UNLOCKS";
type StatusFilter = "ALL" | "VERIFIED" | "UNLOCK_ONLY";

export interface CheatsViewProps {
  lang: Language;
  tier: UserTier;
  cheats: CheatItem[];
  favorites: string[];
  unlockedCheats: string[];
  onToggleFavorite: (cheatId: string) => void;
  onToggleUnlocked: (cheatId: string) => void;
}

export default function CheatsView({
  lang,
  tier,
  cheats,
  favorites,
  unlockedCheats,
  onToggleFavorite,
  onToggleUnlocked
}: CheatsViewProps) {
  const [platform, setPlatform] = useState<PlatformTab>("PS5");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"ALL" | CheatCategory>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [favOnly, setFavOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isEs = lang === "es";
  const isPS = platform === "PS5";
  const isUnlockView = platform === "UNLOCKS";

  const filteredCheats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cheats.filter((item) => {
      const title = tField(item.title, lang).toLowerCase();
      const desc = tField(item.desc, lang).toLowerCase();
      const unlock = tField(item.unlock, lang).toLowerCase();
      const matchesSearch = !q || title.includes(q) || desc.includes(q) || unlock.includes(q);
      const matchesCat = category === "ALL" || item.category === category;
      const matchesFav = !favOnly || favorites.includes(item.id);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "VERIFIED" && item.seq.length > 0) ||
        (statusFilter === "UNLOCK_ONLY" && item.seq.length === 0);
      return matchesSearch && matchesCat && matchesFav && matchesStatus;
    });
  }, [cheats, search, category, statusFilter, favOnly, favorites, lang]);

  const handleCopySequence = async (item: CheatItem) => {
    if (item.seq.length === 0) return;
    const prefix = isPS ? "D-Pad Up, Hold L1 + R1:" : "D-Pad Up, Hold LB + RB:";
    const plain = `${prefix} ${item.seq.join(", ")}`;
    try {
      await navigator.clipboard.writeText(plain);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === item.id ? null : prev));
      }, 2000);
    } catch {
      // Clipboard API unavailable in non-secure context
    }
  };

  return (
    <section id="view-cheats" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "cheatsTitle",
              isEs ? "Trucos de GTA VI y Guía para Desbloquearlos" : "GTA VI Cheat Codes & Unlock Checklist"
            )}
          </h2>
          <p>
            {t(
              lang,
              "cheatsSub",
              isEs
                ? "Botones visuales PS5/Xbox + explicación paso a paso de cómo desbloquear cada truco."
                : "Visual PS5/Xbox controller inputs + step-by-step unlock requirements for every cheat."
            )}
          </p>
        </div>

        <div className="platform-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={platform === "PS5"}
            className={`plat-btn ${platform === "PS5" ? "active" : ""}`}
            onClick={() => setPlatform("PS5")}
          >
            PS5
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={platform === "XBOX"}
            className={`plat-btn ${platform === "XBOX" ? "active" : ""}`}
            onClick={() => setPlatform("XBOX")}
          >
            Xbox Series X|S
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={platform === "UNLOCKS"}
            className={`plat-btn ${platform === "UNLOCKS" ? "active" : ""}`}
            onClick={() => setPlatform("UNLOCKS")}
          >
            {t(lang, "unlockTab", isEs ? "🔓 Cómo Desbloquear Todos" : "🔓 How to Unlock All")}
          </button>
        </div>
      </header>

      <div className="controller-guide-banner">
        {isUnlockView ? (
          <>
            <div className="guide-steps">
              <span>
                🔓{" "}
                <strong>{isEs ? "Progreso de Desbloqueo:" : "Cheat Unlock Progress:"}</strong>{" "}
                {unlockedCheats.length} / {cheats.length}
              </span>
            </div>
            <div className="guide-warning">
              💡{" "}
              {isEs
                ? "Paso 1: Completa las 91 misiones. Paso 2: Completa el desafío de cada truco en Pausa > Progreso > Trucos."
                : "Step 1: Beat all 91 story missions. Step 2: Finish each cheat's challenge under Pause > Progress > Cheats."}
            </div>
          </>
        ) : (
          <>
            <div className="guide-steps">
              <span>{isEs ? "Cómo activar:" : "How to activate:"}</span>
              <span className="ctrl-key dpad">↑ D-Pad</span>
              <span className="combo-sep">({isEs ? "Abrir Teléfono" : "Open Phone"})</span>
              <span>+ {isEs ? "Mantener" : "Hold"}</span>
              <span className={`ctrl-key ${isPS ? "ps-bumper" : "xb-bumper"}`}>
                {isPS ? "L1" : "LB"}
              </span>
              <span>+ {isEs ? "Presionar" : "Press"}</span>
              <span className={`ctrl-key ${isPS ? "ps-bumper" : "xb-bumper"}`}>
                {isPS ? "R1" : "RB"}
              </span>
              <span>→ {isEs ? "Ingresar Código" : "Enter Code"}</span>
            </div>
            <div className="guide-warning">
              ⚠️{" "}
              {isEs
                ? "Requiere completar la historia (91 misiones) y desactiva trofeos/guardado."
                : "Requires beating story (91 missions). Disables Trophies/Achievements & Saving."}
            </div>
          </>
        )}
      </div>

      {tier === "free" && (
        <div id="adBannerSlot" className="ad-banner">
          <span>
            {t(
              lang,
              "adSlot",
              isEs
                ? "ESPACIO PATROCINADO (Oculto automáticamente para Street Pass $1.99 y Kingpin VIP $4.99)"
                : "SPONSORED AD SLOT (Hidden automatically for Street Pass $1.99 & Kingpin VIP $4.99)"
            )}
          </span>
        </div>
      )}

      <div className="controls-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            lang,
            "searchCheats",
            isEs
              ? "Buscar trucos o desafíos (ej. $250,000, Campo de Tiro, Gimnasio)..."
              : "Search cheats or challenges (e.g., $250,000, Shooting Range, Workouts)..."
          )}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as "ALL" | CheatCategory)}
          aria-label={isEs ? "Filtrar por categoría" : "Filter by category"}
        >
          {CHEAT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.value === "ALL"
                ? `${tField(cat.label, lang)} (${cheats.length})`
                : tField(cat.label, lang)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label={isEs ? "Filtrar por estado" : "Filter by status"}
        >
          <option value="ALL">
            {t(lang, "statusAll", isEs ? "Todos los Códigos" : "All Codes")}
          </option>
          <option value="VERIFIED">
            {t(lang, "statusVerified", isEs ? "✓ Combinaciones Verificadas" : "✓ Verified Button Combos")}
          </option>
          <option value="UNLOCK_ONLY">
            {t(lang, "statusPending", isEs ? "🔒 Desafío Conocido (Código en Búsqueda)" : "🔒 Challenge Known (Combo Hunting)")}
          </option>
        </select>

        <button
          type="button"
          className={`btn-secondary ${favOnly ? "active" : ""}`}
          onClick={() => setFavOnly((prev) => !prev)}
        >
          {t(lang, "favOnly", isEs ? "★ Favoritos" : "★ Favorites")} ({favorites.length})
        </button>
      </div>

      {filteredCheats.length === 0 ? (
        <div className="paywall-box" style={{ maxWidth: 460 }}>
          <h3>{isEs ? "Sin resultados" : "No Matching Cheats"}</h3>
          <p>
            {isEs
              ? "Ajusta tu búsqueda o desactiva los filtros para ver todos los trucos disponibles."
              : "Adjust your search or clear filters to view all available cheats."}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearch("");
              setCategory("ALL");
              setStatusFilter("ALL");
              setFavOnly(false);
            }}
          >
            {isEs ? "Limpiar Filtros" : "Clear Filters"}
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredCheats.map((item) => {
            const isFav = favorites.includes(item.id);
            const isUnlocked = unlockedCheats.includes(item.id);
            const hasSeq = item.seq.length > 0;
            const catMeta = CHEAT_CATEGORIES.find((c) => c.value === item.category);
            const catLabel = catMeta ? tField(catMeta.label, lang) : item.category;

            if (isUnlockView) {
              return (
                <div key={item.id} className="cheat-card">
                  <div>
                    <div className="card-top">
                      <span className="cat-tag">
                        {catLabel} •{" "}
                        {hasSeq
                          ? isEs
                            ? "Código Verificado"
                            : "Combo Verified"
                          : isEs
                            ? "En Búsqueda"
                            : "Combo Pending"}
                      </span>
                      <button
                        type="button"
                        className={`fav-btn ${isFav ? "saved" : ""}`}
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={isEs ? "Alternar favorito" : "Toggle favorite"}
                      >
                        ★
                      </button>
                    </div>
                    <h3>{tField(item.title, lang)}</h3>
                    <p style={{ marginBottom: 8 }}>
                      <strong>{isEs ? "Requisito:" : "Requirement:"}</strong>{" "}
                      {tField(item.unlock, lang)}
                    </p>
                  </div>

                  <div className="unlock-card-step">
                    <strong>{isEs ? "Cómo lograrlo:" : "How to do it:"}</strong>{" "}
                    {tField(item.howToUnlock, lang)}
                    <div className="unlock-check-row">
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {isEs ? "Tu progreso:" : "Track progress:"}
                      </span>
                      <button
                        type="button"
                        className={`unlock-toggle-btn ${isUnlocked ? "done" : ""}`}
                        onClick={() => onToggleUnlocked(item.id)}
                      >
                        {isUnlocked
                          ? isEs
                            ? "✓ Desafío Completado"
                            : "✓ Challenge Completed"
                          : isEs
                            ? "Marcar Completado"
                            : "Mark Challenge Done"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="cheat-card">
                <div>
                  <div className="card-top">
                    <span className="cat-tag">{catLabel}</span>
                    <button
                      type="button"
                      className={`fav-btn ${isFav ? "saved" : ""}`}
                      onClick={() => onToggleFavorite(item.id)}
                      aria-label={isEs ? "Alternar favorito" : "Toggle favorite"}
                    >
                      ★
                    </button>
                  </div>
                  <h3>{tField(item.title, lang)}</h3>
                  <p>{tField(item.desc, lang)}</p>
                </div>

                <div className="combo-visual-wrap">
                  <div className="combo-keys-row">
                    {hasSeq ? (
                      <>
                        <span className="ctrl-key dpad">↑</span>
                        <span className={`ctrl-key ${isPS ? "ps-bumper" : "xb-bumper"}`}>
                          {isPS ? "L1+R1" : "LB+RB"}
                        </span>
                        <span className="combo-sep">›</span>
                        {item.seq.map((dir, i) => (
                          <span key={`${item.id}-${i}`} className="ctrl-key dpad">
                            {ARROW_MAP[dir]}
                          </span>
                        ))}
                      </>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        🔒{" "}
                        {isEs
                          ? "Secuencia en investigación — abre 'Cómo Desbloquear Todos' para completar el desafío."
                          : "Button combo still being cracked — open 'How to Unlock All' to complete the challenge!"}
                      </span>
                    )}
                  </div>

                  <div className="unlock-pill">
                    <strong>{isEs ? "Desbloqueo:" : "How to Unlock:"}</strong>{" "}
                    {tField(item.howToUnlock, lang)}
                  </div>

                  {hasSeq && (
                    <button
                      type="button"
                      className="copy-combo-btn"
                      onClick={() => handleCopySequence(item)}
                    >
                      {copiedId === item.id
                        ? isEs
                          ? "✓ ¡Secuencia Copiada!"
                          : "✓ Sequence Copied!"
                        : isEs
                          ? "📋 Copiar Botones"
                          : "📋 Copy Button Sequence"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
