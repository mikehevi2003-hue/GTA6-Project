import "server-only";

import type { Language, SpoilerChapter } from "@/types/vicelink";
import { CHEATS_DATA } from "./cheats";
import { GLITCHES_DATA } from "./glitches";
import { LEONIDA_PINS } from "./pins";
import { PROPERTIES_DATA, VEHICLES_DATA } from "./vehicles";

/**
 * Built-in "Leonida Tactical Brain": deterministic, spoiler-aware, bilingual answers.
 * Used directly when no live model is configured, and as the fallback when the live
 * model is unavailable. Lives server-side only because it embeds paid intel.
 */

const CHAPTER_RANK: Record<SpoilerChapter, number> = { ch1: 1, ch2: 2, ch3: 3, endgame: 4 };

const CHAPTER_NAME: Record<number, { en: string; es: string }> = {
  1: { en: "Chapter 1 (Keys)", es: "Capítulo 1 (Cayos)" },
  2: { en: "Chapter 2 (Gellhorn)", es: "Capítulo 2 (Gellhorn)" },
  3: { en: "Chapter 3 (Vice City)", es: "Capítulo 3 (Vice City)" },
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

type EasterEgg = {
  key: RegExp;
  minChapter: number;
  hiddenName: { en: string; es: string };
  en: string;
  es: string;
};

const EASTER_EGGS: EasterEgg[] = [
  {
    key: /cool dog|perro|\bdog\b|gambit|jet.?ski|moto de agua/,
    minChapter: 1,
    hiddenName: { en: "a Keys jet-ski secret", es: "un secreto de moto de agua en los Cayos" },
    en: "🐕 Cool Dog (Gambit Bay, Leonida Keys): swim in Gambit Bay without a boat and wait for barking. A golden dog in a life vest arrives on a jet ski. Praise him, hop on and stay aboard until he leads you to Dog Island, where he digs up a wallet with about $1,200.",
    es: "🐕 Cool Dog (Gambit Bay, Leonida Keys): nada en Gambit Bay sin bote y espera los ladridos. Un perro dorado con chaleco salvavidas llega en moto de agua. Acarícialo, sube y quédate a bordo hasta que te lleve a la Isla de los Perros, donde desentierra una billetera con unos $1,200.",
  },
  {
    key: /flamingo|flamenco/,
    minChapter: 1,
    hiddenName: { en: "a pink collectible", es: "un coleccionable rosa" },
    en: "🦩 Cocaine Flamingos: 50 hidden pink flamingos are spread across Leonida's 6 regions. Shoot all 50 to unlock the Inflatable Flamingo (a rideable giant pool flamingo). Flamingo #1 sits behind the Art Deco lifeguard tower on Ocean Drive.",
    es: "🦩 Flamencos de Cocaína: hay 50 flamencos rosas ocultos en las 6 regiones de Leonida. Destruye los 50 para desbloquear el Flamenco Inflable (un flamenco gigante de piscina que puedes montar). El flamenco #1 está detrás de la torre de salvavidas Art Déco en Ocean Drive.",
  },
  {
    key: /arthur|morgan|sombrero|cowboy|red dead|rdr/,
    minChapter: 2,
    hiddenName: { en: "a cowboy collectible in Port Gellhorn", es: "un coleccionable vaquero en Port Gellhorn" },
    en: "🤠 Arthur Morgan's Hat (south Port Gellhorn, Chapter 2+): at a yard sale a sofa holds a guitar case with the exact Red Dead Redemption 2 cowboy hat. Buy it for $35 as the Genuine Cowboy Hat and both Jason and Lucia can wear it permanently.",
    es: "🤠 Sombrero de Arthur Morgan (sur de Port Gellhorn, Cap. 2+): en una venta de patio hay un sofá con un estuche de guitarra y el sombrero exacto de Red Dead Redemption 2. Cómpralo por $35 como Genuine Cowboy Hat y tanto Jason como Lucía podrán usarlo siempre.",
  },
  {
    key: /bigfoot|skunk|pie grande|cottonmouth|kirk|cryptid|criptid/,
    minChapter: 2,
    hiddenName: { en: "a Grassrivers cryptid", es: "una criptida de Grassrivers" },
    en: "🦍 Cottonmouth Lake Skunk Ape (Bigfoot, Grassrivers): south of Hamlet around Cottonmouth Lake you can spot Leonida's Bigfoot eating a deer on a dirt road. Follow it to a tree effigy; examining it makes you pass out as the creature approaches and unlocks hunter Kirk's side questline.",
    es: "🦍 Skunk Ape (Pie Grande) de Cottonmouth Lake, Grassrivers: al sur de Hamlet, alrededor de Cottonmouth Lake, puedes ver al Pie Grande de Leonida comiendo un ciervo en un camino de tierra. Síguelo hasta una efigie en un árbol; al examinarla te desmayas mientras la criatura se acerca y se desbloquean las misiones del cazador Kirk.",
  },
  {
    key: /ufo|ovni|alien|abduc|kelly|starlet/,
    minChapter: 2,
    hiddenName: { en: "a nighttime Kelly County encounter", es: "un encuentro nocturno en el Condado Kelly" },
    en: "🛸 Kelly County 2:00 AM UFO (Ambrosia): after 2 AM look for a parked car with flashing lights northwest of the Starlet Motel. Follow the trail into the woods to watch a UFO beam up a woman. Walk back to her car and the UFO takes YOU too, and you wake up 3 days later with the hidden 'The Truth Is Out There' trophy.",
    es: "🛸 OVNI de las 2:00 AM en el Condado Kelly (Ambrosia): después de las 2 AM busca un auto con luces intermitentes al noroeste del Starlet Motel. Sigue el sendero al bosque para ver a un OVNI abducir a una mujer. Vuelve a su auto y el OVNI también te lleva a ti; despiertas 3 días después con el trofeo oculto 'The Truth Is Out There'.",
  },
  {
    key: /radio|tower|torre|nido|nest|bird/,
    minChapter: 3,
    hiddenName: { en: "a Vice City landmark secret", es: "un secreto de un monumento de Vice City" },
    en: "🥚 Radio Tower Bird's Nest (Vice City): climb the tallest radio tower (about a 6-7 minute ladder climb) to find a giant bird's nest full of painted Easter eggs. Pick one up and throw it off the edge to trigger a secret comic cutscene showing where it lands.",
    es: "🥚 Nido de la Torre de Radio (Vice City): sube la torre de radio más alta (unos 6-7 minutos de escaleras) para hallar un nido gigante lleno de huevos de Pascua pintados. Toma uno y lánzalo al vacío para activar una cinemática cómica secreta que muestra dónde cae.",
  },
  {
    key: /dexter|trinity|slice of life|washington island/,
    minChapter: 3,
    hiddenName: { en: "a TV-cameo apartment on Washington Island", es: "un departamento de cameo televisivo en Washington Island" },
    en: "🔪 Dexter Morgan's Trinity Apartments (Washington Island, Vice City): Rockstar rebuilt Dexter's Miami apartment building. Climb to the roof to find his kill kit (duct tape, rope and syringe) and check the dock below for his boat, 'Slice of Life'.",
    es: "🔪 Apartamentos Trinity de Dexter Morgan (Washington Island, Vice City): Rockstar recreó el edificio de Dexter en Miami. Sube a la azotea para hallar su kit (cinta adhesiva, cuerda y jeringa) y mira el muelle de abajo, donde está su barco 'Slice of Life'.",
  },
];

function easterEggReply(q: string, rank: number, isEs: boolean): string {
  const matched = EASTER_EGGS.filter((egg) => egg.key.test(q));
  const pool = matched.length > 0 ? matched : EASTER_EGGS;
  const visible = pool.filter((egg) => rank >= egg.minChapter);
  const hidden = pool.filter((egg) => rank < egg.minChapter);

  const lines: string[] = [];
  lines.push(
    isEs
      ? "🥚 Easter Eggs y Secretos de Leonida:"
      : "🥚 Leonida Easter Eggs & Secrets:",
  );
  for (const egg of visible) lines.push(`• ${isEs ? egg.es : egg.en}`);

  for (const egg of hidden) {
    const when = CHAPTER_NAME[egg.minChapter] ?? CHAPTER_NAME[3];
    lines.push(
      isEs
        ? `• 🛡️ [Escudo Anti-Spoilers]: ${egg.hiddenName.es} se revela desde el ${when.es}. Cambia tu escudo para verlo.`
        : `• 🛡️ [Spoiler Shield]: ${egg.hiddenName.en} is revealed from ${when.en}. Raise your shield level to see it.`,
    );
  }

  if (matched.length === 0) {
    lines.push(
      isEs
        ? "Pregúntame por nombre: torre de radio, Dexter, OVNI, Cool Dog, Skunk Ape, Arthur Morgan o flamencos. También hay un tablón con 10 teorías en la pestaña Easter Eggs y Teorías."
        : "Ask me by name: radio tower, Dexter, UFO, Cool Dog, Skunk Ape, Arthur Morgan or flamingos. There are also 10 verified secrets on the Easter Eggs & Theories board.",
    );
  }
  return lines.join("\n");
}

function cheatsReply(rank: number, isEs: boolean): string {
  const total = CHEATS_DATA.length;
  const verified = CHEATS_DATA.filter((c) => c.seq.length > 0).length;
  if (rank < 4) {
    return isEs
      ? `🎮 Trucos: hay ${total} trucos (${verified} con combinación verificada). Se activan abriendo el teléfono (Flecha Arriba), manteniendo L1+R1 (PS5) o LB+RB (Xbox) e ingresando la secuencia. Requieren haber completado la historia y desactivan trofeos y guardado. 🛡️ Por el Escudo Anti-Spoilers no detallo qué truco se desbloquea en cada final; abre 'Cómo Desbloquear Todos' para tu lista de desafíos.`
      : `🎮 Cheats: there are ${total} cheats (${verified} with a verified button combo). Open the phone (D-Pad Up), hold L1+R1 (PS5) or LB+RB (Xbox) and enter the sequence. They require beating the story and disable Trophies and Saving. 🛡️ Because of your Spoiler Shield I won't detail which cheat unlocks at each ending; open 'How to Unlock All' for your challenge checklist.`;
  }
  return isEs
    ? `🎮 Trucos: hay ${total} trucos (${verified} con combinación verificada). Activación: Flecha Arriba (teléfono) + mantener L1+R1 / LB+RB + secuencia. Requiere completar las 91 misiones y desactiva trofeos y guardado.\n• 💵 +$250,000 (único truco de dinero): termina la historia.\n• 🦩 Flamenco Inflable: destruye los 50 flamencos (sin combinación conocida).\n• 🛡️ Blindaje Completo: 100 entrenamientos.\n• 🔫 Munición Infinita: 25 medallas de Plata en campos de tiro.\nRevisa la pestaña Trucos > 'Cómo Desbloquear Todos' para marcar tu progreso.`
    : `🎮 Cheats: there are ${total} cheats (${verified} with a verified button combo). Activate: D-Pad Up (phone) + hold L1+R1 / LB+RB + sequence. Requires beating all 91 missions and disables Trophies and Saving.\n• 💵 +$250,000 (the only money cheat): finish the story.\n• 🦩 Inflatable Flamingo: destroy all 50 flamingos (no known combo yet).\n• 🛡️ Full Body Armor: 100 workouts.\n• 🔫 Infinite Ammo: 25 Silver medals at shooting ranges.\nOpen Cheats > 'How to Unlock All' to track your progress.`;
}

function glitchesReply(rank: number, isEs: boolean): string {
  const total = GLITCHES_DATA.length;
  const ch1 =
    rank === 1
      ? isEs
        ? "\n🛡️ [Escudo Capítulo 1]: el efectivo en mano se reinicia al final de 'Tourist Trap'; deposita en BuckMe Savings antes de usar bucles de dinero."
        : "\n🛡️ [Chapter 1 Shield]: cash on hand resets at the end of 'Tourist Trap'; deposit into BuckMe Savings before running money loops."
      : "";
  return (
    (isEs
      ? `⚡ Glitches activos (Parche 01.002.001): ${total} verificados.\n• 💰 Bucle de dinero del Granero Rojo de Apollo Aggregates (~$40k–$89k por viaje).\n• 🎥 Cámara en primera persona real (PS5 y Xbox).\n• 🚓 Evadir rastreadores GPS e identificación policial.\n• 🚀 Super-salto con hidrodeslizador en Grassrivers y 🏍️ impulso de moto en bordillos.\nLos pasos detallados están en la pestaña Glitches y Exploits (Street Pass $1.99).`
      : `⚡ Active glitches (Patch 01.002.001): ${total} verified.\n• 💰 Apollo Aggregates Red Barn money loop (~$40k–$89k per run).\n• 🎥 True first-person camera (PS5 & Xbox).\n• 🚓 Police vehicle-ID & GPS tracker bypass.\n• 🚀 Grassrivers airboat super-launch and 🏍️ motorcycle curb boost.\nStep-by-step guides live in the Glitches & Exploits tab (Street Pass $1.99).`) + ch1
  );
}

function moneyReply(rank: number, isEs: boolean): string {
  if (rank === 1) {
    return isEs
      ? "🛡️ [Escudo Capítulo 1]: Antes de terminar 'Tourist Trap', el efectivo en mano se reinicia. Usa la Caja Fuerte de Brian (código 7700 en Key Lento) y deposita tus ganancias en tu Cuenta de Ahorros BuckMe."
      : "🛡️ [Chapter 1 Shield]: Cash on hand gets wiped at the end of Chapter 1 ('Tourist Trap'). Deposit earnings into your BuckMe Savings Account and sell early stash bags at Brian's Lockup (Keypad: 7700).";
  }
  if (rank === 2) {
    return isEs
      ? "💰 Ruta de dinero (Cap. 2): ve al granero rojo de Apollo Aggregates (al este de Hamlet), llena una van de 10 espacios con bolsas y la caja fuerte (~$40k–$89k por viaje) y cambia de personaje para reiniciar el botín. Véndelo a Dunk (Port Gellhorn). 🛡️ El mejor comprador se revela en el Capítulo 3."
      : "💰 Money Route (Ch. 2): hit the Apollo Aggregates red barn (east of Hamlet), load a 10-slot van with stash bags + office safe (~$40k–$89k per run) and switch characters to respawn the loot. Sell to Dunk (Port Gellhorn). 🛡️ The best buyer is revealed in Chapter 3.";
  }
  return isEs
    ? "💰 Ruta más rápida de dinero: Ve al granero rojo de Apollo Aggregates (al este de Hamlet), llena una van de 10 espacios con bolsas de cocaína y la caja fuerte (~$40k–$89k por viaje), cambia de personaje para reiniciar el botín al instante y véndelo a Tyrone en La Perle (Vice City). Alternativa: bóveda del banco de Vice City (~$205k en 5 min) y venta de joyas a Yasmani."
    : "💰 Fastest Money Route: Hit the Apollo Aggregates red barn (east of Hamlet), load a 10-slot van with stash bags + office safe (~$40k–$89k per run), switch characters to instantly respawn the loot, and sell to Tyrone in La Perle (Vice City). Alternative: the Vice City bank vault loop (~$205k in 5 min) and sell jewelry to Yasmani.";
}

function atmReply(isEs: boolean): string {
  return isEs
    ? "🏧 Cajeros ATM y Autos Raros: 1) Usa una grúa o el escáner WAiNK en Ocean Drive y Little Cuba para abrir cajeros ATM. 2) El Mitsubishi Eclipse verde de Paul Walker está gratis en un garaje de Vespucci Island (apaga la alarma de la pared antes de salir). 3) Otros autos gratis: Buggy '67 Vapid Dominator (Paradise Garage, Watson Bay) y el hidrodeslizador Panther / POACH en el muelle de Pelican Valley."
    : "🏧 Hackable ATMs & Rare Cars: 1) Rip wall ATMs with a tow-truck winch or bypass them with WAiNK on Ocean Drive & Little Cuba. 2) Paul Walker's green Mitsubishi Eclipse is free inside a Vespucci Island villa garage—disable the wall alarm first! 3) More free rides: the '67 Vapid Dominator Buggy (Paradise Garage, Watson Bay) and the Panther / POACH airboat at the Pelican Valley pier.";
}

function fenceReply(rank: number, isEs: boolean): string {
  if (rank === 1) {
    return isEs
      ? "🤝 Compradores disponibles en el Capítulo 1:\n• Brian (sur de Key Lento): narcóticos y efectivo inicial, tarifa baja. Código 7700.\n• Donnie (sur de Key Lento): mercancía inicial; cierra tras 'Swamped'.\n🛡️ Los compradores de capítulos posteriores están ocultos por tu escudo."
      : "🤝 Fences available in Chapter 1:\n• Brian (South Key Lento): early narcotics & cash, low rate. Keypad 7700.\n• Donnie (South Key Lento): early drop-box goods; closes after 'Swamped'.\n🛡️ Later-chapter fences are hidden by your shield.";
  }
  if (rank === 2) {
    return isEs
      ? "🤝 Compradores hasta el Capítulo 2:\n• Brian y Donnie (Key Lento): tarifa baja, cierran tras el Cap. 1.\n• Moses 'Mo' Watkins (Port Gellhorn): autos robados sin rastreador, $1,000+ por auto; desbloquea la ganzúa Slim Jim.\n• Dunk (sur de Port Gellhorn): narcóticos y bolsas del Cap. 2, tarifa media.\n🛡️ Hay compradores con mejor pago en el Capítulo 3."
      : "🤝 Fences up to Chapter 2:\n• Brian & Donnie (Key Lento): low rate, close after Ch. 1.\n• Moses 'Mo' Watkins (Port Gellhorn): stolen cars with no trackers, $1,000+ each; unlocks the Slim Jim tool.\n• Dunk (South Port Gellhorn): Ch. 2 narcotics & stash bags, medium rate.\n🛡️ Higher-paying fences appear in Chapter 3.";
  }
  return isEs
    ? "🤝 Mejores Fences en Leonida:\n• Narcóticos / Bolsas: Tyrone (La Perle, Vice City) paga el máximo.\n• Joyas y Billetes Marcados: Yasmani (Little Cuba, Vice City) paga el máximo y vende pistas de bancos.\n• Autos Robados: Moses en Port Gellhorn (Cap. 2) o Randy en Balsero (superautos de su lista).\n• Dunk (Port Gellhorn) paga tarifa media por bolsas del Cap. 2."
    : "🤝 Best Fences in Leonida:\n• Narcotics / Stash Bags: Tyrone (La Perle, Vice City) pays the highest rate.\n• Jewelry & Marked Bills: Yasmani (Little Cuba, Vice City) pays top dollar + sells Bank Vault tips.\n• Stolen Cars: Moses in Port Gellhorn (Ch. 2) or Randy in Balsero (wish-list supercars).\n• Dunk (Port Gellhorn) pays a medium rate for Ch. 2 stash bags.";
}

function vehiclesReply(rank: number, isEs: boolean): string {
  const fastest = [...VEHICLES_DATA].sort((a, b) => b.topSpeed - a.topSpeed)[0];
  const bestRoi = [...PROPERTIES_DATA].sort((a, b) => a.roiDays - b.roiDays)[0];
  const chopShopNote =
    rank >= 2
      ? ""
      : isEs
        ? "\n🛡️ Algunas propiedades de Port Gellhorn se revelan en el Capítulo 2."
        : "\n🛡️ Some Port Gellhorn properties are revealed in Chapter 2.";
  return (
    (isEs
      ? `🏎️ Vehículos y Propiedades: hay ${VEHICLES_DATA.length} vehículos y ${PROPERTIES_DATA.length} propiedades. El más rápido es el ${fastest.name} (${fastest.topSpeed} MPH, $${fastest.price.toLocaleString("en-US")}). La propiedad con mejor retorno es ${bestRoi.name.es} (${bestRoi.roiDays} días de ROI, +$${bestRoi.dailyIncome.toLocaleString("en-US")}/día). Cada propiedad añade espacios de garaje; usa el Planificador (Street Pass) para no pasarte de espacios.`
      : `🏎️ Vehicles & Properties: there are ${VEHICLES_DATA.length} vehicles and ${PROPERTIES_DATA.length} properties. The fastest is the ${fastest.name} (${fastest.topSpeed} MPH, $${fastest.price.toLocaleString("en-US")}). The best-ROI property is ${bestRoi.name.en} (${bestRoi.roiDays}-day ROI, +$${bestRoi.dailyIncome.toLocaleString("en-US")}/day). Every property adds garage slots; use the Planner (Street Pass) so you never run out of slots.`) +
    chopShopNote
  );
}

function helpReply(isEs: boolean): string {
  return isEs
    ? `🤖 Soy el Asesor de Leonida. Pregúntame por: 💰 rutas de dinero, 🏧 cajeros y autos raros, 🤝 fences, 🥚 Easter eggs (torre de radio, Dexter, OVNI, Cool Dog, Skunk Ape, Arthur Morgan), 🎮 trucos, ⚡ glitches o 🏎️ vehículos y propiedades. El mapa tiene ${LEONIDA_PINS.length} ubicaciones.`
    : `🤖 I'm the Leonida Advisor. Ask me about: 💰 money routes, 🏧 ATMs & rare cars, 🤝 fences, 🥚 Easter eggs (radio tower, Dexter, UFO, Cool Dog, Skunk Ape, Arthur Morgan), 🎮 cheats, ⚡ glitches or 🏎️ vehicles & properties. The map has ${LEONIDA_PINS.length} locations.`;
}

export function getBuiltInLeonidaReply(
  question: string,
  chapter: SpoilerChapter,
  lang: Language,
): string {
  const q = normalize(question);
  const isEs = lang === "es";
  const rank = CHAPTER_RANK[chapter] ?? 3;

  if (/^(hi|hello|hey|hola|buenas|help|ayuda)\b/.test(q) && q.split(/\s+/).length <= 3) {
    return helpReply(isEs);
  }

  if (/cheat|truco|codigo|cheatcode|d-?pad|combo/.test(q)) {
    return cheatsReply(rank, isEs);
  }

  if (/easter|egg|huevo|dexter|ufo|ovni|radio|tower|torre|bigfoot|skunk|cool dog|arthur|flamingo|flamenco|pie grande/.test(q)) {
    return easterEggReply(q, rank, isEs);
  }

  if (/glitch|exploit|\bbug\b|first.?person|primera persona|camara|camera|fisica|physics|airboat|hidrodeslizador|parche|patch/.test(q)) {
    return glitchesReply(rank, isEs);
  }

  if (/\batms?\b|cajero|walker|\brare\b|\braro|\braros\b|eclipse|free car|auto gratis|autos gratis/.test(q)) {
    return atmReply(isEs);
  }

  if (/money|dinero|cash|barn|granero|efectivo|ganar|rich|rico|loop|bucle/.test(q)) {
    return moneyReply(rank, isEs);
  }

  if (/fence|vender|vende|\bsell|jewelry|joyas|comprador|payout|tyrone|yasmani|dunk|moses|randy/.test(q)) {
    return fenceReply(rank, isEs);
  }

  if (/vehicle|vehiculo|\bcars?\b|\bautos?\b|carro|garage|garaje|propert|propiedad|slots|espacios|nightclub|supercar|moto|boat|bote|lancha|helicopter/.test(q)) {
    return vehiclesReply(rank, isEs);
  }

  return isEs
    ? `🤖 Consejo Táctico de Leonida: Guarda tus armas largas y bolsas de botín en el maletero de tu auto personal, usa WAiNK (Flecha Arriba + R1/RB) para escanear rastreadores GPS y revisa las ${LEONIDA_PINS.length} ubicaciones en la pestaña Mapa Táctico. Pregúntame también por trucos, glitches, vehículos o Easter eggs.`
    : `🤖 Leonida Tactical Tip: Store extra rifles and stash bags inside your personal car's trunk, use WAiNK (D-Pad Up + R1/RB) to check stolen cars for GPS trackers, and explore all ${LEONIDA_PINS.length} pins on the Tactical Map tab. You can also ask me about cheats, glitches, vehicles or Easter eggs.`;
}
