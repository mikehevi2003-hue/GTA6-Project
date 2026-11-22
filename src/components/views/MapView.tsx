"use client";

import React, { useMemo, useRef, useState } from "react";
import type { Language, LocalizedText, MapPin, PinType } from "@/types/vicelink";
import { FenceTable } from "./FenceTable";

export type MapViewProps = {
  lang: Language;
  pins: MapPin[];
  foundPins: string[];
  onTogglePinFound: (pinId: string) => void;
  onOpenPricing: () => void;
  onOpenSocialStudio: () => void;
};

type LayerFilter = "ALL" | PinType;

const MAP_REGIONS: { value: string; label: string }[] = [
  { value: "Vice City", label: "Vice City" },
  { value: "Leonida Keys", label: "Leonida Keys" },
  { value: "Grassrivers", label: "Grassrivers" },
  { value: "Port Gellhorn", label: "Port Gellhorn" },
  { value: "Ambrosia", label: "Ambrosia" },
  { value: "Mount Kalaga", label: "Mount Kalaga National Park" }
];

function resolveLocalized(val: LocalizedText | string | undefined | null, lang: Language): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] || val.en || "";
}

function cleanPinName(rawName: string, icon: string): string {
  let cleaned = rawName.trim();
  if (icon && cleaned.startsWith(icon)) {
    cleaned = cleaned.slice(icon.length).trim();
  }
  cleaned = cleaned.replace(/^[\p{Extended_Pictographic}\uFE0F]+\s+/u, "");
  return cleaned;
}

function clampPan(x: number, y: number, zoom: number): { x: number; y: number } {
  if (zoom <= 1) return { x: 0, y: 0 };
  const maxX = Math.round((zoom - 1) * 260);
  const maxY = Math.round((zoom - 1) * 200);
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y))
  };
}

export function MapView({
  lang,
  pins,
  foundPins,
  onTogglePinFound,
  onOpenPricing,
  onOpenSocialStudio
}: MapViewProps) {
  const isEs = lang === "es";

  const [activeLayer, setActiveLayer] = useState<LayerFilter>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [hideFound, setHideFound] = useState<boolean>(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragOriginRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
  } | null>(null);

  const layerCounts = useMemo(() => {
    const counts: Record<LayerFilter, number> = {
      ALL: pins.length,
      Money: 0,
      ATM: 0,
      RareCar: 0,
      Fence: 0,
      EasterEgg: 0,
      Collectible: 0
    };
    for (const p of pins) {
      if (p.type in counts) {
        counts[p.type] += 1;
      }
    }
    return counts;
  }, [pins]);

  const layerChips: { id: LayerFilter; label: string }[] = [
    {
      id: "ALL",
      label: isEs ? `🗺️ Todo (${layerCounts.ALL})` : `🗺️ All (${layerCounts.ALL})`
    },
    {
      id: "Money",
      label: isEs
        ? `💰 Dinero Fácil (${layerCounts.Money})`
        : `💰 Easy Money (${layerCounts.Money})`
    },
    {
      id: "ATM",
      label: isEs
        ? `🏧 Cajeros ATM (${layerCounts.ATM})`
        : `🏧 Hackable ATMs (${layerCounts.ATM})`
    },
    {
      id: "RareCar",
      label: isEs
        ? `🏎️ Autos Raros Gratis (${layerCounts.RareCar})`
        : `🏎️ Rare Free Cars (${layerCounts.RareCar})`
    },
    {
      id: "Fence",
      label: `🤝 Fences (${layerCounts.Fence})`
    },
    {
      id: "EasterEgg",
      label: `🥚 Easter Eggs (${layerCounts.EasterEgg})`
    },
    {
      id: "Collectible",
      label: isEs
        ? `🦩 Coleccionables (${layerCounts.Collectible})`
        : `🦩 Collectibles & Stunts (${layerCounts.Collectible})`
    }
  ];

  const visiblePins = useMemo(() => {
    return pins.filter((p) => {
      const matchReg = selectedRegion === "ALL" || p.region === selectedRegion;
      const matchLayer = activeLayer === "ALL" || p.type === activeLayer;
      const matchHide = !hideFound || !foundPins.includes(p.id);
      return matchReg && matchLayer && matchHide;
    });
  }, [pins, selectedRegion, activeLayer, hideFound, foundPins]);

  const selectedPin = useMemo(() => {
    if (!selectedPinId) return null;
    const found = pins.find((p) => p.id === selectedPinId);
    if (!found || found.locked) return null;
    return found;
  }, [pins, selectedPinId]);

  const totalPins = pins.length || 32;
  const completedCount = useMemo(() => {
    const idSet = new Set(pins.map((p) => p.id));
    return foundPins.filter((id) => idSet.has(id)).length;
  }, [pins, foundPins]);
  const completionPct = totalPins > 0 ? Math.round((completedCount / totalPins) * 100) : 0;

  const handleZoomIn = () => {
    setZoom((prev) => {
      const next = Math.min(2.5, Number((prev + 0.25).toFixed(2)));
      setPan((currPan) => clampPan(currPan.x, currPan.y, next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
      setPan((currPan) => clampPan(currPan.x, currPan.y, next));
      return next;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    dragOriginRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest("button, a, input, select")) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOriginRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originPanX: pan.x,
      originPanY: pan.y
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragOriginRef.current;
    if (!drag || drag.pointerId !== e.pointerId || zoom <= 1) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setPan(clampPan(drag.originPanX + dx, drag.originPanY + dy, zoom));
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragOriginRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      dragOriginRef.current = null;
      setIsDragging(false);
    }
  };

  const handlePinInteraction = (pin: MapPin) => {
    if (pin.locked) {
      onOpenPricing();
      return;
    }
    setSelectedPinId(pin.id);
  };

  return (
    <section id="view-map" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {isEs
              ? `Mapa Táctico de Leonida (${totalPins} Ubicaciones)`
              : `Interactive Leonida Tactical Map (${totalPins} Locations)`}
          </h2>
          <p>
            {isEs
              ? "Zonas de dinero fácil, cajeros ATM hackeables, autos raros gratis, fences y coleccionables."
              : "Fast money spots, hackable/towable ATMs, rare free vehicles, fences & 100% collectibles."}
          </p>
        </div>
        <div className="progress-pill">
          <div className="progress-top">
            <span>{isEs ? "Progreso 100%" : "100% Completion"}</span>
            <strong id="mapProgressText">
              {completedCount} / {totalPins} ({completionPct}%)
            </strong>
          </div>
          <div className="progress-track">
            <div
              id="mapProgressBar"
              className="progress-fill"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="map-layer-chips" id="mapLayerChips">
        {layerChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            data-layer={chip.id}
            className={`layer-chip ${activeLayer === chip.id ? "active" : ""}`}
            onClick={() => setActiveLayer(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="controls-bar">
        <select
          id="regionFilter"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          <option value="ALL">
            {isEs ? "Las 6 Regiones de Leonida" : "All 6 Leonida Regions"}
          </option>
          {MAP_REGIONS.map((reg) => (
            <option key={reg.value} value={reg.value}>
              {reg.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          id="hideFoundBtn"
          className={`btn-secondary ${hideFound ? "active" : ""}`}
          onClick={() => setHideFound((prev) => !prev)}
        >
          {isEs ? "Ocultar Encontrados" : "Hide Found Pins"}
        </button>

        <button
          type="button"
          id="openShareCardBtn"
          className="btn-pro"
          style={{ width: "auto" }}
          onClick={onOpenSocialStudio}
        >
          {isEs ? "📱 Tarjeta TikTok / IG" : "📱 TikTok & IG Card"}
        </button>
      </div>

      <div className="map-workspace">
        <div
          id="mapViewport"
          className={`map-viewport ${zoom > 1 ? "zoomed" : ""} ${
            isDragging ? "dragging" : ""
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
        >
          <div className="map-zoom-controls">
            <button
              type="button"
              id="zoomInBtn"
              title={isEs ? "Acercar" : "Zoom In"}
              onClick={handleZoomIn}
            >
              +
            </button>
            <button
              type="button"
              id="zoomOutBtn"
              title={isEs ? "Alejar" : "Zoom Out"}
              onClick={handleZoomOut}
            >
              −
            </button>
            <button
              type="button"
              id="resetZoomBtn"
              title={isEs ? "Reiniciar Vista" : "Reset View"}
              onClick={handleResetView}
            >
              ⟲
            </button>
          </div>

          {selectedPin && (
            <div id="mapInspector" className="map-inspector">
              <div className="map-inspector-info">
                <span className="cat-tag">
                  {selectedPin.icon} {selectedPin.region} • {selectedPin.type}
                </span>
                <h4 style={{ margin: "3px 0", fontSize: "15px" }}>
                  {selectedPin.icon}{" "}
                  {cleanPinName(resolveLocalized(selectedPin.name, lang), selectedPin.icon)}
                </h4>
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {resolveLocalized(selectedPin.note, lang)}
                </p>
              </div>
              <div className="map-inspector-actions">
                <button
                  type="button"
                  className="btn-pro"
                  style={{ width: "auto" }}
                  onClick={() => onTogglePinFound(selectedPin.id)}
                >
                  {foundPins.includes(selectedPin.id)
                    ? isEs
                      ? "✓ Encontrado (Deshacer)"
                      : "✓ Found (Undo)"
                    : isEs
                      ? "Marcar Encontrado"
                      : "Mark Found"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  aria-label={isEs ? "Cerrar inspector" : "Close inspector"}
                  onClick={() => setSelectedPinId(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div
            id="mapCanvas"
            className="map-canvas"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? "none" : "transform 0.2s ease"
            }}
          >
            <svg viewBox="0 0 900 680" className="leonida-svg">
              <defs>
                <pattern
                  id="grid"
                  width="36"
                  height="36"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 36 0 L 0 0 0 36"
                    fill="none"
                    stroke="#16223b"
                    strokeWidth="1"
                  />
                </pattern>
                <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#060b16" />
                  <stop offset="100%" stopColor="#091326" />
                </linearGradient>
                <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18243d" />
                  <stop offset="60%" stopColor="#142036" />
                  <stop offset="100%" stopColor="#111b2e" />
                </linearGradient>
              </defs>
              <rect width="900" height="680" fill="url(#oceanGrad)" />
              <rect width="900" height="680" fill="url(#grid)" />
              <path
                d="M165,30 L615,30 L685,210 L725,425 L675,525 L555,585 L370,635 L220,665 L205,645 L350,605 L465,550 L395,485 L295,455 L235,345 L145,255 L125,130 Z"
                fill="rgba(0, 229, 255, 0.05)"
              />
              <path
                d="M185,40 L595,40 L645,165 L675,310 L692,415 L665,485 L620,518 L555,535 L490,515 L440,468 L360,445 L290,415 L258,340 L215,318 L185,250 L160,150 Z"
                fill="url(#landGrad)"
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
              <ellipse
                cx="696"
                cy="382"
                rx="9"
                ry="14"
                fill="#1b2947"
                stroke="#00e5ff"
                strokeWidth="1"
              />
              <line
                x1="684"
                y1="362"
                x2="707"
                y2="362"
                stroke="#ff2a85"
                strokeWidth="2"
              />
              <line
                x1="686"
                y1="405"
                x2="705"
                y2="405"
                stroke="#ff2a85"
                strokeWidth="2"
              />
              <path
                d="M265,95 Q365,55 470,98 Q445,148 355,142 Q275,138 265,95 Z"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeOpacity="0.35"
                strokeDasharray="4 3"
              />
              <path
                d="M305,102 Q365,76 425,104 Q405,128 355,125 Q315,122 305,102 Z"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.5"
              />
              <path
                d="M455,255 Q515,245 535,288 Q525,335 475,332 Q435,320 455,255 Z"
                fill="#070d19"
                stroke="#00e5ff"
                strokeWidth="1.5"
                strokeOpacity="0.5"
              />
              <path d="M535,295 L678,325" stroke="#070d19" strokeWidth="6" />
              <path
                d="M415,430 Q475,455 545,442 M445,465 Q515,485 595,472 M385,405 Q435,415 480,395"
                fill="none"
                stroke="#070d19"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M215,318 Q250,305 268,332 Q245,355 215,318 Z"
                fill="#070d19"
              />
              <path
                d="M565,535 Q485,585 375,615 Q290,635 225,650"
                fill="none"
                stroke="#ff2a85"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                strokeOpacity="0.75"
              />
              <ellipse
                cx="535"
                cy="552"
                rx="18"
                ry="6"
                transform="rotate(-24 535 552)"
                fill="#18243d"
                stroke="#00e5ff"
                strokeWidth="1.2"
              />
              <ellipse
                cx="475"
                cy="582"
                rx="22"
                ry="6"
                transform="rotate(-20 475 582)"
                fill="#18243d"
                stroke="#00e5ff"
                strokeWidth="1.2"
              />
              <ellipse
                cx="405"
                cy="608"
                rx="24"
                ry="6"
                transform="rotate(-16 405 608)"
                fill="#18243d"
                stroke="#00e5ff"
                strokeWidth="1.2"
              />
              <ellipse
                cx="325"
                cy="628"
                rx="20"
                ry="6"
                transform="rotate(-14 325 628)"
                fill="#18243d"
                stroke="#00e5ff"
                strokeWidth="1.2"
              />
              <ellipse
                cx="242"
                cy="646"
                rx="22"
                ry="7"
                transform="rotate(-12 242 646)"
                fill="#18243d"
                stroke="#00e5ff"
                strokeWidth="1.2"
              />
              <path
                d="M365,115 L255,285 L340,415 L655,405 L635,185 L465,115"
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="2"
              />
              <text x="365" y="82" className="region-label">
                MOUNT KALAGA NATIONAL PARK
              </text>
              <text x="245" y="245" className="region-label">
                PORT GELLHORN
              </text>
              <text x="490" y="232" className="region-label">
                AMBROSIA
              </text>
              <text x="615" y="378" className="region-label">
                VICE CITY
              </text>
              <text x="485" y="492" className="region-label">
                GRASSRIVERS
              </text>
              <text x="385" y="655" className="region-label">
                LEONIDA KEYS
              </text>
            </svg>

            <div id="mapPinsLayer">
              {visiblePins.map((p) => {
                const isLocked = Boolean(p.locked);
                const isFound = foundPins.includes(p.id);
                const isSelected = selectedPinId === p.id;
                const cleanName = cleanPinName(resolveLocalized(p.name, lang), p.icon);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`map-pin ${isFound ? "found" : ""} ${
                      isSelected ? "selected" : ""
                    }`}
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      ...(isLocked
                        ? { borderColor: "#64748b", opacity: 0.75 }
                        : {})
                    }}
                    title={
                      isLocked
                        ? isEs
                          ? "🔒 Street Pass ($1.99)"
                          : "🔒 Street Pass ($1.99)"
                        : `${p.icon} ${cleanName}`
                    }
                    onClick={() => handlePinInteraction(p)}
                  >
                    {isLocked ? "🔒" : p.icon}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="map-sidebar-list">
          <h3>{isEs ? "Ubicaciones de Leonida" : "Leonida Locations"}</h3>
          <p className="muted-sub">
            {isEs
              ? "Marca zonas de dinero, ATMs, autos raros y coleccionables."
              : "Check off money spots, ATMs, rare cars & collectibles."}
          </p>
          <div id="pinChecklist" className="pin-list">
            {visiblePins.map((p) => {
              const isLocked = Boolean(p.locked);
              const isFound = foundPins.includes(p.id);
              const cleanName = cleanPinName(resolveLocalized(p.name, lang), p.icon);

              if (isLocked) {
                return (
                  <div
                    key={p.id}
                    className="pin-row locked"
                    style={{ opacity: 0.72, borderStyle: "dashed" }}
                    onClick={onOpenPricing}
                  >
                    <span>🔒</span>
                    <div>
                      <h4>{cleanName}</h4>
                      <p>
                        <strong>{p.region}</strong> •{" "}
                        {isEs
                          ? "Desbloquea con Street Pass ($1.99)"
                          : "Unlock with Street Pass ($1.99)"}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={p.id}
                  className={`pin-row ${isFound ? "found" : ""} ${
                    selectedPinId === p.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedPinId(p.id)}
                >
                  <input
                    type="checkbox"
                    checked={isFound}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onTogglePinFound(p.id)}
                    aria-label={cleanName}
                  />
                  <div>
                    <h4>
                      {p.icon} {cleanName}
                    </h4>
                    <p>
                      <strong>{p.region}</strong> • {resolveLocalized(p.note, lang)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <FenceTable lang={lang} />
    </section>
  );
}

export default MapView;
