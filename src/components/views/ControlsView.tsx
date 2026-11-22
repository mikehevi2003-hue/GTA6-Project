"use client";

import { useMemo, useState } from "react";
import type { ControlCategory, HiddenControlItem, Language } from "@/types/vicelink";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export type ControlsViewProps = {
  lang: Language;
  controls: HiddenControlItem[];
};

type PlatformChoice = "PS5" | "XBOX";

const CONTROL_CATEGORIES: Array<{
  value: "ALL" | ControlCategory;
  icon: string;
  label: { en: string; es: string };
}> = [
  {
    value: "ALL",
    icon: "🕹️",
    label: { en: "All Controls", es: "Todos los Controles" }
  },
  {
    value: "On-Foot",
    icon: "🚶",
    label: { en: "On-Foot", es: "A Pie" }
  },
  {
    value: "Combat & Weapons",
    icon: "🔫",
    label: { en: "Combat & Weapons", es: "Combate y Armas" }
  },
  {
    value: "Driving & Cars",
    icon: "🏎️",
    label: { en: "Driving & Cars", es: "Conducción y Autos" }
  },
  {
    value: "Boats & Trailers",
    icon: "🚤",
    label: { en: "Boats & Trailers", es: "Botes y Remolques" }
  },
  {
    value: "Planes & Parachuting",
    icon: "✈️",
    label: { en: "Planes & Parachuting", es: "Aviones y Paracaídas" }
  }
];

function getKeyCapClass(keyLabel: string, platform: PlatformChoice): string {
  const upper = keyLabel.toUpperCase();
  if (upper.includes("D-PAD") || upper.includes("↑") || upper.includes("↓") || upper.includes("←") || upper.includes("→")) {
    return "ctrl-key dpad";
  }
  if (platform === "PS5" && (upper.includes("L1") || upper.includes("R1") || upper.includes("L2") || upper.includes("R2") || upper.includes("L3") || upper.includes("R3"))) {
    return "ctrl-key ps-bumper";
  }
  if (platform === "XBOX" && (upper.includes("LB") || upper.includes("RB") || upper.includes("LT") || upper.includes("RT") || upper.includes("LS") || upper.includes("RS"))) {
    return "ctrl-key xb-bumper";
  }
  return "ctrl-key";
}

export function ControlsView({ lang, controls }: ControlsViewProps) {
  const [platform, setPlatform] = useState<PlatformChoice>("PS5");
  const [category, setCategory] = useState<"ALL" | ControlCategory>("ALL");
  const [search, setSearch] = useState("");

  const isEs = lang === "es";
  const isPS = platform === "PS5";

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: controls.length };
    for (const item of controls) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [controls]);

  const filteredControls = useMemo(() => {
    const q = search.trim().toLowerCase();
    return controls.filter((item) => {
      const matchesCat = category === "ALL" || item.category === category;
      if (!matchesCat) return false;
      if (!q) return true;
      const title = tField(item.title, lang).toLowerCase();
      const ps5Text = tField(item.ps5, lang).toLowerCase();
      const xboxText = tField(item.xbox, lang).toLowerCase();
      const tipText = tField(item.tip, lang).toLowerCase();
      const keysText = [...item.ps5Keys, ...item.xboxKeys].join(" ").toLowerCase();
      return (
        title.includes(q) ||
        ps5Text.includes(q) ||
        xboxText.includes(q) ||
        tipText.includes(q) ||
        keysText.includes(q)
      );
    });
  }, [controls, category, search, lang]);

  return (
    <section id="view-controls" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "controls.title",
              isEs
                ? "30+ Controles Ocultos y Mecánicas Secretas de GTA VI"
                : "30+ Hidden Controls & Secret Mechanics"
            )}
          </h2>
          <p>
            {t(
              lang,
              "controls.sub",
              isEs
                ? "Atajos de mando PS5 y Xbox Series X|S que el juego nunca te explica: conducción automática, luces direccionales, remolque de botes, sigilo y combate táctico."
                : "PS5 & Xbox Series X|S controller shortcuts the game never explains: cinematic auto-drive, turn signals, boat trailer winches, earbuds on foot & tactical grapples."
            )}
          </p>
        </div>

        <div className="platform-toggle" role="tablist" aria-label={isEs ? "Seleccionar plataforma" : "Select platform"}>
          <button
            type="button"
            role="tab"
            aria-selected={isPS}
            className={`plat-btn ${isPS ? "active" : ""}`}
            onClick={() => setPlatform("PS5")}
          >
            PS5 DualSense
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isPS}
            className={`plat-btn ${!isPS ? "active" : ""}`}
            onClick={() => setPlatform("XBOX")}
          >
            Xbox Series X|S
          </button>
        </div>
      </header>

      <div className="controls-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            lang,
            "controls.search",
            isEs
              ? "Buscar controles (ej. conducción automática, direccionales, remolque, audífonos, estrangular)..."
              : "Search controls (e.g., auto-drive, turn signals, boat trailer, earbuds, choke, trunk)..."
          )}
          aria-label={isEs ? "Buscar controles ocultos" : "Search hidden controls"}
        />
        { (search || category !== "ALL") && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearch("");
              setCategory("ALL");
            }}
          >
            {isEs ? "Limpiar Filtros" : "Clear Filters"}
          </button>
        )}
      </div>

      <div className="map-layer-chips genre-chips" role="tablist" aria-label={isEs ? "Categorías de control" : "Control categories"}>
        {CONTROL_CATEGORIES.map((cat) => {
          const active = category === cat.value;
          const count = categoryCounts[cat.value] ?? 0;
          return (
            <button
              key={cat.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`layer-chip ${active ? "active" : ""}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.icon} {tField(cat.label, lang)} ({count})
            </button>
          );
        })}
      </div>

      {filteredControls.length === 0 ? (
        <div className="paywall-box" style={{ maxWidth: 460 }}>
          <h3>{isEs ? "Sin controles coincidentes" : "No Matching Controls"}</h3>
          <p>
            {isEs
              ? "Ajusta tu búsqueda o selecciona otra categoría para explorar todos los comandos ocultos."
              : "Adjust your search or switch categories to explore all hidden controller commands."}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearch("");
              setCategory("ALL");
            }}
          >
            {isEs ? "Ver Todos los Controles" : "Show All Controls"}
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredControls.map((item) => {
            const catMeta = CONTROL_CATEGORIES.find((c) => c.value === item.category);
            const catLabel = catMeta ? `${catMeta.icon} ${tField(catMeta.label, lang)}` : item.category;
            const activeKeys = isPS ? item.ps5Keys : item.xboxKeys;
            const activeInstruction = isPS ? tField(item.ps5, lang) : tField(item.xbox, lang);
            const secondaryInstruction = isPS ? tField(item.xbox, lang) : tField(item.ps5, lang);

            return (
              <article key={item.id} className="cheat-card control-card">
                <div>
                  <div className="card-top">
                    <span className="cat-tag">{catLabel}</span>
                    <span className="tier-chip">
                      {isPS ? "PS5" : "XBOX"}
                    </span>
                  </div>
                  <h3>{tField(item.title, lang)}</h3>
                </div>

                <div className="combo-visual-wrap">
                  <div className="combo-keys-row" aria-label={isPS ? "PS5 Buttons" : "Xbox Buttons"}>
                    {activeKeys.map((keyLabel, idx) => (
                      <span key={`${item.id}-key-${idx}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span className={getKeyCapClass(keyLabel, platform)}>{keyLabel}</span>
                        {idx < activeKeys.length - 1 && <span className="combo-sep">+</span>}
                      </span>
                    ))}
                  </div>

                  <p className="control-instruction-primary">
                    <strong>{isPS ? "PS5:" : "Xbox:"}</strong> {activeInstruction}
                  </p>
                  <p className="control-instruction-alt">
                    <span>{isPS ? "Xbox Series X|S:" : "PS5 DualSense:"}</span> {secondaryInstruction}
                  </p>
                </div>

                <div className="unlock-pill">
                  <strong>💡 {isEs ? "Consejo Táctico:" : "Tactical Tip:"}</strong>{" "}
                  {tField(item.tip, lang)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ControlsView;
