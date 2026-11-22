import type {
  AnimatedGif,
  CheatCategory,
  DirectionKey,
  GlitchCategory,
  LocalizedText,
  SpoilerChapter,
} from "@/types/vicelink";

/** Client-safe UI constants (no paid intel lives here). */

export const REACTION_EMOJIS = ["🔥", "👽", "🤯", "😂", "💀"] as const;

export const ANIMATED_GIFS: AnimatedGif[] = [
  { id: "ufo", icon: "🛸", label: { en: "UFO Abduction Beam!", es: "¡Abducción OVNI!" } },
  { id: "wasted", icon: "💀", label: { en: "WASTED • Mind Blown", es: "WASTED • Mente Explotada" } },
  { id: "money", icon: "💸", label: { en: "+$250k Vice City Rain", es: "+$250k Lluvia Vice City" } },
  { id: "bigfoot", icon: "👣", label: { en: "Skunk Ape Thermal!", es: "¡Skunk Ape Térmico!" } },
  { id: "dog", icon: "🐕", label: { en: "Cool Dog Jet-Ski!", es: "¡Cool Dog en Moto de Agua!" } },
];

/** `value` is the stored tag string used by theory posts. */
export const THEORY_TAGS: { value: string; label: LocalizedText }[] = [
  {
    value: "Verified Easter Egg",
    label: { en: "🥚 Verified Easter Egg", es: "🥚 Easter Egg Verificado" },
  },
  {
    value: "Mount Kalaga / UFO",
    label: { en: "🛸 UFO & Alien Lore", es: "🛸 OVNIs y Lore Alienígena" },
  },
  {
    value: "Chiliad Connection",
    label: { en: "🔺 Chiliad & Statue Mystery", es: "🔺 Misterio Chiliad y Estatuas" },
  },
  {
    value: "NPC Secrets",
    label: { en: "🕵️ Movie & TV Cameos", es: "🕵️ Cameos de Cine y TV" },
  },
  {
    value: "Grassrivers Cryptids",
    label: { en: "🐊 Skunk Ape & Cryptids", es: "🐊 Skunk Ape y Críptidos" },
  },
];

export const GLITCH_CATEGORIES: { value: "ALL" | GlitchCategory; label: LocalizedText }[] = [
  { value: "ALL", label: { en: "All Glitches", es: "Todos los Glitches" } },
  { value: "Money", label: { en: "💰 Money Loops", es: "💰 Dinero Infinito" } },
  { value: "Camera", label: { en: "🎥 Camera & Visual", es: "🎥 Cámara y Visual" } },
  { value: "Stealth", label: { en: "🚓 Wanted & Stealth", es: "🚓 Policía y Sigilo" } },
  { value: "Physics", label: { en: "🚀 Physics & Traversal", es: "🚀 Física y Saltos" } },
];

export const CHEAT_CATEGORIES: { value: "ALL" | CheatCategory; label: LocalizedText }[] = [
  { value: "ALL", label: { en: "All Categories", es: "Todas las Categorías" } },
  { value: "Player", label: { en: "Player & Stats", es: "Jugador y Estadísticas" } },
  { value: "Combat", label: { en: "Combat & Weapons", es: "Combate y Armas" } },
  { value: "Vehicles", label: { en: "Spawn Vehicles", es: "Generar Vehículos" } },
  { value: "World", label: { en: "Environment & Filters", es: "Entorno y Filtros" } },
];

export const REGIONS: string[] = [
  "Vice City",
  "Leonida Keys",
  "Grassrivers",
  "Port Gellhorn",
  "Ambrosia",
  "Mount Kalaga",
];

export const ARROW_MAP: Record<DirectionKey, string> = {
  UP: "↑ UP",
  DOWN: "↓ DOWN",
  LEFT: "← LEFT",
  RIGHT: "→ RIGHT",
};

export const SPOILER_CHAPTERS: { value: SpoilerChapter; label: LocalizedText }[] = [
  {
    value: "ch1",
    label: { en: "🛡️ Spoiler Shield: Chapter 1 (Keys)", es: "🛡️ Escudo Anti-Spoilers: Capítulo 1 (Cayos)" },
  },
  {
    value: "ch2",
    label: {
      en: "🛡️ Spoiler Shield: Chapter 2 (Gellhorn)",
      es: "🛡️ Escudo Anti-Spoilers: Capítulo 2 (Gellhorn)",
    },
  },
  {
    value: "ch3",
    label: {
      en: "🛡️ Spoiler Shield: Chapter 3 (Vice City)",
      es: "🛡️ Escudo Anti-Spoilers: Capítulo 3 (Vice City)",
    },
  },
  {
    value: "endgame",
    label: { en: "🔓 Endgame / 100% Completion", es: "🔓 Final del Juego / 100% Completado" },
  },
];
