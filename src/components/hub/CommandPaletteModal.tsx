"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { ContentPayload, Language } from "@/types/vicelink";
import { ARROW_MAP } from "@/lib/constants/forum";
import { tField } from "@/lib/i18n/helpers";

export type CommandTargetView =
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

export type CommandCategory =
  | "all"
  | "cheats"
  | "map"
  | "glitches"
  | "controls"
  | "vehicles"
  | "radio"
  | "trophies"
  | "mechanics";

export interface CommandPaletteItem {
  id: string;
  category: Exclude<CommandCategory, "all">;
  badge: string;
  icon: string;
  title: string;
  subtitle: string;
  targetView: CommandTargetView;
  copyText?: string;
  copyLabel?: string;
  searchBlob: string;
}

export interface CommandPaletteModalProps {
  open: boolean;
  lang: Language;
  content: ContentPayload;
  glitchesAllowed: boolean;
  onClose: () => void;
  onSelectView: (view: CommandTargetView) => void;
  onToast?: (kind: "success" | "info" | "error", text: string) => void;
}

const FENCE_ENTRIES = [
  {
    id: "fence-brian",
    name: "Brian (South Key Lento)",
    en: "Ch. 1: Lab Fees • Early Narcotics & Cash • Keypad: 7700",
    es: "Cap. 1: Lab Fees • Narcóticos y Efectivo Inicial • Código puerta: 7700",
    copy: "Brian Fence (South Key Lento) — Keypad: 7700"
  },
  {
    id: "fence-donnie",
    name: "Donnie (South Key Lento)",
    en: "Ch. 1: Clean Up After Donnie • Early Drop-Box Goods (Closes after Swamped)",
    es: "Cap. 1: Clean Up After Donnie • Mercancía Inicial (Cierra tras Swamped)",
    copy: "Donnie Fence (South Key Lento) — Ch. 1 Drop-Box"
  },
  {
    id: "fence-moses",
    name: 'Moses "Mo" Watkins (Port Gellhorn)',
    en: "Ch. 2: Moses • Stolen Cars (No Trackers) • Registers or buys clean cars ($1,000+)",
    es: "Cap. 2: Moses • Autos Robados (Sin Rastreador) • Registra o compra autos ($1,000+)",
    copy: 'Moses "Mo" Watkins (Port Gellhorn) — Stolen Car Fence'
  },
  {
    id: "fence-dunk",
    name: "Dunk (South Port Gellhorn)",
    en: "Ch. 2: Slam Dunk • Ch. 2 Narcotics & Stash Bags • Drop box in car trunk",
    es: "Cap. 2: Slam Dunk • Narcóticos y Bolsas Cap. 2 • Maletero de su auto",
    copy: "Dunk Fence (South Port Gellhorn) — Car Trunk Drop-Box"
  },
  {
    id: "fence-tyrone",
    name: "Tyrone (La Perle, Vice City)",
    en: "Ch. 3 Progression • HIGHEST Payout for Narcotics & Red Barn Cocaine Bags",
    es: "Progreso Cap. 3 • PAGO MÁXIMO por Narcóticos y Bolsas del Granero Rojo",
    copy: "Tyrone Fence (La Perle, Vice City) — Highest Narcotics Payout"
  },
  {
    id: "fence-yasmani",
    name: "Yasmani (Little Cuba, Vice City)",
    en: "Ch. 3: Boobie Time • HIGHEST Payout for Jewelry & Marked Bills + Bank Vault Tips",
    es: "Cap. 3: Boobie Time • PAGO MÁXIMO por Joyas y Billetes + Pistas de Bóvedas",
    copy: "Yasmani Fence (Little Cuba, Vice City) — Highest Jewelry & Marked Bills Payout"
  },
  {
    id: "fence-randy",
    name: "Randy (Balsero, Vice City)",
    en: "Ch. 3+ Progression • High-End Exotic Cars • Pays premium bonuses for Wish-List supercars",
    es: "Progreso Cap. 3+ • Superautos Exóticos • Bonificaciones altas por autos de su lista",
    copy: "Randy Fence (Balsero, Vice City) — Exotic Supercar Fence"
  }
];

export function CommandPaletteModal({
  open,
  lang,
  content,
  glitchesAllowed,
  onClose,
  onSelectView,
  onToast
}: CommandPaletteModalProps) {
  const isEs = lang === "es";
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CommandCategory>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveCategory("all");
    setActiveIndex(0);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Pre-index all 8 datasets for <50ms instant search
  const allItems = useMemo<CommandPaletteItem[]>(() => {
    const items: CommandPaletteItem[] = [];

    // 1. Cheats
    for (const c of content.cheats) {
      const comboStr = c.seq.length > 0 ? c.seq.map((k) => ARROW_MAP[k]).join(" ") : "";
      const title = tField(c.title, lang);
      const unlock = tField(c.unlock, lang);
      const desc = tField(c.desc, lang);
      items.push({
        id: `cheat-${c.id}`,
        category: "cheats",
        badge: isEs ? "TRUCO" : "CHEAT",
        icon: "🎮",
        title,
        subtitle: `${c.category} • ${
          comboStr
            ? `${isEs ? "Combo" : "Combo"}: ${comboStr}`
            : `${isEs ? "Desafío" : "Challenge"}: ${unlock}`
        } — ${desc}`,
        targetView: "cheats",
        copyText: comboStr || unlock,
        copyLabel: comboStr
          ? isEs
            ? `Combo copiado: ${comboStr}`
            : `Copied D-Pad combo: ${comboStr}`
          : isEs
            ? `Desafío copiado: ${title}`
            : `Copied challenge: ${title}`,
        searchBlob: `${c.title.en} ${c.title.es} ${c.category} ${c.unlock.en} ${c.unlock.es} ${c.desc.en} ${c.desc.es} ${comboStr}`.toLowerCase()
      });
    }

    // 2. Map Pins & Fences
    for (const p of content.pins) {
      const title = tField(p.name, lang);
      const note = tField(p.note, lang);
      const coordStr = `X: ${p.x}%, Y: ${p.y}%`;
      items.push({
        id: `pin-${p.id}`,
        category: "map",
        badge: p.type.toUpperCase(),
        icon: p.icon || "📍",
        title,
        subtitle: `${p.region} • (${coordStr}) — ${note}`,
        targetView: "map",
        copyText: `${title} (${p.region} — ${coordStr})`,
        copyLabel: isEs
          ? `Coordenadas copiadas: ${title} (${coordStr})`
          : `Copied coordinates: ${title} (${coordStr})`,
        searchBlob: `${p.name.en} ${p.name.es} ${p.region} ${p.type} ${p.note.en} ${p.note.es} ${coordStr}`.toLowerCase()
      });
    }

    for (const f of FENCE_ENTRIES) {
      items.push({
        id: f.id,
        category: "map",
        badge: "FENCE",
        icon: "🤝",
        title: f.name,
        subtitle: isEs ? f.es : f.en,
        targetView: "map",
        copyText: f.copy,
        copyLabel: isEs ? `Fence copiado: ${f.name}` : `Copied Fence intel: ${f.name}`,
        searchBlob: `${f.name} ${f.en} ${f.es} fence buyer loot`.toLowerCase()
      });
    }

    // 3. Glitches
    if (glitchesAllowed) {
      for (const g of content.glitches) {
        const title = tField(g.title, lang);
        const status = g.isPatched
          ? isEs
            ? "PARCHEADO"
            : "PATCHED"
          : tField(g.status, lang);
        const warning = tField(g.warning, lang);
        items.push({
          id: `glitch-${g.id}`,
          category: "glitches",
          badge: g.isPatched ? "PATCHED" : "GLITCH",
          icon: "⚡",
          title,
          subtitle: `${g.category} • ${status}${warning ? ` — ${warning}` : ""}`,
          targetView: "glitches",
          copyText: `${title} (${status})`,
          copyLabel: isEs ? `Glitch seleccionado: ${title}` : `Opened glitch: ${title}`,
          searchBlob: `${g.title.en} ${g.title.es} ${g.category} ${g.status.en} ${g.status.es} ${g.warning.en} ${g.warning.es}`.toLowerCase()
        });
      }
    }

    // 4. Hidden Controls
    for (const ctrl of content.controls) {
      const title = tField(ctrl.title, lang);
      const tip = tField(ctrl.tip, lang);
      const ps5Combo = ctrl.ps5Keys.join(" + ");
      const xboxCombo = ctrl.xboxKeys.join(" + ");
      items.push({
        id: `ctrl-${ctrl.id}`,
        category: "controls",
        badge: ctrl.category.toUpperCase(),
        icon: "🕹️",
        title,
        subtitle: `PS5: ${ps5Combo} • Xbox: ${xboxCombo} — ${tip}`,
        targetView: "controls",
        copyText: `${title} — PS5: ${ps5Combo} | Xbox: ${xboxCombo}`,
        copyLabel: isEs
          ? `Control copiado: ${ps5Combo} / ${xboxCombo}`
          : `Copied control combo: ${ps5Combo} / ${xboxCombo}`,
        searchBlob: `${ctrl.title.en} ${ctrl.title.es} ${ctrl.category} ${ctrl.ps5.en} ${ctrl.ps5.es} ${ctrl.xbox.en} ${ctrl.xbox.es} ${ctrl.tip.en} ${ctrl.tip.es} ${ps5Combo} ${xboxCombo}`.toLowerCase()
      });
    }

    // 5. Vehicles
    for (const v of content.vehicles) {
      const note = tField(v.note, lang);
      items.push({
        id: `veh-${v.id}`,
        category: "vehicles",
        badge: v.class.toUpperCase(),
        icon: "🏎️",
        title: v.name,
        subtitle: `$${v.price.toLocaleString()} • ${v.topSpeed} MPH — ${note}`,
        targetView: "database",
        copyText: `${v.name} (${v.class}) — $${v.price.toLocaleString()} • ${v.topSpeed} MPH`,
        copyLabel: isEs ? `Vehículo: ${v.name}` : `Vehicle selected: ${v.name}`,
        searchBlob: `${v.name} ${v.class} ${v.price} ${v.topSpeed} ${v.note.en} ${v.note.es}`.toLowerCase()
      });
    }

    // 6. Radio Stations & Tracks
    for (const st of content.radioStations) {
      const vibe = tField(st.vibe, lang);
      items.push({
        id: `radio-st-${st.id}`,
        category: "radio",
        badge: st.genre.toUpperCase(),
        icon: "📻",
        title: st.name,
        subtitle: `DJ: ${st.hosts} • ${st.tracks.length} ${isEs ? "temas" : "tracks"} — ${vibe}`,
        targetView: "radio",
        copyText: `${st.name} (${st.genre}) — DJ: ${st.hosts}`,
        copyLabel: isEs ? `Emisora: ${st.name}` : `Radio station: ${st.name}`,
        searchBlob: `${st.name} ${st.genre} ${st.hosts} ${st.vibe.en} ${st.vibe.es}`.toLowerCase()
      });

      for (const tr of st.tracks) {
        items.push({
          id: `radio-tr-${st.id}-${tr.id}`,
          category: "radio",
          badge: st.name.toUpperCase(),
          icon: "🎵",
          title: `${tr.title} — ${tr.artist}`,
          subtitle: `${st.name} (${st.genre})${tr.year ? ` • ${tr.year}` : ""}`,
          targetView: "radio",
          copyText: `${tr.title} — ${tr.artist} (${st.name})`,
          copyLabel: isEs
            ? `Canción copiada: ${tr.title} — ${tr.artist}`
            : `Copied track: ${tr.title} — ${tr.artist}`,
          searchBlob: `${tr.title} ${tr.artist} ${tr.year || ""} ${st.name} ${st.genre} ${st.hosts}`.toLowerCase()
        });
      }
    }

    // 7. Trophies
    for (const tr of content.trophies) {
      const title = tField(tr.title, lang);
      const desc = tField(tr.desc, lang);
      const guide = tField(tr.guide, lang);
      items.push({
        id: `trophy-${tr.id}`,
        category: "trophies",
        badge: tr.grade.toUpperCase(),
        icon: "🏆",
        title,
        subtitle: `${tr.missable ? (isEs ? "⚠️ PERDIBLE • " : "⚠️ MISSABLE • ") : ""}${
          tr.secret ? (isEs ? "🕵️ SECRETO • " : "🕵️ SECRET • ") : ""
        }${desc}`,
        targetView: "trophies",
        copyText: `${title}: ${guide}`,
        copyLabel: isEs ? `Trofeo abierto: ${title}` : `Opened trophy guide: ${title}`,
        searchBlob: `${tr.title.en} ${tr.title.es} ${tr.desc.en} ${tr.desc.es} ${tr.guide.en} ${tr.guide.es} ${tr.grade} ${tr.missable ? "missable perdible" : ""} ${tr.secret ? "secret secreto" : ""}`.toLowerCase()
      });
    }

    // 8. Mechanics
    for (const m of content.mechanics) {
      const title = tField(m.title, lang);
      const tag = tField(m.tag, lang);
      const desc = tField(m.desc, lang);
      items.push({
        id: `mech-${m.id}`,
        category: "mechanics",
        badge: tag.toUpperCase(),
        icon: "📘",
        title,
        subtitle: desc,
        targetView: "mechanics",
        copyText: `${title}: ${desc}`,
        copyLabel: isEs ? `Mecánica abierta: ${title}` : `Opened mechanic guide: ${title}`,
        searchBlob: `${m.title.en} ${m.title.es} ${m.tag.en} ${m.tag.es} ${m.desc.en} ${m.desc.es}`.toLowerCase()
      });
    }

    return items;
  }, [content, glitchesAllowed, isEs, lang]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    const results: CommandPaletteItem[] = [];

    for (const item of allItems) {
      if (activeCategory !== "all" && item.category !== activeCategory) continue;
      if (tokens.length > 0) {
        let matchedAll = true;
        for (const tok of tokens) {
          if (!item.searchBlob.includes(tok)) {
            matchedAll = false;
            break;
          }
        }
        if (!matchedAll) continue;
      }
      results.push(item);
      if (results.length >= 45) break;
    }

    return results;
  }, [allItems, activeCategory, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeCategory]);

  const handleSelectItem = async (item: CommandPaletteItem) => {
    if (item.copyText) {
      try {
        await navigator.clipboard.writeText(item.copyText);
      } catch {
        // Ignore clipboard errors in non-HTTPS / headless contexts
      }
    }
    onSelectView(item.targetView);
    if (onToast && item.copyLabel) {
      onToast("info", `⌘K • ${item.copyLabel}`);
    }
    onClose();
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredItems.length);
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredItems[activeIndex];
      if (target) {
        void handleSelectItem(target);
      }
    }
  };

  if (!open) return null;

  const categories: { id: CommandCategory; labelEn: string; labelEs: string }[] = [
    { id: "all", labelEn: `All (${allItems.length})`, labelEs: `Todo (${allItems.length})` },
    { id: "cheats", labelEn: "🎮 Cheats", labelEs: "🎮 Trucos" },
    { id: "map", labelEn: "🗺️ Map & Fences", labelEs: "🗺️ Mapa y Fences" },
    ...(glitchesAllowed
      ? ([{ id: "glitches", labelEn: "⚡ Glitches", labelEs: "⚡ Glitches" }] as const)
      : []),
    { id: "controls", labelEn: "🕹️ Controls", labelEs: "🕹️ Controles" },
    { id: "vehicles", labelEn: "🏎️ Vehicles", labelEs: "🏎️ Vehículos" },
    { id: "radio", labelEn: "📻 Radio & Tracks", labelEs: "📻 Radio y Temas" },
    { id: "trophies", labelEn: "🏆 Trophies", labelEs: "🏆 Trofeos" },
    { id: "mechanics", labelEn: "📘 Mechanics", labelEs: "📘 Mecánicas" }
  ];

  return (
    <div
      className="modal cmdk-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={isEs ? "Paleta de Comandos Global ViceLink" : "ViceLink Global Command Palette"}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ zIndex: 90 }}
    >
      <div
        className="modal-content cmdk-modal"
        style={{
          maxWidth: 740,
          width: "100%",
          padding: 18,
          background: "rgba(11, 16, 30, 0.96)",
          border: "1px solid rgba(0, 229, 255, 0.42)",
          borderRadius: 16,
          boxShadow: "0 28px 70px rgba(0, 0, 0, 0.85)"
        }}
      >
        <div
          className="cmdk-input-wrap"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#060913",
            border: "1px solid rgba(0, 229, 255, 0.45)",
            borderRadius: 12,
            padding: "10px 14px"
          }}
        >
          <span style={{ fontSize: 16, color: "var(--accent-cyan)", fontWeight: 900 }}>⌘K</span>
          <input
            ref={inputRef}
            type="text"
            className="cmdk-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isEs
                ? "Buscar en 8 bases de datos: trucos, pines, fences (7700), glitches, controles, autos, canciones, trofeos..."
                : "Search across all 8 datasets: cheats, pins, fences (7700), glitches, controls, cars, radio tracks, trophies..."
            }
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: 14,
              outline: "none",
              minWidth: 0
            }}
          />
          {query && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: "4px 8px", fontSize: 11 }}
              onClick={() => setQuery("")}
            >
              {isEs ? "Limpiar" : "Clear"}
            </button>
          )}
          <button
            type="button"
            className="modal-close-pill"
            onClick={onClose}
            style={{ padding: "5px 10px", fontSize: 11.5 }}
          >
            ESC
          </button>
        </div>

        {/* Category Filter Pills */}
        <div
          className="cmdk-cats map-layer-chips"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 12,
            marginBottom: 12
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`layer-chip ${activeCategory === cat.id ? "active" : ""}`}
              style={{ fontSize: 11.5, padding: "5px 10px" }}
              onClick={() => setActiveCategory(cat.id)}
            >
              {isEs ? cat.labelEs : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Instant Results List */}
        <div
          className="cmdk-results"
          role="listbox"
          aria-label={isEs ? "Resultados de búsqueda instantánea" : "Instant command results"}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: 380,
            overflowY: "auto",
            paddingRight: 2
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: "28px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13
              }}
            >
              {isEs
                ? `Sin coincidencias para "${query}". Prueba con "ATM", "7700", "Burna Boy", "Eclipse" o "Platino".`
                : `No matches found for "${query}". Try "ATM", "7700", "Burna Boy", "Eclipse", or "Platinum".`}
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`cmdk-item ${isActive ? "active" : ""}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => void handleSelectItem(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: isActive
                      ? "linear-gradient(90deg, rgba(0, 229, 255, 0.16), rgba(255, 42, 133, 0.12))"
                      : "rgba(9, 14, 26, 0.85)",
                    border: isActive
                      ? "1px solid rgba(0, 229, 255, 0.6)"
                      : "1px solid rgba(255, 255, 255, 0.07)",
                    color: "#f8fafc"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 13.5, color: "#ffffff" }}>{item.title}</strong>
                        <span className="cat-tag" style={{ fontSize: 9.5, padding: "2px 6px" }}>
                          {item.badge}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#94a3b8",
                          marginTop: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}
                  >
                    {isEs ? "Ir ↵" : "Jump ↵"}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Keyboard Shortcut Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: 11,
            color: "var(--text-muted)"
          }}
        >
          <span>
            <kbd style={{ padding: "2px 6px", background: "#060913", borderRadius: 4, border: "1px solid #1e2945" }}>↑</kbd>{" "}
            <kbd style={{ padding: "2px 6px", background: "#060913", borderRadius: 4, border: "1px solid #1e2945" }}>↓</kbd>{" "}
            {isEs ? "Navegar" : "Navigate"} •{" "}
            <kbd style={{ padding: "2px 6px", background: "#060913", borderRadius: 4, border: "1px solid #1e2945" }}>↵</kbd>{" "}
            {isEs ? "Abrir y Copiar" : "Open & Copy"} •{" "}
            <kbd style={{ padding: "2px 6px", background: "#060913", borderRadius: 4, border: "1px solid #1e2945" }}>ESC</kbd>{" "}
            {isEs ? "Cerrar" : "Close"}
          </span>
          <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
            ⚡ {isEs ? "8 Bases de Datos Indexadas (<50ms)" : "8 Datasets Indexed (<50ms)"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPaletteModal;
