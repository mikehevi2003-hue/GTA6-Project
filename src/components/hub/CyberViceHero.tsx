"use client";

import type { ContentPayload, Language, UserProgress, UserTier } from "@/types/vicelink";
import type { ActiveView } from "./ViceLinkHub";

export interface CyberViceHeroProps {
  lang: Language;
  activeView: ActiveView;
  tier: UserTier;
  content: ContentPayload;
  progress: UserProgress;
  onNavigateView: (view: ActiveView) => void;
  onOpenCmdk: () => void;
}

const VIEW_HERO_META: Record<
  ActiveView,
  {
    icon: string;
    accent: string;
    titleEn: string;
    titleEs: string;
    subEn: string;
    subEs: string;
  }
> = {
  cheats: {
    icon: "🎮",
    accent: "#00e5ff",
    titleEn: "Tactical Cheat & Sandbox Deck",
    titleEs: "Centro Táctico de Trucos y Desbloqueos",
    subEn: "Live verified controller sequences synced with patch notes and story milestones.",
    subEs: "Secuencias D-Pad verificadas y sincronizadas con parches e hitos de la historia."
  },
  map: {
    icon: "🗺️",
    accent: "#ff2a85",
    titleEn: "Leonida Satellite Tactical Atlas",
    titleEs: "Atlas Táctico Satelital de Leonida",
    subEn: "Pinpoint armored routes, rare spawns, fence buyers, and 100% completion markers.",
    subEs: "Rutas de dinero, vehículos exóticos, receptadores y coleccionables al 100%."
  },
  glitches: {
    icon: "⚡",
    accent: "#facc15",
    titleEn: "Single-Player Sandbox & Patch Monitor",
    titleEs: "Técnicas Sandbox y Monitor de Parches",
    subEn: "Patch-tracked physics, stealth, and offline story routing methods updated by AI telemetry.",
    subEs: "Física, sigilo y rutas offline actualizadas automáticamente tras cada parche."
  },
  forum: {
    icon: "👁️",
    accent: "#a855f7",
    titleEn: "Leonida Lore & Mystery Signal Feed",
    titleEs: "Misterios, Teorías y Red de Leonida",
    subEn: "Coordinate sightings across Vice City, Grassrivers, and Mount Kalaga.",
    subEs: "Coordina avistamientos y teorías entre Vice City, Grassrivers y Mount Kalaga."
  },
  database: {
    icon: "🏎️",
    accent: "#38bdf8",
    titleEn: "Fleet Specs & Property ROI Terminal",
    titleEs: "Base de Vehículos y Retorno de Propiedades",
    subEn: "Compare top speed classes, garage capacity, and daily cashflow ROI plans.",
    subEs: "Compara velocidad punta, capacidad de garaje y retorno diario de propiedades."
  },
  mechanics: {
    icon: "📘",
    accent: "#34d399",
    titleEn: "Next-Gen Systems & Economy Manual",
    titleEs: "Manual de Nuevas Mecánicas y Economía",
    subEn: "Master dual-protagonist switching, trunk arsenals, WAiNK hacking, and BuckMe security.",
    subEs: "Domina el cambio dual, arsenal de maletero, app WAiNK y seguridad financiera BuckMe."
  },
  controls: {
    icon: "🕹️",
    accent: "#22d3ee",
    titleEn: "Pro Controller & Hidden Combo Vault",
    titleEs: "Bóveda de Controles Ocultos PS5 / Xbox",
    subEn: "Visual button combos for stealth takedowns, marine maneuvers, and air drops.",
    subEs: "Combinaciones visuales para sigilo avanzado, maniobras navales y combate aéreo."
  },
  radio: {
    icon: "📻",
    accent: "#fb7185",
    titleEn: "25-Station Leonida Airwaves",
    titleEs: "Las 25 Emisoras de Radio de Leonida",
    subEn: "Explore verified tracklists, DJ hosts, and unlockable pirate frequencies.",
    subEs: "Explora tracklists verificados, locutores y frecuencias desbloqueables."
  },
  trophies: {
    icon: "🏆",
    accent: "#facc15",
    titleEn: "Road to Platinum & Missable Radar",
    titleEs: "Ruta al Platino y Radares Perdidizos",
    subEn: "Track all 55 trophies, missable warnings, and 5 Criminal Profile ranks.",
    subEs: "Rastrea los 55 trofeos, alertas perdidizas y 5 rangos de Perfil Criminal."
  },
  ai: {
    icon: "🤖",
    accent: "#00e5ff",
    titleEn: "Spoiler-Shielded AI Leonida Advisor",
    titleEs: "Asesor IA de Leonida con Escudo Anti-Spoilers",
    subEn: "Ask strategy questions scoped strictly to your current story chapter.",
    subEs: "Consulta estrategias tácticas adaptadas exactamente a tu capítulo actual."
  },
  feedback: {
    icon: "💡",
    accent: "#fbbf24",
    titleEn: "Community Intel Dispatch",
    titleEs: "Envío de Intel Comunitario",
    subEn: "Submit new discoveries, spot corrections, and patch confirmations for review.",
    subEs: "Envía nuevos hallazgos, correcciones y confirmaciones de parche para revisión."
  },
  account: {
    icon: "👤",
    accent: "#38bdf8",
    titleEn: "Zero-Trust Account, Sync & 2FA Vault",
    titleEs: "Cuenta Zero-Trust, Sync Consola y Bóveda 2FA",
    subEn: "Manage PlayStation/Xbox verification, 1-tap screenshot OCR sync, and TOTP 2FA.",
    subEs: "Gestiona consola verificada, sincronización por captura OCR y 2FA TOTP."
  },
  admin: {
    icon: "🛡️",
    accent: "#ff2a85",
    titleEn: "Co-Founder Command & AI Patch Agent",
    titleEs: "Comando Co-Fundador y Agente IA de Parches",
    subEn: "Autonomous GTA update tracking, 1-click rollbacks, keyword analytics, and audit logs.",
    subEs: "Rastreo autónomo de actualizaciones GTA, rollback en 1 clic y analítica de búsquedas."
  }
};

function ProgressRing({
  label,
  value,
  max,
  color
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.min(100, Math.round((value / safeMax) * 100));
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="cyber-progress-ring">
      <svg width="46" height="46" viewBox="0 0 46 46" className="cyber-ring-svg" aria-hidden="true">
        <circle cx="23" cy="23" r={r} className="cyber-ring-track" />
        <circle
          cx="23"
          cy="23"
          r={r}
          className="cyber-ring-fill"
          style={{
            stroke: color,
            strokeDasharray: `${circ}`,
            strokeDashoffset: `${offset}`
          }}
        />
        <text x="23" y="26" textAnchor="middle" className="cyber-ring-pct">
          {pct}%
        </text>
      </svg>
      <div className="cyber-ring-meta">
        <span>{label}</span>
        <strong>
          {value}/{safeMax}
        </strong>
      </div>
    </div>
  );
}

export default function CyberViceHero({
  lang,
  activeView,
  tier,
  content,
  progress,
  onNavigateView,
  onOpenCmdk
}: CyberViceHeroProps) {
  const isEs = lang === "es";
  const meta = VIEW_HERO_META[activeView];

  return (
    <section
      className="cyber-hero"
      style={{ ["--hero-accent" as string]: meta.accent }}
      aria-label={isEs ? "Panel dinámico de estado ViceLink" : "ViceLink dynamic telemetry hero"}
    >
      <div className="cyber-hero-main">
        <div className="cyber-hero-badges">
          <span className="cyber-patch-pill">● PATCH v1.002 LIVE</span>
          <span className="cyber-tier-pill">{tier.toUpperCase()}</span>
        </div>

        <div className="cyber-hero-title-row">
          <span className="cyber-hero-icon" aria-hidden="true">
            {meta.icon}
          </span>
          <div>
            <h2>{isEs ? meta.titleEs : meta.titleEn}</h2>
            <p>{isEs ? meta.subEs : meta.subEn}</p>
          </div>
        </div>

        <div className="cyber-hero-actions">
          <button
            type="button"
            className="btn-secondary cyber-chip-btn"
            onClick={() => onNavigateView("map")}
          >
            🗺️ {isEs ? "Mapa Interactivo" : "Interactive Map"}
          </button>
          <button
            type="button"
            className="btn-secondary cyber-chip-btn"
            onClick={() => onNavigateView("account")}
          >
            📸 {isEs ? "Auto-Sync Consola" : "Console Auto-Sync"}
          </button>
          <button
            type="button"
            className="btn-secondary cyber-chip-btn"
            onClick={onOpenCmdk}
          >
            ⌘K {isEs ? "Búsqueda Global" : "Command Search"}
          </button>
        </div>
      </div>

      <div className="cyber-hero-rings">
        <ProgressRing
          label={isEs ? "Pines Leonida" : "Leonida Pins"}
          value={progress.foundPins.length}
          max={content.pins.length}
          color="#00e5ff"
        />
        <ProgressRing
          label={isEs ? "Trofeos Platino" : "Trophies"}
          value={(progress.unlockedTrophies ?? []).length}
          max={content.totalTrophiesCount}
          color="#ff2a85"
        />
      </div>
    </section>
  );
}
