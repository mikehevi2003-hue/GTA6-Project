import { tField } from "@/lib/i18n/helpers";
import type {
  ContentPayload,
  KeywordArea,
  Language,
  TheoryPost
} from "@/types/vicelink";

export type KeywordTargetView =
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
  | "admin"
  | "legal";

export type KeywordAreaDefinition = {
  id: KeywordArea;
  icon: string;
  label: { en: string; es: string };
};

export const KEYWORD_AREAS: KeywordAreaDefinition[] = [
  { id: "all", icon: "🌐", label: { en: "All Website Areas", es: "Todas las Áreas del Sitio" } },
  { id: "cheats", icon: "🎮", label: { en: "Cheats & Unlocks", es: "Trucos y Desbloqueos" } },
  { id: "map", icon: "🗺️", label: { en: "Leonida Tactical Map", es: "Mapa Táctico de Leonida" } },
  { id: "glitches", icon: "⚡", label: { en: "Sandbox Techniques", es: "Técnicas Sandbox" } },
  { id: "forum", icon: "👁️", label: { en: "Easter Eggs & Theories", es: "Easter Eggs y Teorías" } },
  { id: "database", icon: "🏎️", label: { en: "Vehicles & Economy", es: "Vehículos y Economía" } },
  { id: "mechanics", icon: "📘", label: { en: "New Mechanics Guide", es: "Nuevas Mecánicas" } },
  { id: "controls", icon: "🕹️", label: { en: "Hidden Controls", es: "Controles Ocultos" } },
  { id: "radio", icon: "📻", label: { en: "Leonida Radio", es: "Radio de Leonida" } },
  { id: "trophies", icon: "🏆", label: { en: "Platinum & Trophies", es: "Platino y Trofeos" } },
  { id: "legal", icon: "⚖️", label: { en: "Legal, Privacy & DMCA", es: "Legal, Privacidad y DMCA" } }
];

export type KeywordMatch = {
  id: string;
  area: Exclude<KeywordArea, "all">;
  areaLabel: string;
  targetView: KeywordTargetView;
  routePath?: string;
  title: string;
  snippet: string;
  badge: string;
  icon: string;
  score: number;
  deepLinkPinId?: string;
};

export type KeywordSearchResult = {
  query: string;
  normalizedQuery: string;
  area: KeywordArea;
  totalMatches: number;
  areaCounts: Record<Exclude<KeywordArea, "all">, number>;
  results: KeywordMatch[];
};

const LEGAL_SEARCH_ITEMS = [
  {
    id: "legal-terms",
    routePath: "/terms",
    icon: "📜",
    title: { en: "Terms of Service & No-Affiliation Notice", es: "Términos de Servicio y Aviso Independiente" },
    snippet: {
      en: "One-time utility license ($1.99 Street / $4.99 Kingpin), independent platform notice, Panama Law 45.",
      es: "Licencia de utilidad de pago único ($1.99 Street / $4.99 Kingpin), aviso independiente, Ley 45 de Panamá."
    },
    keywords: "terms affiliation disclaimer rockstar license street kingpin panama ley 45"
  },
  {
    id: "legal-refunds",
    routePath: "/refunds",
    icon: "💳",
    title: { en: "International No-Refund Policy & Waiver", es: "Política Internacional Sin Reembolsos" },
    snippet: {
      en: "Final digital delivery terms for Yappy & Stripe checkouts with explicit immediate access waiver (EU Art. 16m).",
      es: "Entrega digital final para pagos Yappy y Stripe con renuncia explícita por acceso inmediato."
    },
    keywords: "refund policy yappy stripe digital delivery waiver eu panama"
  },
  {
    id: "legal-privacy",
    routePath: "/privacy",
    icon: "🔒",
    title: { en: "Privacy Policy & Panama Law 81 ARCO Rights", es: "Política de Privacidad y Ley 81 (ARCO)" },
    snippet: {
      en: "Zero-trust account data protection, TOTP 2FA, PS5/Xbox screenshot privacy, and 1-click email opt-out.",
      es: "Protección de datos Zero-Trust, 2FA TOTP, privacidad de capturas PS5/Xbox y baja en 1 clic."
    },
    keywords: "privacy law 81 ley 81 arco gdpr email unsubscribe data protection"
  },
  {
    id: "legal-dmca",
    routePath: "/dmca",
    icon: "⚖️",
    title: { en: "Copyright, Fair-Use Facts & DMCA Safe Harbor", es: "Derechos de Autor, Uso Justo y Puerto Seguro DMCA" },
    snippet: {
      en: "17 U.S.C. § 512 & Panama Ley 64 compliance, 48-hour takedown channel at dmca@vicelink.app.",
      es: "Cumplimiento 17 U.S.C. § 512 y Ley 64 de Panamá, canal de retiro en 48h en dmca@vicelink.app."
    },
    keywords: "dmca copyright trademark safe harbor fair use ley 64 takedown"
  }
];

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function emptyAreaCounts(): Record<Exclude<KeywordArea, "all">, number> {
  return {
    cheats: 0,
    map: 0,
    glitches: 0,
    forum: 0,
    database: 0,
    mechanics: 0,
    controls: 0,
    radio: 0,
    trophies: 0,
    legal: 0
  };
}

function computeMatchScore(title: string, body: string, tokens: string[], fullQuery: string): number {
  const normTitle = normalizeSearchText(title);
  const normBody = normalizeSearchText(body);
  const combined = `${normTitle} ${normBody}`;

  for (const token of tokens) {
    if (!combined.includes(token)) return 0;
  }

  let score = 20;
  if (normTitle === fullQuery) score += 80;
  else if (normTitle.includes(fullQuery)) score += 45;
  else if (tokens.every((tok) => normTitle.includes(tok))) score += 30;
  if (normBody.includes(fullQuery)) score += 15;
  return score;
}

function areaLabelFor(area: Exclude<KeywordArea, "all">, lang: Language): string {
  const found = KEYWORD_AREAS.find((item) => item.id === area);
  return found ? found.label[lang] : area;
}

export function searchSiteKeywords(params: {
  query: string;
  area?: KeywordArea;
  lang: Language;
  content: ContentPayload;
  theories: TheoryPost[];
  glitchesAllowed: boolean;
  limit?: number;
}): KeywordSearchResult {
  const area = params.area ?? "all";
  const lang = params.lang;
  const normalizedQuery = normalizeSearchText(params.query);
  const areaCounts = emptyAreaCounts();

  if (normalizedQuery.length < 2) {
    return {
      query: params.query,
      normalizedQuery,
      area,
      totalMatches: 0,
      areaCounts,
      results: []
    };
  }

  const tokens = normalizedQuery.split(" ").filter((t) => t.length > 0);
  const allMatches: KeywordMatch[] = [];

  // 1. Cheats
  for (const cheat of params.content.cheats) {
    const title = tField(cheat.title, lang);
    const snippet = `${cheat.category} · ${tField(cheat.unlock, lang)} — ${tField(cheat.desc, lang)}`;
    const blob = `${cheat.title.en} ${cheat.title.es} ${cheat.category} ${cheat.unlock.en} ${cheat.unlock.es} ${cheat.howToUnlock.en} ${cheat.howToUnlock.es} ${cheat.desc.en} ${cheat.desc.es}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.cheats += 1;
      allMatches.push({
        id: `kw-cheat-${cheat.id}`,
        area: "cheats",
        areaLabel: areaLabelFor("cheats", lang),
        targetView: "cheats",
        title,
        snippet,
        badge: cheat.category,
        icon: "🎮",
        score
      });
    }
  }

  // 2. Map Pins (locked pins are masked cleanly)
  for (const pin of params.content.pins) {
    const title = tField(pin.name, lang);
    const noteText = pin.locked
      ? lang === "es"
        ? "Ubicación protegida para Street Pass / Kingpin VIP."
        : "Location protected for Street Pass / Kingpin VIP."
      : tField(pin.note, lang);
    const blob = pin.locked
      ? `${pin.region} ${pin.type} ${pin.name.en} ${pin.name.es} locked`
      : `${pin.name.en} ${pin.name.es} ${pin.region} ${pin.type} ${pin.note.en} ${pin.note.es}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.map += 1;
      allMatches.push({
        id: `kw-pin-${pin.id}`,
        area: "map",
        areaLabel: areaLabelFor("map", lang),
        targetView: "map",
        title,
        snippet: `${pin.region} (${pin.x}%, ${pin.y}%) · ${noteText}`,
        badge: pin.locked ? "LOCKED" : pin.type,
        icon: pin.icon || "📍",
        score,
        deepLinkPinId: pin.id
      });
    }
  }

  // 3. Sandbox Techniques (only if allowed)
  if (params.glitchesAllowed) {
    for (const glitch of params.content.glitches) {
      const title = tField(glitch.title, lang);
      const statusText = tField(glitch.status, lang);
      const stepsBlob = `${glitch.steps.en.join(" ")} ${glitch.steps.es.join(" ")}`;
      const blob = `${glitch.title.en} ${glitch.title.es} ${glitch.category} ${statusText} ${glitch.warning.en} ${glitch.warning.es} ${stepsBlob}`;
      const score = computeMatchScore(title, blob, tokens, normalizedQuery);
      if (score > 0) {
        areaCounts.glitches += 1;
        allMatches.push({
          id: `kw-glitch-${glitch.id}`,
          area: "glitches",
          areaLabel: areaLabelFor("glitches", lang),
          targetView: "glitches",
          title,
          snippet: `${glitch.category} · ${statusText}`,
          badge: glitch.isPatched ? "PATCHED" : "ACTIVE",
          icon: glitch.isPatched ? "⚠️" : "⚡",
          score
        });
      }
    }
  }

  // 4. Theories & Easter Eggs
  for (const post of params.theories) {
    const title = tField(post.title, lang);
    const body = tField(post.body, lang);
    const blob = `${post.title.en} ${post.title.es} ${post.tag} ${post.coords} ${post.body.en} ${post.body.es} ${post.author}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.forum += 1;
      allMatches.push({
        id: `kw-forum-${post.id}`,
        area: "forum",
        areaLabel: areaLabelFor("forum", lang),
        targetView: "forum",
        title,
        snippet: `${post.tag} · ${post.coords} — ${body.slice(0, 110)}`,
        badge: post.tag,
        icon: "👁️",
        score
      });
    }
  }

  // 5. Vehicles & Properties
  for (const vehicle of params.content.vehicles) {
    const note = tField(vehicle.note, lang);
    const blob = `${vehicle.name} ${vehicle.class} ${vehicle.note.en} ${vehicle.note.es}`;
    const score = computeMatchScore(vehicle.name, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.database += 1;
      allMatches.push({
        id: `kw-veh-${vehicle.id}`,
        area: "database",
        areaLabel: areaLabelFor("database", lang),
        targetView: "database",
        title: vehicle.name,
        snippet: `${vehicle.class} · ${vehicle.topSpeed} MPH · $${vehicle.price.toLocaleString()} — ${note}`,
        badge: vehicle.class,
        icon: "🏎️",
        score
      });
    }
  }

  for (const prop of params.content.properties) {
    const title = tField(prop.name, lang);
    const note = tField(prop.note, lang);
    const blob = `${prop.name.en} ${prop.name.es} ${prop.region} ${prop.note.en} ${prop.note.es}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.database += 1;
      allMatches.push({
        id: `kw-prop-${prop.id}`,
        area: "database",
        areaLabel: areaLabelFor("database", lang),
        targetView: "database",
        title,
        snippet: `${prop.region} · +$${prop.dailyIncome.toLocaleString()}/day — ${note}`,
        badge: "PROPERTY",
        icon: "🏢",
        score
      });
    }
  }

  // 6. Mechanics
  for (const mech of params.content.mechanics) {
    const title = tField(mech.title, lang);
    const desc = tField(mech.desc, lang);
    const tag = tField(mech.tag, lang);
    const blob = `${mech.title.en} ${mech.title.es} ${mech.tag.en} ${mech.tag.es} ${mech.desc.en} ${mech.desc.es}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.mechanics += 1;
      allMatches.push({
        id: `kw-mech-${mech.id}`,
        area: "mechanics",
        areaLabel: areaLabelFor("mechanics", lang),
        targetView: "mechanics",
        title,
        snippet: `${tag} — ${desc.slice(0, 110)}`,
        badge: tag,
        icon: "📘",
        score
      });
    }
  }

  // 7. Hidden Controls
  for (const ctrl of params.content.controls) {
    const title = tField(ctrl.title, lang);
    const tip = tField(ctrl.tip, lang);
    const blob = `${ctrl.title.en} ${ctrl.title.es} ${ctrl.category} ${ctrl.ps5.en} ${ctrl.ps5.es} ${ctrl.xbox.en} ${ctrl.xbox.es} ${ctrl.tip.en} ${ctrl.tip.es}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.controls += 1;
      allMatches.push({
        id: `kw-ctrl-${ctrl.id}`,
        area: "controls",
        areaLabel: areaLabelFor("controls", lang),
        targetView: "controls",
        title,
        snippet: `${ctrl.category} · ${tField(ctrl.ps5, lang)} — ${tip.slice(0, 95)}`,
        badge: ctrl.category,
        icon: "🕹️",
        score
      });
    }
  }

  // 8. Radio Stations & Tracks
  for (const station of params.content.radioStations) {
    const vibe = tField(station.vibe, lang);
    const trackBlob = station.tracks.map((tr) => `${tr.title} ${tr.artist}`).join(" ");
    const blob = `${station.name} ${station.genre} ${station.hosts} ${station.vibe.en} ${station.vibe.es} ${trackBlob}`;
    const score = computeMatchScore(station.name, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.radio += 1;
      allMatches.push({
        id: `kw-radio-${station.id}`,
        area: "radio",
        areaLabel: areaLabelFor("radio", lang),
        targetView: "radio",
        title: station.name,
        snippet: `${station.genre} · ${station.hosts} — ${vibe}`,
        badge: `${station.tracks.length} tracks`,
        icon: "📻",
        score
      });
    }
  }

  // 9. Platinum & Trophies
  for (const trophy of params.content.trophies) {
    const title = tField(trophy.title, lang);
    const guide = tField(trophy.guide, lang);
    const blob = `${trophy.title.en} ${trophy.title.es} ${trophy.grade} ${trophy.desc.en} ${trophy.desc.es} ${trophy.guide.en} ${trophy.guide.es}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.trophies += 1;
      allMatches.push({
        id: `kw-trophy-${trophy.id}`,
        area: "trophies",
        areaLabel: areaLabelFor("trophies", lang),
        targetView: "trophies",
        title,
        snippet: `${trophy.grade.toUpperCase()} — ${guide.slice(0, 105)}`,
        badge: trophy.missable ? "MISSABLE" : trophy.grade.toUpperCase(),
        icon: "🏆",
        score
      });
    }
  }

  // 10. Legal & DMCA Pages
  for (const legal of LEGAL_SEARCH_ITEMS) {
    const title = legal.title[lang];
    const snippet = legal.snippet[lang];
    const blob = `${legal.title.en} ${legal.title.es} ${legal.snippet.en} ${legal.snippet.es} ${legal.keywords}`;
    const score = computeMatchScore(title, blob, tokens, normalizedQuery);
    if (score > 0) {
      areaCounts.legal += 1;
      allMatches.push({
        id: `kw-${legal.id}`,
        area: "legal",
        areaLabel: areaLabelFor("legal", lang),
        targetView: "legal",
        routePath: legal.routePath,
        title,
        snippet,
        badge: legal.routePath,
        icon: legal.icon,
        score
      });
    }
  }

  const filtered = area === "all" ? allMatches : allMatches.filter((m) => m.area === area);
  filtered.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return {
    query: params.query,
    normalizedQuery,
    area,
    totalMatches: allMatches.length,
    areaCounts,
    results: filtered.slice(0, params.limit ?? 30)
  };
}
