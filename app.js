// ==========================================
// 1. STATE, TIERS & FULL BILINGUAL ENGINE (EN / ES)
// ==========================================
let userTier = localStorage.getItem("gta6_tier") || "free";
let currentLang = localStorage.getItem("gta6_lang") || "en";
let currentPlatform = "PS5";
let currentSocialStyle = "tiktok";
let currentMapLayer = "ALL";
let userHandle = localStorage.getItem("gta6_user_handle") || "@VicePlayer";

const TIER_RANK = { free: 0, street: 1, kingpin: 2 };
function hasAccess(requiredTier) {
  return (TIER_RANK[userTier] || 0) >= (TIER_RANK[requiredTier] || 0);
}

const TRANSLATIONS = {
  en: {
    badge: "UNOFFICIAL FAN HUB",
    subtitle: "Leonida Tactical Hub & Lore Intel",
    tierLabel: "ACTIVE ACCESS TIER:",
    navCheats: "Cheats & Unlocks",
    navMap: "Leonida Tactical Map",
    navGlitches: "Glitches & Exploits",
    navForum: "Easter Eggs & Theories",
    navDb: "Vehicles & Economy",
    navMech: "New Mechanics Guide",
    navAi: "AI Mission Guide",
    proDesc: "One-time unlock for Full Money Map, Glitches Hub, Ad-Free & AI Advisor.",
    proBtn: "View One-Time Passes",
    legalNote: "Unofficial fan tool. Not affiliated with Rockstar Games or Take-Two Interactive.",
    cheatsTitle: "GTA VI Cheat Codes & Unlock Checklist",
    cheatsSub: "Visual PS5/Xbox controller inputs + step-by-step unlock requirements for every cheat.",
    unlockTab: "🔓 How to Unlock All",
    adSlot: "SPONSORED AD SLOT (Hidden automatically for Street Pass $1.99 & Kingpin VIP $4.99)",
    searchCheats: "Search cheats or challenges (e.g., $250,000, Shooting Range, Workouts, Flamingo)...",
    allCats: "All Categories (61 Total)",
    catPlayer: "Player & Stats",
    catCombat: "Combat & Weapons",
    catVehicles: "Spawn Vehicles",
    catWorld: "Environment & Filters",
    statusAll: "All Codes",
    statusVerified: "✓ Verified Button Combos",
    statusPending: "🔒 Challenge Known (Combo Hunting)",
    favOnly: "★ Favorites",
    mapTitle: "Interactive Leonida Tactical Map (32 Locations)",
    mapSub: "Fast money spots, hackable/towable ATMs, rare free vehicles, fences & 100% collectibles.",
    completionLabel: "100% Completion",
    chipAll: "🗺️ All (32)",
    chipMoney: "💰 Easy Money (8)",
    chipAtm: "🏧 Hackable ATMs (4)",
    chipCar: "🏎️ Rare Free Cars (4)",
    chipFence: "🤝 Fences (5)",
    chipEgg: "🥚 Easter Eggs (6)",
    chipColl: "🦩 Collectibles & Stunts (5)",
    allRegions: "All 6 Leonida Regions",
    hideFound: "Hide Found Pins",
    shareCardBtn: "📱 TikTok & IG Card",
    locationsTitle: "Leonida Locations",
    locationsSub: "Check off money spots, ATMs, rare cars & collectibles.",
    glitchTitle: "Active GTA VI Glitches & Exploits (Patch 01.002.001)",
    glitchSub: "Verified money loops, First-Person camera exploit & physics tricks tested on latest patch.",
    allGlitches: "All Glitches",
    glMoney: "💰 Money Loops",
    glCamera: "🎥 Camera & Visual",
    glStealth: "🚓 Wanted & Stealth",
    glPhysics: "🚀 Physics & Traversal",
    forumTitle: "Leonida Easter Eggs & Conspiracy Board",
    forumSub: "10 verified secrets + TikTok-style @username comments, ❤️ likes & animated GIF reactions.",
    postTheoryBtn: "+ Post New Theory",
    commentingAs: "Commenting & posting as:",
    saveHandleBtn: "Set @Username",
    theoryTitlePh: "Theory Headline...",
    theoryCoordsPh: "Location / Time (e.g., Kelly County • 2:00 AM)",
    theoryBodyPh: "Share your evidence or coordinates...",
    cancelBtn: "Cancel",
    publishBtn: "Publish to Board",
    searchForum: "Search Dexter, Paul Walker, Radio Tower, Bigfoot, UFO...",
    allTags: "All Mystery Tags",
    sortTop: "Sort: Top Upvoted",
    sortNew: "Sort: Newest First",
    dbTitle: "Leonida Vehicles, Properties & Economy",
    dbSub: "Buy properties to expand garage slots & passive income, then fill your garages with vehicles.",
    tabVehicles: "🏎️ Vehicles (24)",
    tabProperties: "🏢 Properties & Garages",
    plannerWorth: "Planned Asset Value",
    plannerIncome: "Daily Passive Income",
    plannerGarage: "Garage Slots (From Properties)",
    clearPlan: "Reset Plan",
    searchVeh: "Search vehicles (e.g., Cheetah, Banshee, Ganado, Airboat, Enduro)...",
    allClasses: "All Vehicle Classes",
    sortSpeed: "Sort: Top Speed",
    sortPriceLow: "Price: Low to High",
    sortPriceHigh: "Price: High to Low",
    mechTitle: "GTA VI New Mechanics & Player FAQ",
    mechSub: "Everything that changed from GTA V: Money laundering, car trunks, hacking tools & fitness.",
    aiTitle: "AI Leonida Mission & Loot Advisor",
    aiSub: "Spoiler-controlled tactical assistant in English & Español + TikTok & Instagram Card Studio.",
    geminiBtn: "⚙️ Connect Live Gemini API Key (Optional)",
    aiPlaceholder: "Ask anything about GTA VI missions, fences, safe codes, or collectibles...",
    aiSendBtn: "Ask Advisor ➤",
    modalTitle: "Choose Your ViceLink Access Tier",
    modalSub: "Pay once, keep forever. Supports Yappy, Punto Pago & International Cards.",
    addGarage: "+ Add to Garage Plan",
    inGarage: "✓ In Garage Plan",
    buyProp: "+ Buy Property & Garage",
    ownedProp: "✓ Owned in Empire"
  },
  es: {
    badge: "HUB NO OFICIAL DE FANS",
    subtitle: "Guía Táctica de Leonida y Secretos",
    tierLabel: "NIVEL DE ACCESO ACTIVO:",
    navCheats: "Trucos y Desbloqueos",
    navMap: "Mapa Táctico de Leonida",
    navGlitches: "Glitches y Trucos",
    navForum: "Easter Eggs y Teorías",
    navDb: "Vehículos y Economía",
    navMech: "Nuevas Mecánicas",
    navAi: "Guía IA de Misiones",
    proDesc: "Pago único para Mapa de Dinero, Glitches, Sin Anuncios y Guía IA.",
    proBtn: "Ver Pases de Pago Único",
    legalNote: "Herramienta no oficial de fans. Sin afiliación con Rockstar Games ni Take-Two Interactive.",
    cheatsTitle: "Trucos de GTA VI y Guía para Desbloquearlos",
    cheatsSub: "Botones visuales PS5/Xbox + explicación paso a paso de cómo desbloquear cada truco.",
    unlockTab: "🔓 Cómo Desbloquear Todos",
    adSlot: "ESPACIO PATROCINADO (Oculto automáticamente para Street Pass $1.99 y Kingpin VIP $4.99)",
    searchCheats: "Buscar trucos o desafíos (ej. $250,000, Campo de Tiro, Gimnasio, Flamenco)...",
    allCats: "Todas las Categorías (61 Total)",
    catPlayer: "Jugador y Estadísticas",
    catCombat: "Combate y Armas",
    catVehicles: "Generar Vehículos",
    catWorld: "Entorno y Filtros",
    statusAll: "Todos los Códigos",
    statusVerified: "✓ Combinaciones Verificadas",
    statusPending: "🔒 Desafío Conocido (Código en Búsqueda)",
    favOnly: "★ Favoritos",
    mapTitle: "Mapa Táctico de Leonida (32 Ubicaciones)",
    mapSub: "Zonas de dinero fácil, cajeros ATM hackeables, autos raros gratis, fences y coleccionables.",
    completionLabel: "Progreso 100%",
    chipAll: "🗺️ Todo (32)",
    chipMoney: "💰 Dinero Fácil (8)",
    chipAtm: "🏧 Cajeros ATM (4)",
    chipCar: "🏎️ Autos Raros Gratis (4)",
    chipFence: "🤝 Fences (5)",
    chipEgg: "🥚 Easter Eggs (6)",
    chipColl: "🦩 Coleccionables (5)",
    allRegions: "Las 6 Regiones de Leonida",
    hideFound: "Ocultar Encontrados",
    shareCardBtn: "📱 Tarjeta TikTok / IG",
    locationsTitle: "Ubicaciones de Leonida",
    locationsSub: "Marca zonas de dinero, ATMs, autos raros y coleccionables.",
    glitchTitle: "Glitches y Exploits Activos en GTA VI (Parche 01.002.001)",
    glitchSub: "Métodos de dinero infinito, cámara en primera persona y trucos verificados.",
    allGlitches: "Todos los Glitches",
    glMoney: "💰 Dinero Infinito",
    glCamera: "🎥 Cámara y Visual",
    glStealth: "🚓 Policía y Sigilo",
    glPhysics: "🚀 Física y Saltos",
    forumTitle: "Foro de Easter Eggs y Conspiraciones de Leonida",
    forumSub: "10 secretos verificados + comentarios estilo TikTok con @usuario, ❤️ likes y GIFs animados.",
    postTheoryBtn: "+ Publicar Nueva Teoría",
    commentingAs: "Comentando y publicando como:",
    saveHandleBtn: "Guardar @Usuario",
    theoryTitlePh: "Título de tu teoría...",
    theoryCoordsPh: "Ubicación / Hora (ej. Condado Kelly • 2:00 AM)",
    theoryBodyPh: "Comparte tus pruebas, ubicación o teoría...",
    cancelBtn: "Cancelar",
    publishBtn: "Publicar en el Foro",
    searchForum: "Buscar Dexter, Paul Walker, Torre de Radio, Pie Grande, OVNI...",
    allTags: "Todas las Etiquetas",
    sortTop: "Ordenar: Más Votadas",
    sortNew: "Ordenar: Más Recientes",
    dbTitle: "Vehículos, Propiedades y Economía de Leonida",
    dbSub: "Compra propiedades para ganar espacios de garaje e ingresos diarios, y guarda tus autos.",
    tabVehicles: "🏎️ Vehículos (24)",
    tabProperties: "🏢 Propiedades y Garajes",
    plannerWorth: "Valor Total del Plan",
    plannerIncome: "Ingreso Pasivo Diario",
    plannerGarage: "Espacios de Garaje",
    clearPlan: "Reiniciar Plan",
    searchVeh: "Buscar vehículos (ej. Cheetah, Banshee, Ganado, Airboat, Enduro)...",
    allClasses: "Todas las Clases",
    sortSpeed: "Ordenar: Velocidad Máx.",
    sortPriceLow: "Precio: Menor a Mayor",
    sortPriceHigh: "Precio: Mayor a Menor",
    mechTitle: "Nuevas Mecánicas de GTA VI y Preguntas Frecuentes",
    mechSub: "Todo lo que cambió respecto a GTA V: lavado de dinero, maleteros, hackeo de autos y físico.",
    aiTitle: "Asesor IA de Misiones y Botín en Leonida",
    aiSub: "Asistente táctico sin spoilers en Español e Inglés + Estudio de Tarjetas para TikTok e Instagram.",
    geminiBtn: "⚙️ Conectar API Key de Gemini (Opcional)",
    aiPlaceholder: "Pregunta sobre misiones, fences, códigos de cajas fuertes o coleccionables...",
    aiSendBtn: "Preguntar ➤",
    modalTitle: "Elige tu Pase de Acceso Único ViceLink",
    modalSub: "Paga una vez, úsalo para siempre. Compatible con Yappy, Punto Pago y Tarjetas.",
    addGarage: "+ Añadir al Garaje",
    inGarage: "✓ En tu Garaje",
    buyProp: "+ Comprar Propiedad y Garaje",
    ownedProp: "✓ En tu Imperio"
  }
};

// ==========================================
// 2. DATA SETS (CHEATS, 32 MAP PINS, GLITCHES, 10 EASTER EGGS, VEHICLES)
// ==========================================
const CHEATS_DATA = [
  { id: "cash-250k", title: { en: "+$250,000 Instant Cash", es: "+$250,000 Dinero Instantáneo" }, category: "Player", unlock: { en: "Finish all 91 story missions", es: "Completa las 91 misiones de la historia" }, howToUnlock: { en: "Beat the main storyline (91 missions). Open Pause > Progress > Cheats. Only money cheat in GTA 6.", es: "Termina la historia principal (91 misiones). Abre Pausa > Progreso > Trucos. Es el único truco de dinero." }, desc: { en: "Immediately deposits $250,000 into your active character's balance.", es: "Deposita $250,000 inmediatamente en la cuenta de tu personaje activo." }, seq: ["UP", "RIGHT", "DOWN", "LEFT", "UP", "LEFT", "DOWN", "RIGHT"] },
  { id: "unlimited-focus", title: { en: "Unlimited Focus Ability", es: "Habilidad Focus Ilimitada" }, category: "Player", unlock: { en: "Finish the main story campaign", es: "Termina la campaña principal" }, howToUnlock: { en: "Beat the final story mission. Jason and Lucia's tactical Focus meter never drains.", es: "Completa la última misión. La barra táctica Focus de Jason y Lucía nunca se agota." }, desc: { en: "Prevents your tactical focus meter from draining during combat and driving.", es: "Evita que el medidor táctico Focus se gaste al disparar o conducir." }, seq: ["DOWN", "UP", "UP", "DOWN", "UP", "DOWN", "UP", "DOWN", "UP", "RIGHT"] },
  { id: "body-armor", title: { en: "Full Body Armor Loadout", es: "Blindaje Corporal Completo" }, category: "Player", unlock: { en: "Complete 100 gym / beach workouts", es: "Completa 100 entrenamientos en gimnasio" }, howToUnlock: { en: "Visit Muscle Sands outdoor gym on Ocean Beach or any fitness club and complete 100 sets.", es: "Visita el gimnasio de Ocean Beach o cualquier club deportivo y haz 100 series de ejercicio." }, desc: { en: "Equips maximum heavy ballistic armor immediately.", es: "Equipa el chaleco antibalas pesado al máximo al instante." }, seq: ["DOWN", "UP", "LEFT", "UP", "UP", "UP", "UP", "UP", "DOWN", "DOWN"] },
  { id: "raise-heat", title: { en: "Raise Map Heat Level", es: "Aumentar Nivel de Calor Regional" }, category: "Player", unlock: { en: "Lose a 3-star wanted level 25 times", es: "Escapa de 3 estrellas de policía 25 veces" }, howToUnlock: { en: "Trigger a 3-star LCPD pursuit and escape out of the search cone 25 times.", es: "Provoca una persecución policial de 3 estrellas y escapa 25 veces." }, desc: { en: "Pushes your regional heat level higher across Leonida.", es: "Aumenta la alerta policial regional en toda Leonida." }, seq: ["LEFT", "DOWN", "RIGHT", "DOWN", "UP", "DOWN", "UP"] },
  { id: "raise-wanted", title: { en: "Raise Wanted Level (+1 Star)", es: "Subir Nivel de Búsqueda (+1 Estrella)" }, category: "Player", unlock: { en: "Lose a 3-star wanted level 50 times", es: "Escapa de 3 estrellas de policía 50 veces" }, howToUnlock: { en: "Escape 50 separate 3-star police chases (Pay 'n' Spray speeds this up).", es: "Escapa de 50 persecuciones de 3 estrellas (pintar el auto en Pay 'n' Spray acelera esto)." }, desc: { en: "Immediately escalates LCPD police pursuit intensity.", es: "Aumenta inmediatamente las estrellas de búsqueda policial." }, seq: ["LEFT", "DOWN", "RIGHT", "DOWN", "UP", "RIGHT", "UP"] },
  { id: "max-ammo", title: { en: "Max Ammo (All Weapons)", es: "Munición Máxima (Todas las Armas)" }, category: "Combat", unlock: { en: "Win 25 Bronze medals at shooting ranges", es: "Gana 25 medallas de Bronce en campos de tiro" }, howToUnlock: { en: "Visit gun club shooting ranges and score at least Bronze in 25 weapon trials.", es: "Visita los campos de tiro y logra al menos Bronce en 25 pruebas de armas." }, desc: { en: "Fills ammunition reserves for every weapon in your wheel.", es: "Llena al máximo las balas de todas tus armas." }, seq: ["DOWN", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "UP", "DOWN", "LEFT"] },
  { id: "infinite-ammo", title: { en: "Infinite Ammo", es: "Munición Infinita" }, category: "Combat", unlock: { en: "Win 25 Silver medals at shooting ranges", es: "Gana 25 medallas de Plata en campos de tiro" }, howToUnlock: { en: "Score Silver or higher across 25 shooting range challenges.", es: "Consigue medalla de Plata o superior en 25 desafíos de tiro." }, desc: { en: "Weapons never consume reserve ammunition when firing.", es: "Tus armas nunca gastan munición de reserva al disparar." }, seq: ["DOWN", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "DOWN", "DOWN", "DOWN"] },
  { id: "no-reload", title: { en: "No Reload (Bottomless Clip)", es: "Sin Recarga (Cargador Infinito)" }, category: "Combat", unlock: { en: "Win 25 Gold medals at shooting ranges", es: "Gana 25 medallas de Oro en campos de tiro" }, howToUnlock: { en: "Achieve Gold medal accuracy/speed scores in 25 shooting range trials.", es: "Logra medalla de Oro en precisión y velocidad en 25 pruebas de tiro." }, desc: { en: "Fire continuously without ever pausing to reload magazines.", es: "Dispara sin parar sin tener que recargar nunca el cargador." }, seq: ["DOWN", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "DOWN", "DOWN", "UP"] },
  { id: "attack-force", title: { en: "Super Attack Force", es: "Súper Fuerza de Impacto" }, category: "Combat", unlock: { en: "Finish the main story campaign", es: "Completa la historia principal" }, howToUnlock: { en: "Complete all 91 story missions to unlock super-knockback melee and gunfire.", es: "Termina las 91 misiones para desbloquear golpes y disparos explosivos." }, desc: { en: "Melee strikes and bullets send targets flying across the street.", es: "Los golpes cuerpo a cuerpo y balas lanzan a los enemigos por los aires." }, seq: ["DOWN", "UP", "LEFT", "LEFT", "RIGHT", "DOWN", "DOWN", "UP", "DOWN"] },
  { id: "exploding-balls", title: { en: "Exploding Sports Balls", es: "Balones Deportivos Explosivos" }, category: "Combat", unlock: { en: "Hit 20 enemies with explosive damage", es: "Golpea a 20 enemigos con explosivos" }, howToUnlock: { en: "Damage 20 enemies using grenades, RPGs, or sticky bombs.", es: "Daña a 20 enemigos usando granadas, lanzacohetes o bombas adhesivas." }, desc: { en: "Basketballs and beach balls detonate like grenades on impact.", es: "Los balones de baloncesto y playa explotan como granadas al chocar." }, seq: ["DOWN", "UP", "LEFT", "LEFT", "RIGHT", "DOWN", "DOWN", "UP", "RIGHT"] },
  { id: "vehicle-force", title: { en: "Super Vehicle Ram Force", es: "Súper Impacto de Vehículos" }, category: "Combat", unlock: { en: "Eliminate 25 enemies with a vehicle", es: "Elimina 25 enemigos con un vehículo" }, howToUnlock: { en: "Run over or ram 25 hostile enemies using any car or truck.", es: "Atropella o embiste a 25 enemigos hostiles con cualquier auto." }, desc: { en: "Anything your vehicle collides with launches into the air.", es: "Cualquier vehículo que choques saldrá volando por los aires." }, seq: ["DOWN", "UP", "LEFT", "LEFT", "RIGHT", "DOWN", "LEFT", "UP", "DOWN"] },
  { id: "spawn-boomazoom", title: { en: "Spawn Maibatsu Boomazoom", es: "Generar Maibatsu Boomazoom" }, category: "Vehicles", unlock: { en: "Complete 5 Shopping Challenges", es: "Completa 5 Desafíos de Compras" }, howToUnlock: { en: "Buy clothing and gear across 5 different Vice City & Port Gellhorn stores.", es: "Compra ropa y accesorios en 5 tiendas distintas de Vice City y Port Gellhorn." }, desc: { en: "Spawns a compact Maibatsu Boomazoom directly beside you.", es: "Genera un auto compacto Maibatsu Boomazoom justo a tu lado." }, seq: ["LEFT", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "LEFT"] },
  { id: "spawn-pumper", title: { en: "Spawn MTL Fire Pumper", es: "Generar Camión de Bomberos MTL" }, category: "Vehicles", unlock: { en: "Discover MTL Pumper in Progress menu", es: "Descubre el camión MTL en Progreso" }, howToUnlock: { en: "Drive an MTL Fire Truck once in free roam so it registers in Progress > Vehicles.", es: "Conduce un camión de bomberos una vez para registrarlo en Progreso > Vehículos." }, desc: { en: "Spawns a heavy fire truck with a working water cannon.", es: "Genera un camión de bomberos con cañón de agua funcional." }, seq: ["LEFT", "UP", "RIGHT", "DOWN", "LEFT", "RIGHT", "RIGHT", "UP"] },
  { id: "spawn-bulldozer", title: { en: "Spawn HVY Bulldozer", es: "Generar Excavadora HVY Bulldozer" }, category: "Vehicles", unlock: { en: "Discover HVY Bulldozer in Progress menu", es: "Descubre la excavadora HVY en Progreso" }, howToUnlock: { en: "Enter an HVY Bulldozer at a Vice City or Ambrosia construction site.", es: "Sube a una excavadora HVY en una obra de Vice City o Ambrosia." }, desc: { en: "Spawns an industrial yellow construction bulldozer.", es: "Genera una excavadora industrial amarilla de construcción." }, seq: ["LEFT", "UP", "RIGHT", "DOWN", "LEFT", "RIGHT", "RIGHT", "DOWN"] },
  { id: "spawn-flamingo", title: { en: "Spawn Inflatable Flamingo", es: "Generar Flamenco Inflable" }, category: "Vehicles", unlock: { en: "Destroy all 50 Cocaine Flamingos", es: "Destruye los 50 Flamencos de Cocaína" }, howToUnlock: { en: "Find and shoot all 50 hidden pink Cocaine Flamingos across Leonida's 6 regions.", es: "Encuentra y dispara a los 50 flamencos rosas ocultos en las 6 regiones de Leonida." }, desc: { en: "Spawns a rideable giant pink pool flamingo.", es: "Genera un flamenco rosa inflable gigante que puedes conducir." }, seq: [] },
  { id: "cycle-weather", title: { en: "Cycle Leonida Weather", es: "Cambiar Clima de Leonida" }, category: "World", unlock: { en: "Finish the main story / Reveal 100% map", es: "Termina la historia / Revela 100% del mapa" }, howToUnlock: { en: "Beat the story or uncover 100% of the Leonida map.", es: "Completa la historia o descubre todo el mapa de Leonida." }, desc: { en: "Cycles through Vice Sun, Tropical Storm, Overcast, and Sunset.", es: "Alterna entre sol de Vice City, tormenta tropical, nublado y atardecer." }, seq: ["DOWN", "RIGHT", "UP", "DOWN", "RIGHT", "UP", "RIGHT"] },
  { id: "filter-cataclysm", title: { en: "Screen Filter: Cataclysm", es: "Filtro de Pantalla: Cataclismo" }, category: "World", unlock: { en: "Discover Martha's Vamos in Progress menu", es: "Descubre el Vamos de Martha en Progreso" }, howToUnlock: { en: "Locate Martha's custom Declasse Vamos in the world to register it.", es: "Encuentra el Declasse Vamos personalizado de Martha en el mapa." }, desc: { en: "Covers Leonida in dark, apocalyptic murky smoke.", es: "Cubre Leonida con una atmósfera oscura y humo apocalíptico." }, seq: ["DOWN", "DOWN", "UP", "RIGHT", "RIGHT", "UP", "LEFT", "LEFT", "RIGHT", "RIGHT"] },
  { id: "filter-dollhouse", title: { en: "Screen Filter: Dollhouse", es: "Filtro de Pantalla: Casa de Muñecas" }, category: "World", unlock: { en: "Hang out with your partner for 8 hours", es: "Sal con tu pareja durante 8 horas en el juego" }, howToUnlock: { en: "Invite Jason or Lucia on free-roam hangouts for 8 cumulative in-game hours.", es: "Invita a Jason o Lucía a actividades libres durante 8 horas acumuladas." }, desc: { en: "Applies hyper-saturated miniature colors in a narrow frame.", es: "Aplica colores hiper-saturados estilo miniatura." }, seq: ["DOWN", "DOWN", "UP", "RIGHT", "RIGHT", "UP", "LEFT", "LEFT", "DOWN", "RIGHT"] },
  { id: "filter-faded", title: { en: "Screen Filter: Faded Glory (CRT)", es: "Filtro de Pantalla: Gloria Pasada (CRT)" }, category: "World", unlock: { en: "Rob 50 stores with your partner", es: "Roba 50 tiendas junto a tu pareja" }, howToUnlock: { en: "Bring your partner along and hold up 50 stores across Leonida.", es: "Lleva a tu pareja y asalta 50 tiendas o casas de empeño en Leonida." }, desc: { en: "Applies a retro 1980s Vice City CRT television visual filter.", es: "Aplica un filtro retro de televisor CRT de los años 80." }, seq: ["DOWN", "DOWN", "UP", "RIGHT", "RIGHT", "UP", "LEFT", "LEFT", "LEFT", "RIGHT"] }
];

// 32 UNIFIED MAP PINS (Easy Money, Hackable ATMs, Rare Free Cars, Fences, Easter Eggs & Collectibles)
const LEONIDA_PINS = [
  // Free Starter Pins (10 Pins)
  { id: "rc1", tier: "free", name: { en: "🏎️ Paul Walker's Green Mitsubishi Eclipse (FREE)", es: "🏎️ Mitsubishi Eclipse Verde de Paul Walker (GRATIS)" }, region: "Vice City", type: "RareCar", icon: "🏎️", x: 71, y: 63, note: { en: "Vespucci Island villa garage: disable wall alarm and claim the Fast & Furious replica for $0!", es: "Garaje en Vespucci Island: desactiva la alarma de la pared y llévate gratis la réplica de Rápido y Furioso." } },
  { id: "rc2", tier: "free", name: { en: "🏎️ '67 Vapid Dominator Off-Road Buggy (FREE)", es: "🏎️ Buggy Todoterreno '67 Vapid Dominator (GRATIS)" }, region: "Vice City", type: "RareCar", icon: "🏎️", x: 75, y: 49, note: { en: "Paradise Garage, Watson Bay: lifted swamp/dune racer ready to store.", es: "Paradise Garage, Watson Bay: todoterreno elevado listo para guardar en tu garaje." } },
  { id: "atm1", tier: "free", name: { en: "🏧 Ocean Drive Payday & Wall ATMs", es: "🏧 Cajeros ATM de Pared y Casas de Empeño (Ocean Drive)" }, region: "Vice City", type: "ATM", icon: "🏧", x: 78, y: 59, note: { en: "Use a tow-truck winch or WAiNK hack tool to crack wall ATMs for quick cash & Marked Bills.", es: "Usa una grúa o el hackeo WAiNK para abrir cajeros ATM y sacar billetes rápidos." } },
  { id: "p1", tier: "free", name: { en: "🦩 Cocaine Flamingo #1 (Ocean Beach)", es: "🦩 Flamenco de Cocaína #1 (Ocean Beach)" }, region: "Vice City", type: "Collectible", icon: "🦩", x: 79, y: 56, note: { en: "Behind the Art Deco lifeguard tower on Ocean Drive. Destroy all 50 for Inflatable Flamingo.", es: "Detrás de la torre de salvavidas Art Déco en Ocean Drive." } },
  { id: "p3", tier: "free", name: { en: "🥚 Radio Tower Bird's Nest Easter Egg", es: "🥚 Nido de Huevos de Pascua (Torre de Radio)" }, region: "Vice City", type: "EasterEgg", icon: "🥚", x: 65, y: 57, note: { en: "Climb the tallest Vice City radio tower (6 min climb) and throw a painted egg for a secret cutscene!", es: "Sube la torre de radio más alta de Vice City (6 min) y lanza un huevo pintado para ver una cinemática secreta." } },
  { id: "p4", tier: "free", name: { en: "🥚 Dexter Morgan's Trinity Apartments", es: "🥚 Apartamentos Trinity de Dexter Morgan" }, region: "Vice City", type: "EasterEgg", icon: "🥚", x: 76, y: 51, note: { en: "Washington Island: Roof has tape, rope & syringe kill kit + Slice of Life boat docked below.", es: "Washington Island: En la azotea hay cinta, cuerda y jeringa + su barco 'Slice of Life' en el muelle." } },
  { id: "p6", tier: "free", name: { en: "🥚 Cool Dog (Jet-Ski Rescue & $1,200 Island)", es: "🥚 Cool Dog (Perro en Moto de Agua e Isla $1,200)" }, region: "Leonida Keys", type: "EasterEgg", icon: "🥚", x: 49, y: 86, note: { en: "Swim in Gambit Bay without a boat—a dog in a life vest rescues you and leads to $1,200!", es: "Nada en Gambit Bay sin bote: un perro con chaleco salvavidas te rescata y te lleva a $1,200." } },
  { id: "p7", tier: "free", name: { en: "🃏 Arthur Morgan's Hat (Port Gellhorn Yard Sale)", es: "🃏 Sombrero de Arthur Morgan (Venta de Patio)" }, region: "Port Gellhorn", type: "Collectible", icon: "🃏", x: 25, y: 37, note: { en: "South Port Gellhorn yard sale: buy the RDR2 cowboy hat on the guitar case for $35.", es: "Venta de patio al sur de Port Gellhorn: compra el sombrero de RDR2 por $35." } },
  { id: "p8", tier: "free", name: { en: "🥚 Cottonmouth Lake Skunk Ape (Bigfoot)", es: "🥚 Skunk Ape / Pie Grande (Lago Cottonmouth)" }, region: "Grassrivers", type: "EasterEgg", icon: "🥚", x: 49, y: 63, note: { en: "South of Hamlet: catch Bigfoot on a dirt road and unlock Kirk's hunter questline.", es: "Al sur de Hamlet: encuentra a Pie Grande y desbloquea las misiones de Kirk." } },
  { id: "p16", tier: "free", name: { en: "🔥 Kalaga Canyon Stunt Ramp", es: "🔥 Rampa Acrobática Cañón Kalaga" }, region: "Mount Kalaga", type: "Collectible", icon: "🔥", x: 35, y: 19, note: { en: "Launch across the northern gorge in an off-road 4x4.", es: "Salta sobre el desfiladero norte en un vehículo 4x4." } },

  // Street Pass ($1.99+) Easy Money, Hackable ATMs, Rare Cars & Fences (22 Pins)
  { id: "m1", tier: "street", name: { en: "💰 Apollo Aggregates Red Barn (Infinite Money)", es: "💰 Granero Rojo Apollo Aggregates (Dinero Infinito)" }, region: "Ambrosia", type: "Money", icon: "💰", x: 59, y: 47, note: { en: "East of Hamlet: load 10-slot van with stash bags + safe (~$40k/run), switch character to respawn loot!", es: "Al este de Hamlet: llena una van de 10 espacios con bolsas + caja fuerte (~$40k/viaje) y cambia de personaje para reiniciar." } },
  { id: "m2", tier: "street", name: { en: "💰 Key Lento Sunken Treasure (Kenton's Scanner)", es: "💰 Tesoro Hundido de Key Lento (Escáner Kenton)" }, region: "Leonida Keys", type: "Money", icon: "💰", x: 31, y: 94, note: { en: "Dive reefs around Key Lento with Kenton's scanner for underwater artifacts worth tens of thousands.", es: "Bucea en los arrecifes de Key Lento con el escáner de Kenton para hallar reliquias de miles de dólares." } },
  { id: "m3", tier: "street", name: { en: "💰 Exotic Animals Front (Illegal Gang Op)", es: "💰 Fachada de Animales Exóticos (Operación Banda)" }, region: "Leonida Keys", type: "Money", icon: "💰", x: 41, y: 91, note: { en: "Sneak through rear wall, crack safe & grab narcotics. Sell to Brian/Donnie (Ch. 1) or Dunk (Ch. 2).", es: "Entra por el muro trasero, abre la caja fuerte y vende la mercancía a Brian/Donnie (Cap. 1) o Dunk (Cap. 2)." } },
  { id: "m4", tier: "street", name: { en: "💰 La Cascara Motel Gang Hideout", es: "💰 Escondite de Banda Motel La Cascara" }, region: "Port Gellhorn", type: "Money", icon: "💰", x: 24, y: 42, note: { en: "Early Ch. 2 gang stash—clear backroom safe and haul narcotics straight to Dunk's Trailer.", es: "Alijo de banda en Cap. 2: limpia la caja fuerte trasera y lleva las bolsas al tráiler de Dunk." } },
  { id: "m5", tier: "street", name: { en: "💰 Capri Ocean Beach Jewelry Smash & Grab", es: "💰 Robo a Joyería Capri (Ocean Beach)" }, region: "Vice City", type: "Money", icon: "💰", x: 77, y: 54, note: { en: "Disable alarm in backroom, smash display cases ($15k–$25k), and deliver to Yasmani.", es: "Desactiva la alarma trasera, rompe vitrinas ($15k–$25k) y entrégalas a Yasmani." } },
  { id: "m6", tier: "street", name: { en: "💰 Vice City Bank Vault Loop (~$205k / 5 min)", es: "💰 Bucle Bóveda Bancaria Vice City (~$205k / 5 min)" }, region: "Vice City", type: "Money", icon: "💰", x: 67, y: 55, note: { en: "Buy security-van tip from Yasmani, tail armored truck to vault window, grab Marked Bills & escape on bike.", es: "Compra pistas a Yasmani, sigue el camión blindado al banco, toma billetes marcados y escapa en moto." } },
  { id: "m7", tier: "street", name: { en: "💰 Armored Security Van Ambush (US-1)", es: "💰 Emboscada a Camión Blindado (Autopista US-1)" }, region: "Ambrosia", type: "Money", icon: "💰", x: 52, y: 34, note: { en: "Use sticky bombs on rear doors of Gruppe Sechs vans for $18,000–$30,000 instant cash cases.", es: "Usa bombas adhesivas en las puertas traseras de furgones blindados para $18,000–$30,000 rápidos." } },
  { id: "m8", tier: "street", name: { en: "💰 Randy's Exotic Car Wish List Drop", es: "💰 Entrega de Superautos de Randy (Balsero)" }, region: "Vice City", type: "Money", icon: "💰", x: 71, y: 67, note: { en: "Deliver high-end target sports/supercars to Randy in Balsero for massive payout bonuses.", es: "Entrega autos exóticos de la lista a Randy en Balsero para bonificaciones enormes." } },
  { id: "atm2", tier: "street", name: { en: "🏧 Little Cuba Alley ATM & Pawn Cluster", es: "🏧 Cajeros ATM Hackeables de Little Cuba" }, region: "Vice City", type: "ATM", icon: "🏧", x: 69, y: 60, note: { en: "3 wall-mounted ATMs in a single block—rip with winch truck or bypass with WAiNK phone scanner.", es: "3 cajeros ATM en la misma cuadra: arráncalos con grúa o hackéalos con el escáner WAiNK." } },
  { id: "atm3", tier: "street", name: { en: "🏧 Port Gellhorn 24/7 Gas Station ATM", es: "🏧 Cajero ATM Gasolinera 24/7 (Port Gellhorn)" }, region: "Port Gellhorn", type: "ATM", icon: "🏧", x: 26, y: 39, note: { en: "Low police response zone—ideal for early-game ATM winch farming.", es: "Zona con poca presencia policial: ideal para farmear cajeros ATM al inicio." } },
  { id: "atm4", tier: "street", name: { en: "🏧 Leonida Keys Marina Dual ATMs", es: "🏧 Cajeros ATM Dobles Marina Leonida Keys" }, region: "Leonida Keys", type: "ATM", icon: "🏧", x: 46, y: 89, note: { en: "Crack both dockside ATMs and escape immediately by speedboat.", es: "Abre ambos cajeros del muelle y escapa al instante en lancha rápida." } },
  { id: "rc3", tier: "street", name: { en: "🏎️ Vintage '55 Vapid Stanier (Shore Court)", es: "🏎️ Clásico '55 Vapid Stanier (Shore Court)" }, region: "Vice City", type: "RareCar", icon: "🏎️", x: 78, y: 62, note: { en: "Rare collector sedan stored at Shore Court Garage in Ocean Beach.", es: "Sedán clásico de colección guardado en Shore Court Garage, Ocean Beach." } },
  { id: "rc4", tier: "street", name: { en: "🏎️ Custom Panther / POACH Swamp Airboat", es: "🏎️ Hidrodeslizador Panther / POACH (Grassrivers)" }, region: "Grassrivers", type: "RareCar", icon: "🏎️", x: 55, y: 69, note: { en: "Free fan-driven swamp airboat docked at Pelican Valley pier.", es: "Hidrodeslizador gratis atracado en el muelle de Pelican Valley." } },
  { id: "f1", tier: "street", name: { en: "🤝 Fence: Brian's Lockup (Keypad: 7700)", es: "🤝 Comprador: Depósito de Brian (Código: 7700)" }, region: "Leonida Keys", type: "Fence", icon: "🤝", x: 38, y: 92, note: { en: "South Key Lento (Ch. 1). Keypad code 7700. Buys early narcotics/cash before Ch. 2.", es: "Sur de Key Lento (Cap. 1). Código 7700. Compra narcóticos y efectivo antes del Cap. 2." } },
  { id: "f2", tier: "street", name: { en: "🤝 Fence: Moses 'Mo' Watkins (Car Chop-Shop)", es: "🤝 Comprador: Moses Watkins (Taller de Autos)" }, region: "Port Gellhorn", type: "Fence", icon: "🤝", x: 22, y: 34, note: { en: "Unlocks Slim Jim tool in Ch. 2. Registers stolen vans/cars or buys clean cars ($1,000+ each).", es: "Desbloquea la ganzúa Slim Jim en Cap. 2. Registra vans robadas o compra autos limpios ($1,000+ c/u)." } },
  { id: "f3", tier: "street", name: { en: "🤝 Fence: Dunk's Trailer (Ch. 2 Narcotics)", es: "🤝 Comprador: Tráiler de Dunk (Narcóticos Cap. 2)" }, region: "Port Gellhorn", type: "Fence", icon: "🤝", x: 28, y: 46, note: { en: "South Port Gellhorn. Drop stash bags in his trunk after mission 'Slam Dunk'.", es: "Sur de Port Gellhorn. Deposita bolsas en el maletero de su auto tras la misión 'Slam Dunk'." } },
  { id: "f4", tier: "street", name: { en: "🤝 Fence: Tyrone (HIGHEST Narcotics Payout)", es: "🤝 Comprador: Tyrone (PAGO MÁXIMO Narcóticos)" }, region: "Vice City", type: "Fence", icon: "🤝", x: 66, y: 52, note: { en: "La Perle, Vice City (Ch. 3). Pays the highest rate in Leonida for cocaine/narcotics bags.", es: "La Perle, Vice City (Cap. 3). Paga la tarifa más alta de toda Leonida por bolsas de narcóticos." } },
  { id: "f5", tier: "street", name: { en: "🤝 Fence: Yasmani (HIGHEST Jewelry & Vault Tips)", es: "🤝 Comprador: Yasmani (PAGO MÁXIMO Joyas)" }, region: "Vice City", type: "Fence", icon: "🤝", x: 68, y: 61, note: { en: "Little Cuba, Vice City (Ch. 3). Best buyer for Jewelry & Marked Bills + sells Bank Vault tips.", es: "Little Cuba, Vice City (Cap. 3). El mejor comprador de joyas y billetes marcados + vende datos de bancos." } },
  { id: "p14", tier: "street", name: { en: "🥚 Kelly County 2:00 AM UFO Abduction", es: "🥚 Abducción OVNI Condado Kelly (2:00 AM)" }, region: "Ambrosia", type: "EasterEgg", icon: "🥚", x: 44, y: 24, note: { en: "NW of Starlet Motel after 2 AM: follow flashing car into woods to trigger UFO abduction trophy!", es: "Al noroeste del Starlet Motel tras las 2 AM: sigue el auto con luces al bosque para el trofeo OVNI." } },
  { id: "p15", tier: "street", name: { en: "🥚 Manifest Canyon Four-Horse Mystery Statue", es: "🥚 Estatua Misteriosa de 4 Caballos (Manifest Canyon)" }, region: "Mount Kalaga", type: "EasterEgg", icon: "🥚", x: 41, y: 15, note: { en: "Statue with strange glyphs & traffic cone triggers controller vibrations and beeping signals.", es: "Estatua con glifos raros y un cono que activa vibraciones y pitidos en el control." } },
  { id: "c1", tier: "street", name: { en: "🔥 Calle Ocho Rooftop Stunt Jump", es: "🔥 Salto Acrobático Azotea Calle Ocho" }, region: "Vice City", type: "Collectible", icon: "🔥", x: 70, y: 58, note: { en: "Hit the construction ramp at 110+ mph over Little Cuba.", es: "Toma la rampa de construcción a más de 110 mph sobre Little Cuba." } },
  { id: "c2", tier: "street", name: { en: "🃏 WAiNK Space Debris #4 (Ambrosia)", es: "🃏 Restos Espaciales WAiNK #4 (Ambrosia)" }, region: "Ambrosia", type: "Collectible", icon: "🃏", x: 54, y: 40, note: { en: "Scan all space debris with WAiNK to unlock the Powdered Sugar filter.", es: "Escanea todos los restos espaciales con WAiNK para desbloquear el filtro." } }
];

const GLITCHES_DATA = [
  {
    id: "g1", category: "Money",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: { en: "Apollo Aggregates Red Barn Unlimited Money Loop (~$40k–$89k / Run)", es: "Bucle de Dinero Infinito Granero Rojo Apollo Aggregates (~$40k–$89k / Viaje)" },
    votes: 842,
    warning: { en: "Chapter 1 Warning: Cash on hand & standard BuckMe funds get wiped at the end of Ch. 1 ('Tourist Trap'). Deposit into BuckMe Savings or farm from Chapter 2 onward!", es: "Aviso Cap. 1: El efectivo en mano se reinicia al final del Cap. 1 ('Tourist Trap'). Deposita en tu Cuenta de Ahorros BuckMe o hazlo desde el Cap. 2." },
    steps: {
      en: [
        "Steal a 10-slot delivery van outside Apollo Aggregates (red warehouse east of Hamlet) and register it at Moses or Pay 'n' Spray.",
        "Back the van up to the barn entrance. Loot the Teddy-Bear van outside, the second van inside, the cocaine on the office table, and break open the office safe.",
        "Stow all stash bags into your van's storage slots (look for the '+1' drop-off confirmation).",
        "Instant Reset Trick: Switch from Lucia to Jason (far from the barn), then switch right back to Lucia—or Save & Reload. All loot respawns immediately!",
        "Sell to Tyrone (La Perle, Vice City) for maximum payout or Dunk (Port Gellhorn)."
      ],
      es: [
        "Roba una van de reparto de 10 espacios frente a Apollo Aggregates (almacén rojo al este de Hamlet) y regístrala en Moses o Pay 'n' Spray.",
        "Estaciona la van de reversa en la entrada del granero. Saquea la van de ositos afuera, la segunda van adentro, la mesa de la oficina y la caja fuerte.",
        "Guarda todas las bolsas en los espacios de carga de tu van (verifica la confirmación '+1').",
        "Truco de Reinicio Instantáneo: Cambia de Lucía a Jason (lejos del granero) y vuelve a Lucía, o guarda y recarga. ¡Todo el botín reaparece al instante!",
        "Vende todo a Tyrone (La Perle, Vice City) para ganar el pago máximo o a Dunk (Port Gellhorn)."
      ]
    }
  },
  {
    id: "g2", category: "Camera",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: { en: "True First-Person Camera Mode Glitch (PS5 & Xbox)", es: "Glitch de Cámara en Primera Persona Real (PS5 y Xbox)" },
    votes: 619,
    warning: { en: "GTA 6 did not ship with a toggleable first-person option—this timing trick locks the camera into true first-person until you reload.", es: "GTA 6 no trae modo primera persona nativo; este truco bloquea la cámara en primera persona real hasta que recargues partida." },
    steps: {
      en: [
        "Open Pause > Settings > Controller and change 'Touch Pad Button' (PS5) or 'View Button' (Xbox) from Map to Camera.",
        "Sit in the driver's seat of any vehicle and press D-Pad Up to pull out your phone.",
        "Press Circle (PS5) or B (Xbox) to put the phone away, and immediately spam the Touchpad / View button while the phone lowers.",
        "Exit the vehicle—your camera is now locked in full First-Person view on foot and driving."
      ],
      es: [
        "Abre Pausa > Ajustes > Control y cambia el 'Botón Panel Táctil' (PS5) o 'Botón Vista' (Xbox) de Mapa a Cámara.",
        "Siéntate al volante de cualquier vehículo y presiona Flecha Arriba para sacar el teléfono.",
        "Presiona Círculo (PS5) o B (Xbox) para guardar el teléfono y presiona repetidamente el Panel Táctil / Vista mientras baja la mano.",
        "Sal del vehículo: tu cámara quedará bloqueada en Primera Persona real a pie y conduciendo."
      ]
    }
  },
  {
    id: "g3", category: "Stealth",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: { en: "Instant Police Vehicle-ID & Tracker Bypass", es: "Evadir Rastreadores GPS e Identificación Policial al Instante" },
    votes: 314,
    warning: { en: "Works best during 3-star and 4-star Bank Vault or Jewelry escapes.", es: "Ideal durante escapes de 3 y 4 estrellas en robos de bancos o joyerías." },
    steps: {
      en: [
        "Break line-of-sight inside a Vice City parking garage or alley while police search cones sweep the block.",
        "Exit your getaway car and enter any parked civilian car—LCPD dispatch tracks your specific vehicle model/plate rather than your face.",
        "Or use your WAiNK phone app (D-Pad Up + Hold R1/RB) to scan and disable GPS trackers."
      ],
      es: [
        "Rompe la línea de visión dentro de un estacionamiento o callejón de Vice City mientras los conos policiales buscan.",
        "Baja de tu auto de huida y sube a cualquier auto civil estacionado: la policía rastrea la matrícula/modelo del auto más que tu rostro.",
        "También puedes usar la app WAiNK (Flecha Arriba + R1/RB) para escanear y desactivar rastreadores GPS."
      ]
    }
  }
];

const REACTION_EMOJIS = ["🔥", "👽", "🤯", "😂", "💀"];
const ANIMATED_GIFS = [
  { id: "ufo", icon: "🛸", label: { en: "UFO Abduction Beam!", es: "¡Abducción OVNI!" } },
  { id: "wasted", icon: "💀", label: { en: "WASTED • Mind Blown", es: "WASTED • Mente Explotada" } },
  { id: "money", icon: "💸", label: { en: "+$250k Vice City Rain", es: "+$250k Lluvia Vice City" } },
  { id: "bigfoot", icon: "👣", label: { en: "Skunk Ape Thermal!", es: "¡Skunk Ape Térmico!" } },
  { id: "dog", icon: "🐕", label: { en: "Cool Dog Jet-Ski!", es: "¡Cool Dog en Moto de Agua!" } }
];

const DEFAULT_THEORIES = [
  {
    id: "t1",
    title: { en: "Literal Easter Egg: Bird's Nest atop Vice City's Tallest Radio Tower", es: "Easter Egg Literal: Nido de Huevos en la Torre de Radio más Alta de Vice City" },
    tag: "Verified Easter Egg",
    author: "@xGarbett_Hunter",
    coords: "Vice City Communications Tower (6-Min Climb)",
    body: { en: "Climb the ladders of the tallest radio tower in Vice City (takes ~6–7 minutes) to find a giant bird's nest filled with painted Easter eggs. Pick one up and throw it off the edge to trigger a secret comic cutscene showing where it lands!", es: "Sube las escaleras de la torre de radio más alta de Vice City (toma ~6–7 minutos) para hallar un nido gigante lleno de huevos de Pascua pintados. ¡Toma uno y lánzalo al vacío para activar una cinemática secreta donde cae!" },
    votes: 684,
    reactions: { "🔥": 92, "👽": 14, "🤯": 145, "😂": 61, "💀": 18 },
    comments: [
      { id: "c101", author: "@ViceClimber", text: "Worth the 7-minute ladder climb! The cutscene when it hits the car below is hilarious.", gifId: "wasted", likes: 24 }
    ],
    timestamp: 1732230000000
  },
  {
    id: "t2",
    title: { en: "Dexter Morgan's 'Trinity Apartments' & Slice of Life Boat", es: "Apartamentos 'Trinity' de Dexter Morgan y su Barco Slice of Life" },
    tag: "NPC Secrets",
    author: "@BayHarborLore",
    coords: "Washington Island • Near Vice Beach Pay 'n' Spray",
    body: { en: "Rockstar recreated Dexter Morgan's Miami apartment building on Washington Island, renamed 'Trinity Apartments'. Climb onto the roof to find his exact kill kit (duct tape, rope, and syringe), and check the dock below for his boat 'Slice of Life'.", es: "Rockstar recreó el edificio de Dexter Morgan en Washington Island con el nombre 'Trinity Apartments'. Sube a la azotea para hallar su kit (cinta adhesiva, cuerda y jeringa), y mira el muelle abajo donde está su barco 'Slice of Life'." },
    votes: 590,
    reactions: { "🔥": 110, "👽": 8, "🤯": 134, "😂": 22, "💀": 77 },
    comments: [
      { id: "c102", author: "@MiamiVice99", text: "You can actually drive the boat docked right outside!", gifId: "", likes: 19 }
    ],
    timestamp: 1732228000000
  },
  {
    id: "t3",
    title: { en: "Free Paul Walker Green Mitsubishi Eclipse on Vespucci Island", es: "Mitsubishi Eclipse Verde de Paul Walker Gratis en Vespucci Island" },
    tag: "Verified Easter Egg",
    author: "@StreetRacerVC",
    coords: "Vespucci Island Villa Garage (Rialto Islands)",
    body: { en: "Break into a villa garage on Vespucci Island, switch off the wall alarm before LCPD arrives, and claim a free replica of Paul Walker's neon-underglow green 1995 Mitsubishi Eclipse from The Fast and the Furious!", es: "Entra al garaje de una villa en Vespucci Island, apaga la alarma de la pared antes de que llegue la policía y llévate gratis la réplica del Mitsubishi Eclipse verde con neón de Paul Walker en Rápido y Furioso." },
    votes: 548,
    reactions: { "🔥": 165, "👽": 4, "🤯": 88, "😂": 19, "💀": 9 },
    comments: [],
    timestamp: 1732226000000
  },
  {
    id: "t4",
    title: { en: "Kelly County 2:00 AM UFO Abduction ('The Truth Is Out There' Trophy)", es: "Abducción OVNI a las 2:00 AM en Condado Kelly (Trofeo Secreto)" },
    tag: "Mount Kalaga / UFO",
    author: "@LeonidaXFiles",
    coords: "NW of Starlet Motel, Kelly County • After 2:00 AM",
    body: { en: "After 2:00 AM, look for a parked car with flashing lights NW of Starlet Motel. Follow the trail into the woods to witness a UFO beaming up a woman—walk back to her car and the UFO beams YOU up, waking you 3 days later with a hidden trophy!", es: "Después de las 2:00 AM, busca un auto con luces intermitentes al noroeste del Starlet Motel. Sigue el sendero al bosque para ver un OVNI abduciendo a una mujer; vuelve a su auto y el OVNI te abducirá a ti, despertando 3 días después con un trofeo oculto." },
    votes: 519,
    reactions: { "🔥": 74, "👽": 210, "🤯": 156, "😂": 12, "💀": 31 },
    comments: [],
    timestamp: 1732224000000
  },
  {
    id: "t5",
    title: { en: "Cool Dog: Jet-Ski Rescue Dog & Secret Dog Island ($1,200)", es: "Cool Dog: Perro Rescatista en Moto de Agua e Isla de Perros ($1,200)" },
    tag: "Verified Easter Egg",
    author: "@KeysExplorer",
    coords: "Gambit Bay (Stranded at Sea)",
    body: { en: "If you get stranded swimming in Gambit Bay without a boat, listen for barking: a golden dog in a life vest rides up on a jet ski! Praise him, hop on, and stay aboard until he leads you to Dog Island where he digs up a wallet with ~$1,200.", es: "Si te quedas nadando sin bote en Gambit Bay, escucha los ladridos: ¡un perro con chaleco salvavidas llega en moto de agua! Acarícialo, sube detrás de él y te llevará hasta la Isla de los Perros donde desentierra una billetera con ~$1,200." },
    votes: 495,
    reactions: { "🔥": 140, "👽": 9, "🤯": 95, "😂": 84, "💀": 5 },
    comments: [],
    timestamp: 1732222000000
  },
  {
    id: "t6",
    title: { en: "Cottonmouth Lake Skunk Ape (Bigfoot) & Kirk's Hunter Quests", es: "El Skunk Ape (Pie Grande) de Cottonmouth Lake y Misiones de Kirk" },
    tag: "Grassrivers Cryptids",
    author: "@BayouTracker",
    coords: "Cottonmouth Lake (South of Hamlet, Grassrivers)",
    body: { en: "Around Cottonmouth Lake south of Hamlet, you can catch Leonida's Bigfoot eating a deer on a dirt road. Follow it to a tree effigy—examining it makes you pass out as the creature approaches, unlocking a full side-questline with hunter Kirk!", es: "Alrededor de Cottonmouth Lake al sur de Hamlet, verás al Pie Grande de Leonida en un camino de tierra. Síguelo hasta una efigie en un árbol; al examinarla te desmayas mientras se acerca, desbloqueando las misiones del cazador Kirk." },
    votes: 462,
    reactions: { "🔥": 88, "👽": 42, "🤯": 119, "😂": 15, "💀": 39 },
    comments: [],
    timestamp: 1732220000000
  },
  {
    id: "t7",
    title: { en: "Manifest Canyon Four-Horse Statue & Controller Vibration Puzzle", es: "Estatua de 4 Caballos en Manifest Canyon y Misterio de Vibración" },
    tag: "Chiliad Connection",
    author: "@akspree_Theory",
    coords: "Manifest Canyon",
    body: { en: "A mysterious statue near Manifest Canyon depicts four horses covered in unusual glyphs—with a traffic cone on one horse's head. Standing near it triggers rhythmic controller vibrations and strange beeping codes. Could this be GTA 6's Mount Chiliad puzzle?", es: "Una estatua misteriosa cerca de Manifest Canyon muestra cuatro caballos con glifos raros y un cono de tráfico en la cabeza de uno. Acercarse activa vibraciones rítmicas en el control y pitidos extraños. ¿Será el nuevo misterio estilo Mount Chiliad?" },
    votes: 431,
    reactions: { "🔥": 67, "👽": 128, "🤯": 140, "😂": 34, "💀": 11 },
    comments: [],
    timestamp: 1732218000000
  },
  {
    id: "t8",
    title: { en: "Arthur Morgan's Cowboy Hat at Port Gellhorn Yard Sale ($35)", es: "Sombrero Vaquero de Arthur Morgan en Venta de Patio ($35)" },
    tag: "Verified Easter Egg",
    author: "@RedDeadLeonida",
    coords: "South Port Gellhorn Yard Sale (Chapter 2+)",
    body: { en: "At a yard sale in south Port Gellhorn, Arthur Morgan's exact hat from Red Dead Redemption 2 sits on a sofa atop a guitar case. Buy it for $35 as the 'Genuine Cowboy Hat' and both Jason and Lucia can wear it permanently!", es: "En una venta de patio al sur de Port Gellhorn, el sombrero exacto de Arthur Morgan de Red Dead Redemption 2 está sobre un estuche de guitarra. Cómpralo por $35 y tanto Jason como Lucía podrán usarlo siempre." },
    votes: 418,
    reactions: { "🔥": 132, "👽": 5, "🤯": 76, "😂": 14, "💀": 6 },
    comments: [],
    timestamp: 1732216000000
  },
  {
    id: "t9",
    title: { en: "Verified Cameo: 'Little Sam' (Sam Houser) in Chapter 3 ('Boobie Time')", es: "Cameo Verificado: 'Little Sam' (Sam Houser) en Cap. 3 ('Boobie Time')" },
    tag: "NPC Secrets",
    author: "@ViceLoreHunter",
    coords: "Vice City • Chapter 3 Mission: Boobie Time",
    body: { en: "While driving Boobie Ike around Vice City, an older silent man with a gray beard wearing a Rockstar Games T-shirt appears—identified in-game as 'Little Sam', a direct cameo of Rockstar co-founder Sam Houser.", es: "Mientras conduces con Boobie Ike por Vice City, aparece un hombre mayor silencioso con barba gris y camiseta de Rockstar Games llamado 'Little Sam', un cameo directo del cofundador de Rockstar Sam Houser." },
    votes: 395,
    reactions: { "🔥": 95, "👽": 11, "🤯": 84, "😂": 27, "💀": 8 },
    comments: [],
    timestamp: 1732214000000
  },
  {
    id: "t10",
    title: { en: "The 50 Cocaine Flamingos & Inflatable Flamingo Unlock", es: "Los 50 Flamencos de Cocaína y el Flamenco Inflable Desbloqueable" },
    tag: "Verified Easter Egg",
    author: "@Leonida100",
    coords: "All 6 Leonida Regions (50 Locations)",
    body: { en: "Scattered across Vice City, the Keys, and Port Gellhorn are 50 hidden pink lawn flamingos packed with contraband. Destroying all 50 unlocks a secret cheat that spawns a rideable Inflatable Flamingo.", es: "Repartidos por Vice City, los Cayos y Port Gellhorn hay 50 flamencos rosas ocultos. Destruir los 50 desbloquea un truco secreto que genera un Flamenco Inflable manejable." },
    votes: 372,
    reactions: { "🔥": 88, "👽": 16, "🤯": 69, "😂": 53, "💀": 12 },
    comments: [],
    timestamp: 1732212000000
  }
];

const VEHICLES_DATA = [
  { id: "v1", name: "Truffade Thrax", class: "Super", price: 2325000, topSpeed: 222, speedPct: 98, accelPct: 95, handlingPct: 93, note: { en: "Hypercar unlocked via Shopping Challenges or Vice City exotic dealers.", es: "Hiperauto desbloqueado con Desafíos de Compras o concesionarios de Vice City." } },
  { id: "v2", name: "Progen Emerus", class: "Super", price: 2150000, topSpeed: 220, speedPct: 97, accelPct: 96, handlingPct: 95, note: { en: "Track-focused hypercar with extreme cornering downforce.", es: "Hiperauto de pista con agarre extremo en curvas." } },
  { id: "v3", name: "'95 Grotti Cheetah Classic", class: "Super", price: 1450000, topSpeed: 208, speedPct: 92, accelPct: 89, handlingPct: 88, note: { en: "Iconic Vice City wedge supercar featured in Ultimate Edition.", es: "Superauto clásico icónico de Vice City incluido en Ultimate Edition." } },
  { id: "v4", name: "Grotti Furia", class: "Super", price: 1890000, topSpeed: 214, speedPct: 95, accelPct: 92, handlingPct: 90, note: { en: "Twin-turbo Italian exotic built for Ocean Drive sprints.", es: "Deportivo italiano biturbo ideal para rectas en Ocean Drive." } },
  { id: "v5", name: "Pegassi Zorrusso", class: "Super", price: 1925000, topSpeed: 215, speedPct: 95, accelPct: 93, handlingPct: 89, note: { en: "Open-top roadster hypercar common in Starfish Island.", es: "Hiperauto descapotable común en Starfish Island." } },
  { id: "v6", name: "Bravado Banshee", class: "Sports", price: 680000, topSpeed: 201, speedPct: 88, accelPct: 91, handlingPct: 85, note: { en: "Signature V10 American roadster; also spawnable via Combat cheat.", es: "Deportivo V10 clásico; también se genera con truco de Combate." } },
  { id: "v7", name: "Invetero Coquette D10", class: "Sports", price: 960000, topSpeed: 206, speedPct: 91, accelPct: 92, handlingPct: 87, note: { en: "Mid-engine Leonida coastal cruiser.", es: "Deportivo de motor central ideal para la costa de Leonida." } },
  { id: "v8", name: "Grotti Itali GTO", class: "Sports", price: 1180000, topSpeed: 210, speedPct: 93, accelPct: 94, handlingPct: 86, note: { en: "High-revving grand tourer with razor-sharp throttle response.", es: "Gran turismo de altas revoluciones y respuesta instantánea." } },
  { id: "v9", name: "Pfister Comet S2 Cabrio", class: "Sports", price: 890000, topSpeed: 199, speedPct: 87, accelPct: 90, handlingPct: 89, note: { en: "Convertible rear-engine sports car seen along Washington Beach.", es: "Deportivo descapotable visto en Washington Beach." } },
  { id: "v10", name: "Vapid Ganado (Jason's Pickup)", class: "Muscle", price: 185000, topSpeed: 164, speedPct: 72, accelPct: 78, handlingPct: 75, note: { en: "Jason Duval's signature two-door pickup coupe (supports Retro Build).", es: "Camioneta cupé personal de Jason Duval (admite mejora Retro Build)." } },
  { id: "v11", name: "Bravado Gauntlet Hellfire", class: "Muscle", price: 540000, topSpeed: 188, speedPct: 83, accelPct: 90, handlingPct: 74, note: { en: "Supercharged V8 muscle beast built for straight-line drags.", es: "Bestia V8 sobrealimentada hecha para arrancones." } },
  { id: "v12", name: "Declasse Tulip M-100", class: "Muscle", price: 320000, topSpeed: 174, speedPct: 76, accelPct: 81, handlingPct: 73, note: { en: "Classic 1980s Leonida street coupe.", es: "Cupé callejero clásico de los años 80." } },
  { id: "v13", name: "Albany Buccaneer", class: "Muscle", price: 240000, topSpeed: 171, speedPct: 75, accelPct: 79, handlingPct: 71, note: { en: "Heavy chrome lowrider popular in Little Cuba.", es: "Lowrider cromado muy popular en Little Cuba." } },
  { id: "v14", name: "'67 Vapid Dominator Buggy", class: "Off-Road & SUV", price: 495000, topSpeed: 168, speedPct: 74, accelPct: 86, handlingPct: 88, note: { en: "Lifted dune/swamp racer stored at Paradise Garage, Watson Bay.", es: "Todoterreno elevado guardado en Paradise Garage, Watson Bay." } },
  { id: "v15", name: "Vapid Caracara 4x4", class: "Off-Road & SUV", price: 410000, topSpeed: 158, speedPct: 69, accelPct: 77, handlingPct: 82, note: { en: "Heavy-duty off-road truck built for Mount Kalaga trails.", es: "Camioneta 4x4 pesada para senderos de Mount Kalaga." } },
  { id: "v16", name: "Gallivanter Baller ST-D", class: "Off-Road & SUV", price: 380000, topSpeed: 166, speedPct: 73, accelPct: 78, handlingPct: 80, note: { en: "Luxury Vice City VIP SUV.", es: "SUV de lujo VIP de Vice City." } },
  { id: "v17", name: "Dinka Enduro", class: "Motorcycle", price: 48000, topSpeed: 146, speedPct: 65, accelPct: 84, handlingPct: 92, note: { en: "Dual-sport dirt bike parked at Jason's Keys safehouse.", es: "Moto doble propósito estacionada en la casa de Jason en los Cayos." } },
  { id: "v18", name: "Nagasaki Carbon RS", class: "Motorcycle", price: 140000, topSpeed: 192, speedPct: 85, accelPct: 95, handlingPct: 91, note: { en: "Carbon-fiber superbike unlocked via Exploration Challenges.", es: "Supermoto de fibra de carbono desbloqueada explorando." } },
  { id: "v19", name: "Maibatsu Sanchez", class: "Motorcycle", price: 35000, topSpeed: 142, speedPct: 63, accelPct: 85, handlingPct: 94, note: { en: "Agile motocross bike for Grassrivers & Kalaga dirt tracks.", es: "Moto de motocross ágil para caminos de tierra en Grassrivers." } },
  { id: "v20", name: "Panther / POACH Airboat", class: "Marine", price: 165000, topSpeed: 112, speedPct: 54, accelPct: 78, handlingPct: 90, note: { en: "Fan-driven wetland airboat essential for Grassrivers navigation.", es: "Hidrodeslizador esencial para navegar los pantanos de Grassrivers." } },
  { id: "v21", name: "Shitzu Squalo Speedboat", class: "Marine", price: 425000, topSpeed: 138, speedPct: 66, accelPct: 82, handlingPct: 84, note: { en: "High-speed offshore cigarette boat docked at Washington Beach.", es: "Lancha rápida de alta mar atracada en Washington Beach." } },
  { id: "v22", name: "Speedophile Seashark & Crest Kayak", class: "Marine", price: 28000, topSpeed: 94, speedPct: 45, accelPct: 76, handlingPct: 93, note: { en: "Agile coastal watercraft for Leonida Keys reef exploration.", es: "Moto acuática y kayak para explorar arrecifes en los Cayos." } },
  { id: "v23", name: "Buckingham Maverick & Sea Sparrow", class: "Aircraft", price: 1350000, topSpeed: 168, speedPct: 75, accelPct: 81, handlingPct: 86, note: { en: "Versatile helicopter (Sea Sparrow variant lands directly on water).", es: "Helicóptero versátil (la versión Sea Sparrow aterriza en el agua)." } },
  { id: "v24", name: "Mammoth Dodo & Buckingham Shamal", class: "Aircraft", price: 1650000, topSpeed: 215, speedPct: 94, accelPct: 83, handlingPct: 80, note: { en: "Amphibious seaplane and twin-jet for fast cross-state travel.", es: "Hidroavión anfibio y jet privado para cruzar todo el estado." } }
];

const PROPERTIES_DATA = [
  { id: "pr1", name: { en: "Ocean Drive Nightclub", es: "Club Nocturno Ocean Drive" }, region: "Vice City", price: 2200000, dailyIncome: 48000, slots: 10, roiDays: 46, note: { en: "High passive cashflow + 10-car underground VIP garage.", es: "Alto ingreso pasivo diario + garaje subterráneo VIP para 10 autos." } },
  { id: "pr2", name: { en: "Shore Court Garage (Ocean Beach)", es: "Garaje Shore Court (Ocean Beach)" }, region: "Vice City", price: 450000, dailyIncome: 8500, slots: 6, roiDays: 53, note: { en: "Prime Ocean Beach classic car storage & tuning bay.", es: "Almacén de autos clásicos y taller en Ocean Beach." } },
  { id: "pr3", name: { en: "Paradise Garage (Watson Bay)", es: "Garaje Paradise (Watson Bay)" }, region: "Vice City", price: 680000, dailyIncome: 14000, slots: 8, roiDays: 48, note: { en: "Custom off-road & restoration workshop in Watson Bay.", es: "Taller de restauración y todoterrenos en Watson Bay." } },
  { id: "pr4", name: { en: "Leonida Keys Smuggler Marina", es: "Marina de Contrabando (Leonida Keys)" }, region: "Leonida Keys", price: 890000, dailyIncome: 24000, slots: 4, roiDays: 37, note: { en: "Fastest break-even ROI via offshore cargo runs.", es: "Retorno de inversión más rápido mediante rutas marítimas." } },
  { id: "pr5", name: { en: "Port Gellhorn Chop Shop", es: "Deshuesadero Port Gellhorn" }, region: "Port Gellhorn", price: 650000, dailyIncome: 19500, slots: 8, roiDays: 33, note: { en: "Fence stolen exotic vehicles for rapid daily payouts.", es: "Vende autos exóticos robados para pagos diarios rápidos." } }
];

const MECHANICS_DATA = [
  { tag: { en: "ECONOMY & CASH", es: "ECONOMÍA Y EFECTIVO" }, title: { en: "3-Tier Money System (Bank, Cash & Duffel Bags)", es: "Sistema de Dinero en 3 Niveles (Banco, Efectivo y Bolsas)" }, desc: { en: "Stolen cash doesn't teleport into your bank account. Money is split into Bank Balance (BuckMe Savings/Checking), Cash on Hand, and Duffel Bag Loot. Deposit cash at ATMs/Banks, and bring stolen jewelry, narcotics, or cars to specialized Fences.", es: "El dinero robado no va solo al banco. Se divide en Saldo Bancario (Ahorros BuckMe), Efectivo en Mano y Bolsas de Botín. Deposita efectivo en cajeros y lleva joyas, narcóticos o autos a los Fences." } },
  { tag: { en: "WEAPONS & INVENTORY", es: "ARMAS E INVENTARIO" }, title: { en: "Realistic Carry Limit & Car Trunk Arsenal", es: "Límite Realista de Armas y Maletero Arsenal" }, desc: { en: "Jason and Lucia carry 2 handguns and 2 long guns on foot. Your personal vehicle's trunk acts as your mobile armory and loot stash—open the trunk to swap rifles or store loaded stash bags between jobs.", es: "Jason y Lucía llevan 2 pistolas y 2 armas largas a pie. El maletero de tu auto personal funciona como armería móvil y almacén de bolsas de botín entre misiones." } },
  { tag: { en: "VEHICLE THEFT & SECURITY", es: "ROBO DE AUTOS Y SEGURIDAD" }, title: { en: "Car Security Tiers & WAiNK Tracker Scanner", es: "Niveles de Seguridad y Escáner GPS WAiNK" }, desc: { en: "Use Moses' Slim Jim tool in Chapter 2 for parked cars, or Key-Cloners for luxury rides. Press D-Pad Up + Hold R1/RB to scan vehicles for trackers with the WAiNK app, and visit Pay 'n' Spray to strip trackers.", es: "Usa la ganzúa Slim Jim de Moses en el Cap. 2 o clonadores de llaves para autos de lujo. Presiona Flecha Arriba + R1/RB para escanear rastreadores GPS con WAiNK y quítalos en Pay 'n' Spray." } },
  { tag: { en: "FITNESS & PHYSIQUE", es: "GIMNASIO Y FÍSICO" }, title: { en: "Gyms, Weight Gain & Melee Stamina", es: "Gimnasios, Peso Corporal y Resistencia" }, desc: { en: "Working out at Ocean Beach's outdoor gym or local fitness clubs visibly builds muscle and boosts melee stamina—and completing 100 workouts unlocks the Full Body Armor cheat!", es: "Entrenar en el gimnasio de Ocean Beach aumenta la musculatura y resistencia cuerpo a cuerpo, y completar 100 series desbloquea el truco de Blindaje Completo." } }
];

function tField(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[currentLang] || val.en || "";
}

// ==========================================
// 3. LOCAL STORAGE STATE & MODAL CONTROLS
// ==========================================
const ARROW_MAP = { UP: "↑ UP", DOWN: "↓ DOWN", LEFT: "← LEFT", RIGHT: "→ RIGHT" };
let favorites = JSON.parse(localStorage.getItem("gta6_favs") || "[]");
let unlockedCheats = JSON.parse(localStorage.getItem("gta6_unlocked_cheats") || "[]");
let foundPins = JSON.parse(localStorage.getItem("gta6_found_pins") || "[]");
let glitchVotes = JSON.parse(localStorage.getItem("gta6_glitch_votes") || "[]");
let theories = JSON.parse(localStorage.getItem("gta6_theories_v3") || "null") || DEFAULT_THEORIES;
let upvotedIds = JSON.parse(localStorage.getItem("gta6_upvoted_theories") || "[]");
let likedComments = JSON.parse(localStorage.getItem("gta6_liked_comments") || "[]");
let plannedVehicles = JSON.parse(localStorage.getItem("gta6_plan_vehs") || "[]");
let plannedProps = JSON.parse(localStorage.getItem("gta6_plan_props") || "[]");
let geminiApiKey = localStorage.getItem("gta6_gemini_key") || "";
let selectedGifPerThread = {};
let showFavsOnly = false;
let hideFound = false;
let mapZoom = 1;

const todayStr = new Date().toISOString().slice(0, 10);
let aiUsageToday = JSON.parse(localStorage.getItem("gta6_ai_usage") || '{"date":"","count":0}');
if (aiUsageToday.date !== todayStr) {
  aiUsageToday = { date: todayStr, count: 0 };
  localStorage.setItem("gta6_ai_usage", JSON.stringify(aiUsageToday));
}

window.closeAllModals = function() {
  document.getElementById("proModal").classList.add("hidden");
  document.getElementById("shareCardModal").classList.add("hidden");
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllModals();
});

function syncHandleUI() {
  const clean = userHandle.startsWith("@") ? userHandle : `@${userHandle}`;
  userHandle = clean;
  localStorage.setItem("gta6_user_handle", clean);
  document.getElementById("activeHandleDisplay").textContent = clean;
  document.getElementById("activeHandleAvatar").textContent = clean.replace("@", "").charAt(0).toUpperCase() || "V";
}

// ==========================================
// 4. RENDER FUNCTIONS (100% BILINGUAL)
// ==========================================
function renderControllerGuide() {
  const banner = document.getElementById("controllerGuideBanner");
  if (currentPlatform === "UNLOCKS") {
    banner.innerHTML = `
      <div class="guide-steps">
        <span>🔓 <strong>${currentLang === "es" ? "Progreso de Desbloqueo:" : "Cheat Unlock Progress:"}</strong> ${unlockedCheats.length} / ${CHEATS_DATA.length}</span>
      </div>
      <div class="guide-warning">
        💡 ${currentLang === "es" ? "Paso 1: Completa las 91 misiones. Paso 2: Completa el desafío de cada truco en Pausa > Progreso > Trucos." : "Step 1: Beat all 91 story missions. Step 2: Finish each cheat's challenge under Pause > Progress > Cheats."}
      </div>
    `;
    return;
  }
  const isPS = currentPlatform === "PS5";
  const bumper1 = isPS ? `<span class="ctrl-key ps-bumper">L1</span>` : `<span class="ctrl-key xb-bumper">LB</span>`;
  const bumper2 = isPS ? `<span class="ctrl-key ps-bumper">R1</span>` : `<span class="ctrl-key xb-bumper">RB</span>`;
  banner.innerHTML = `
    <div class="guide-steps">
      <span>${currentLang === "es" ? "Cómo activar:" : "How to activate:"}</span>
      <span class="ctrl-key dpad">↑ D-Pad</span>
      <span class="combo-sep">(${currentLang === "es" ? "Abrir Teléfono" : "Open Phone"})</span>
      <span>+ ${currentLang === "es" ? "Mantener" : "Hold"}</span> ${bumper1} <span>+ ${currentLang === "es" ? "Presionar" : "Press"}</span> ${bumper2} <span>→ ${currentLang === "es" ? "Ingresar Código" : "Enter Code"}</span>
    </div>
    <div class="guide-warning">
      ⚠️ ${currentLang === "es" ? "Requiere completar la historia (91 misiones) y desactiva trofeos/guardado." : "Requires beating story (91 missions). Disables Trophies/Achievements & Saving."}
    </div>
  `;
}

function renderCheats() {
  renderControllerGuide();
  const query = document.getElementById("cheatSearch").value.toLowerCase();
  const cat = document.getElementById("categoryFilter").value;
  const status = document.getElementById("statusFilter").value;
  const isPS = currentPlatform === "PS5";
  const isUnlockView = currentPlatform === "UNLOCKS";

  const filtered = CHEATS_DATA.filter(item => {
    const title = tField(item.title).toLowerCase();
    const desc = tField(item.desc).toLowerCase();
    const unlock = tField(item.unlock).toLowerCase();
    const matchesSearch = title.includes(query) || desc.includes(query) || unlock.includes(query);
    const matchesCat = cat === "ALL" || item.category === cat;
    const matchesFav = !showFavsOnly || favorites.includes(item.id);
    const matchesStatus = status === "ALL" || (status === "VERIFIED" && item.seq.length > 0) || (status === "UNLOCK_ONLY" && item.seq.length === 0);
    return matchesSearch && matchesCat && matchesFav && matchesStatus;
  });

  document.getElementById("cheatsGrid").innerHTML = filtered.map(item => {
    const isFav = favorites.includes(item.id);
    const isUnlocked = unlockedCheats.includes(item.id);
    const hasSeq = item.seq.length > 0;

    if (isUnlockView) {
      return `
        <div class="cheat-card">
          <div>
            <div class="card-top">
              <span class="cat-tag">${item.category} • ${hasSeq ? (currentLang === "es" ? "Código Verificado" : "Combo Verified") : (currentLang === "es" ? "En Búsqueda" : "Combo Pending")}</span>
              <button type="button" class="fav-btn ${isFav ? "saved" : ""}" onclick="toggleFav('${item.id}')">★</button>
            </div>
            <h3>${tField(item.title)}</h3>
            <p style="margin-bottom:8px;"><strong>${currentLang === "es" ? "Requisito:" : "Requirement:"}</strong> ${tField(item.unlock)}</p>
          </div>
          <div class="unlock-card-step">
            <strong>${currentLang === "es" ? "Cómo lograrlo:" : "How to do it:"}</strong> ${tField(item.howToUnlock)}
            <div class="unlock-check-row">
              <span style="font-size:11px;color:#94a3b8;">${currentLang === "es" ? "Tu progreso:" : "Track progress:"}</span>
              <button type="button" class="unlock-toggle-btn ${isUnlocked ? "done" : ""}" onclick="toggleCheatUnlocked('${item.id}')">
                ${isUnlocked ? (currentLang === "es" ? "✓ Desafío Completado" : "✓ Challenge Completed") : (currentLang === "es" ? "Marcar Completado" : "Mark Challenge Done")}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    const prefixKeys = isPS
      ? `<span class="ctrl-key dpad">↑</span><span class="ctrl-key ps-bumper">L1+R1</span>`
      : `<span class="ctrl-key dpad">↑</span><span class="ctrl-key xb-bumper">LB+RB</span>`;

    const visualKeys = hasSeq
      ? `${prefixKeys}<span class="combo-sep">›</span>` + item.seq.map(dir => `<span class="ctrl-key dpad">${ARROW_MAP[dir]}</span>`).join("")
      : `<span style="color:#94a3b8;font-size:12px;">🔒 ${currentLang === "es" ? "Secuencia en investigación — abre 'Cómo Desbloquear Todos' para completar el desafío." : "Button combo still being cracked — open 'How to Unlock All' to complete the challenge!"}</span>`;

    const plainText = hasSeq ? `${isPS ? "D-Pad Up, Hold L1 + R1:" : "D-Pad Up, Hold LB + RB:"} ${item.seq.join(", ")}` : "";

    return `
      <div class="cheat-card">
        <div>
          <div class="card-top">
            <span class="cat-tag">${item.category}</span>
            <button type="button" class="fav-btn ${isFav ? "saved" : ""}" onclick="toggleFav('${item.id}')">★</button>
          </div>
          <h3>${tField(item.title)}</h3>
          <p>${tField(item.desc)}</p>
        </div>
        <div class="combo-visual-wrap">
          <div class="combo-keys-row">${visualKeys}</div>
          <div class="unlock-pill"><strong>${currentLang === "es" ? "Desbloqueo:" : "How to Unlock:"}</strong> ${tField(item.howToUnlock)}</div>
          ${hasSeq ? `<button type="button" class="copy-combo-btn" onclick="navigator.clipboard.writeText('${plainText}'); this.textContent='✓ Copied!'">📋 ${currentLang === "es" ? "Copiar Botones" : "Copy Button Sequence"}</button>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

window.toggleFav = function(id) {
  favorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
  localStorage.setItem("gta6_favs", JSON.stringify(favorites));
  renderCheats();
};

window.toggleCheatUnlocked = function(id) {
  unlockedCheats = unlockedCheats.includes(id) ? unlockedCheats.filter(f => f !== id) : [...unlockedCheats, id];
  localStorage.setItem("gta6_unlocked_cheats", JSON.stringify(unlockedCheats));
  renderCheats();
};

window.inspectPin = function(id) {
  const p = LEONIDA_PINS.find(x => x.id === id);
  if (!p) return;
  if (!hasAccess(p.tier)) {
    document.getElementById("proModal").classList.remove("hidden");
    return;
  }
  const isFound = foundPins.includes(id);
  const inspector = document.getElementById("mapInspector");
  inspector.classList.remove("hidden");
  inspector.innerHTML = `
    <div>
      <span class="cat-tag">${p.icon} ${p.region} • ${p.type}</span>
      <h4 style="margin:3px 0;font-size:15px;">${tField(p.name)}</h4>
      <p style="font-size:12px;color:#94a3b8;">${tField(p.note)}</p>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <button type="button" class="btn-pro" style="width:auto;" onclick="togglePinFound('${p.id}'); inspectPin('${p.id}')">
        ${isFound ? (currentLang === "es" ? "✓ Encontrado (Deshacer)" : "✓ Found (Undo)") : (currentLang === "es" ? "Marcar Encontrado" : "Mark Found")}
      </button>
      <button type="button" class="btn-secondary" onclick="document.getElementById('mapInspector').classList.add('hidden')">✕</button>
    </div>
  `;
};

function renderFenceTable() {
  const isEs = currentLang === "es";
  document.getElementById("fenceTableContainer").innerHTML = `
    <h3>🤝 ${isEs ? "Guía de Compradores / Fences de Leonida (Dónde Vender Botín)" : "Leonida Black-Market Fence Payout Guide (Where to Sell Loot)"}</h3>
    <div class="fence-table-wrap">
      <table class="fence-table">
        <thead>
          <tr>
            <th>${isEs ? "Comprador y Ubicación" : "Fence & Location"}</th>
            <th>${isEs ? "Misión de Desbloqueo" : "Unlock Mission"}</th>
            <th>${isEs ? "Especialidad de Botín" : "Best Loot Specialty"}</th>
            <th>${isEs ? "Pago y Notas" : "Payout & Notes"}</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Brian</strong> (South Key Lento)</td><td>Ch. 1: <em>Lab Fees</em></td><td>${isEs ? "Narcóticos y Efectivo Inicial" : "Early Narcotics & Cash"}</td><td>${isEs ? "Tarifa baja • Código puerta: <code>7700</code> (Cierra tras Cap. 1)" : "Low rate • Keypad: <code>7700</code> (Closes after Ch. 1)"}</td></tr>
          <tr><td><strong>Donnie</strong> (South Key Lento)</td><td>Ch. 1: <em>Clean Up After Donnie</em></td><td>${isEs ? "Mercancía Inicial" : "Early Drop-Box Goods"}</td><td>${isEs ? "Tarifa baja • Cierra tras misión <em>Swamped</em>" : "Low rate • Closes after Ch. 1 quest <em>Swamped</em>"}</td></tr>
          <tr><td><strong>Moses "Mo" Watkins</strong> (Port Gellhorn)</td><td>Ch. 2: <em>Moses</em></td><td><strong>${isEs ? "Autos Robados (Sin Rastreador)" : "Stolen Cars (No Trackers)"}</strong></td><td>${isEs ? "Registra autos como propios o paga $1,000+ por auto" : "Registers cars as personal or buys clean cars ($1,000+ each)"}</td></tr>
          <tr><td><strong>Dunk</strong> (South Port Gellhorn)</td><td>Ch. 2: <em>Slam Dunk</em></td><td>${isEs ? "Narcóticos y Bolsas Cap. 2" : "Ch. 2 Narcotics & Stash Bags"}</td><td>${isEs ? "Tarifa media • Deposita en el maletero de su auto" : "Medium rate • Drop box in his car trunk"}</td></tr>
          <tr><td><strong>Tyrone</strong> (La Perle, Vice City)</td><td>${isEs ? "Progreso Cap. 3" : "Ch. 3 Progression"}</td><td><strong>${isEs ? "PAGO MÁXIMO por Narcóticos" : "HIGHEST for Narcotics"}</strong></td><td>${isEs ? "El mejor pago de Leonida para bolsas del Granero Rojo" : "Top payout for Red Barn / Gang Op cocaine bags"}</td></tr>
          <tr><td><strong>Yasmani</strong> (Little Cuba, Vice City)</td><td>Ch. 3: <em>Boobie Time</em></td><td><strong>${isEs ? "PAGO MÁXIMO por Joyas y Billetes" : "HIGHEST for Jewelry & Marked Bills"}</strong></td><td>${isEs ? "También vende pistas de bóvedas de bancos" : "Also sells Security-Van & Bank Vault robbery tips"}</td></tr>
          <tr><td><strong>Randy</strong> (Balsero, Vice City)</td><td>${isEs ? "Progreso Cap. 3+" : "Ch. 3+ Progression"}</td><td><strong>${isEs ? "Superautos Exóticos" : "High-End Exotic Cars"}</strong></td><td>${isEs ? "Bonificaciones altas por autos de su lista" : "Pays premium bonuses for Wish-List supercars"}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderMap() {
  renderFenceTable();
  const reg = document.getElementById("regionFilter").value;

  const total = LEONIDA_PINS.length;
  const done = foundPins.length;
  const pct = Math.round((done / total) * 100);
  document.getElementById("mapProgressText").textContent = `${done} / ${total} (${pct}%)`;
  document.getElementById("mapProgressBar").style.width = `${pct}%`;

  const visiblePins = LEONIDA_PINS.filter(p => {
    const matchReg = reg === "ALL" || p.region === reg;
    const matchLayer = currentMapLayer === "ALL" || p.type === currentMapLayer;
    const matchHide = !hideFound || !foundPins.includes(p.id);
    return matchReg && matchLayer && matchHide;
  });

  document.getElementById("mapPinsLayer").innerHTML = visiblePins.map(p => {
    const unlocked = hasAccess(p.tier);
    const isFound = foundPins.includes(p.id);
    return `
      <button type="button" class="map-pin ${isFound ? "found" : ""}"
              style="left:${p.x}%; top:${p.y}%; ${!unlocked ? "border-color:#64748b;opacity:0.75;" : ""}"
              title="${unlocked ? tField(p.name) : "🔒 Street Pass ($1.99)"}"
              onclick="inspectPin('${p.id}')">
        ${unlocked ? p.icon : "🔒"}
      </button>
    `;
  }).join("");

  document.getElementById("pinChecklist").innerHTML = visiblePins.map(p => {
    const unlocked = hasAccess(p.tier);
    const isFound = foundPins.includes(p.id);
    if (!unlocked) {
      return `
        <div class="pin-row" style="opacity:0.72;border-style:dashed;" onclick="document.getElementById('proModal').classList.remove('hidden')">
          <span>🔒</span>
          <div>
            <h4>${p.icon} ${tField(p.name)}</h4>
            <p><strong>${p.region}</strong> • ${currentLang === "es" ? "Desbloquea con Street Pass ($1.99)" : "Unlock with Street Pass ($1.99)"}</p>
          </div>
        </div>
      `;
    }
    return `
      <label class="pin-row ${isFound ? "found" : ""}">
        <input type="checkbox" ${isFound ? "checked" : ""} onchange="togglePinFound('${p.id}')" />
        <div onclick="inspectPin('${p.id}')">
          <h4>${p.icon} ${tField(p.name)}</h4>
          <p><strong>${p.region}</strong> • ${tField(p.note)}</p>
        </div>
      </label>
    `;
  }).join("");
}

window.togglePinFound = function(id) {
  foundPins = foundPins.includes(id) ? foundPins.filter(f => f !== id) : [...foundPins, id];
  localStorage.setItem("gta6_found_pins", JSON.stringify(foundPins));
  renderMap();
};

function renderGlitches() {
  const container = document.getElementById("glitchesContainer");
  if (!hasAccess("street")) {
    container.innerHTML = `
      <div class="paywall-box">
        <span class="brand-badge">STREET PASS ($1.99 ONE-TIME)</span>
        <h3>⚡ ${currentLang === "es" ? "Desbloquea Glitches Activos y Dinero Infinito" : "Unlock Active Glitches & Money Loops"}</h3>
        <p>${currentLang === "es" ? "Accede paso a paso al bucle de dinero del Granero Rojo, cámara en primera persona y verificación del parche 01.002.001." : "Get step-by-step instructions for the Red Barn Unlimited Money Loop, First-Person Camera Glitch, and live Patch 01.002.001 status."}</p>
        <button type="button" class="btn-pro" style="max-width:280px;margin:0 auto;" onclick="document.getElementById('proModal').classList.remove('hidden')">${currentLang === "es" ? "Desbloquear por $1.99 (Pago Único)" : "Unlock for $1.99 One-Time"}</button>
      </div>
    `;
    return;
  }

  const cat = document.getElementById("glitchCatFilter").value;
  const filtered = GLITCHES_DATA.filter(g => cat === "ALL" || g.category === cat);

  container.innerHTML = `<div class="forum-feed">` + filtered.map(g => {
    const voted = glitchVotes.includes(g.id);
    const stepsList = g.steps[currentLang] || g.steps.en;
    return `
      <div class="cheat-card">
        <div class="card-top">
          <span class="status-working">● ${tField(g.status)} • ${g.category}</span>
          <button type="button" class="unlock-toggle-btn ${voted ? "done" : ""}" onclick="voteGlitch('${g.id}')">
            👍 ${currentLang === "es" ? "Sigue Funcionando" : "Still Working"} (${g.votes})
          </button>
        </div>
        <h3 style="margin-top:8px;">${tField(g.title)}</h3>
        <ol class="glitch-steps">${stepsList.map(s => `<li>${s}</li>`).join("")}</ol>
        <div class="unlock-pill">⚠️ ${tField(g.warning)}</div>
      </div>
    `;
  }).join("") + `</div>`;
}

window.voteGlitch = function(id) {
  const item = GLITCHES_DATA.find(x => x.id === id);
  if (!item) return;
  if (glitchVotes.includes(id)) {
    glitchVotes = glitchVotes.filter(x => x !== id);
    item.votes -= 1;
  } else {
    glitchVotes.push(id);
    item.votes += 1;
  }
  localStorage.setItem("gta6_glitch_votes", JSON.stringify(glitchVotes));
  renderGlitches();
};

// ==========================================
// TIKTOK-STYLE FORUM: @USERNAME COMMENTS + ❤️ LIKES + VISUAL ANIMATED GIFS
// ==========================================
function renderForum() {
  const q = document.getElementById("forumSearch").value.toLowerCase();
  const tag = document.getElementById("forumTagFilter").value;
  const sort = document.getElementById("forumSort").value;
  const isEs = currentLang === "es";

  let list = theories.filter(t => {
    const title = tField(t.title).toLowerCase();
    const body = tField(t.body).toLowerCase();
    const matchQ = title.includes(q) || body.includes(q) || t.author.toLowerCase().includes(q);
    const matchTag = tag === "ALL" || t.tag === tag;
    return matchQ && matchTag;
  });

  if (sort === "top") list.sort((a, b) => b.votes - a.votes);
  else list.sort((a, b) => b.timestamp - a.timestamp);

  document.getElementById("forumFeed").innerHTML = list.map(t => {
    const voted = upvotedIds.includes(t.id);
    const reactions = t.reactions || { "🔥": 12, "👽": 4, "🤯": 9, "😂": 3, "💀": 2 };
    const comments = t.comments || [];
    const activeGifId = selectedGifPerThread[t.id] || "";
    const activeGifObj = ANIMATED_GIFS.find(g => g.id === activeGifId);

    const emojiButtons = REACTION_EMOJIS.map(em => `
      <button type="button" class="react-pill" onclick="reactTheory('${t.id}', '${em}')">
        ${em} ${reactions[em] || 0}
      </button>
    `).join("");

    const gifTrayHtml = ANIMATED_GIFS.map(g => `
      <button type="button" class="gif-option-chip" onclick="selectCommentGif('${t.id}', '${g.id}')">
        ${g.icon} ${tField(g.label)}
      </button>
    `).join("");

    const commentsHtml = comments.map(c => {
      const initial = (c.author || "V").replace("@", "").charAt(0).toUpperCase();
      const isLiked = likedComments.includes(c.id);
      const gifObj = ANIMATED_GIFS.find(g => g.id === c.gifId);
      return `
        <div class="tt-comment">
          <div class="tt-avatar sm">${initial}</div>
          <div class="tt-comment-body">
            <div class="tt-comment-user">${c.author}</div>
            <div>${c.text}</div>
            ${gifObj ? `<div class="animated-gif-card"><span class="gif-icon-bounce">${gifObj.icon}</span><span>${tField(gifObj.label)}</span></div>` : ""}
          </div>
          <button type="button" class="tt-comment-like ${isLiked ? "liked" : ""}" onclick="toggleCommentLike('${t.id}', '${c.id}')">
            <span>${isLiked ? "❤️" : "🤍"}</span>
            <span>${c.likes || 0}</span>
          </button>
        </div>
      `;
    }).join("");

    return `
      <article class="theory-card">
        <div class="vote-box">
          <button type="button" class="vote-btn ${voted ? "voted" : ""}" onclick="toggleTheoryVote('${t.id}')">▲</button>
          <span class="vote-count">${t.votes}</span>
        </div>
        <div class="theory-body">
          <div class="theory-meta">
            <span class="mystery-tag">${t.tag}</span>
            ${t.coords ? `<span class="coord-pill">📍 ${t.coords}</span>` : ""}
          </div>
          <h3>${tField(t.title)}</h3>
          <p style="margin-top:6px;">${tField(t.body)}</p>

          <!-- Emoji Reactions -->
          <div class="reactions-bar">${emojiButtons}</div>

          <!-- TikTok-Style Comment Drawer -->
          <div class="comments-drawer">
            <strong style="font-size:12px;color:#38bdf8;">💬 ${isEs ? "Comentarios" : "Comments"} (${comments.length})</strong>
            <div style="margin-top:6px;">
              ${commentsHtml || `<p style="font-size:12px;color:#94a3b8;padding:4px 0;">${isEs ? "Sé el primero en comentar con tu @usuario o enviar un GIF." : "Be the first to drop a comment or animated GIF!"}</p>`}
            </div>

            ${activeGifObj ? `<div style="margin-top:6px;"><span class="animated-gif-card"><span class="gif-icon-bounce">${activeGifObj.icon}</span><span>${tField(activeGifObj.label)}</span> <button type="button" style="background:none;border:none;color:#fff;cursor:pointer;margin-left:6px;" onclick="selectCommentGif('${t.id}', '')">✕</button></span></div>` : ""}

            <div id="gif-tray-${t.id}" class="gif-picker-tray hidden">${gifTrayHtml}</div>

            <form class="tt-input-bar" onsubmit="submitComment(event, '${t.id}')">
              <button type="button" class="btn-secondary" style="padding:7px 10px;border-radius:99px;font-size:11.5px;" onclick="document.getElementById('gif-tray-${t.id}').classList.toggle('hidden')">GIF 🎬</button>
              <input type="text" id="ctext-${t.id}" placeholder="${isEs ? `Comentar como ${userHandle}...` : `Add comment as ${userHandle}...`}" />
              <button type="submit" class="btn-pro" style="width:auto;padding:8px 14px;border-radius:99px;">➤</button>
            </form>
          </div>

          <div class="theory-footer">
            <span>${isEs ? "Publicado por" : "Posted by"} <strong>${t.author}</strong></span>
            <span>Leonida Lore Board</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

window.selectCommentGif = function(threadId, gifId) {
  selectedGifPerThread[threadId] = gifId;
  renderForum();
};

window.toggleTheoryVote = function(id) {
  const target = theories.find(t => t.id === id);
  if (!target) return;
  if (upvotedIds.includes(id)) {
    upvotedIds = upvotedIds.filter(v => v !== id);
    target.votes -= 1;
  } else {
    upvotedIds.push(id);
    target.votes += 1;
  }
  localStorage.setItem("gta6_theories_v3", JSON.stringify(theories));
  localStorage.setItem("gta6_upvoted_theories", JSON.stringify(upvotedIds));
  renderForum();
};

window.reactTheory = function(id, emoji) {
  const target = theories.find(t => t.id === id);
  if (!target) return;
  if (!target.reactions) target.reactions = { "🔥": 0, "👽": 0, "🤯": 0, "😂": 0, "💀": 0 };
  target.reactions[emoji] = (target.reactions[emoji] || 0) + 1;
  localStorage.setItem("gta6_theories_v3", JSON.stringify(theories));
  renderForum();
};

window.toggleCommentLike = function(threadId, commentId) {
  const target = theories.find(t => t.id === threadId);
  if (!target || !target.comments) return;
  const c = target.comments.find(x => x.id === commentId);
  if (!c) return;
  if (likedComments.includes(commentId)) {
    likedComments = likedComments.filter(x => x !== commentId);
    c.likes = Math.max(0, (c.likes || 1) - 1);
  } else {
    likedComments.push(commentId);
    c.likes = (c.likes || 0) + 1;
  }
  localStorage.setItem("gta6_liked_comments", JSON.stringify(likedComments));
  localStorage.setItem("gta6_theories_v3", JSON.stringify(theories));
  renderForum();
};

window.submitComment = function(e, id) {
  e.preventDefault();
  const target = theories.find(t => t.id === id);
  if (!target) return;
  const text = document.getElementById(`ctext-${id}`).value.trim();
  const gifId = selectedGifPerThread[id] || "";
  if (!text && !gifId) return;
  if (!target.comments) target.comments = [];
  target.comments.push({ id: "cm_" + Date.now(), author: userHandle, text, gifId, likes: 0 });
  selectedGifPerThread[id] = "";
  localStorage.setItem("gta6_theories_v3", JSON.stringify(theories));
  renderForum();
};

function updatePlannerSummary() {
  const vehTotal = plannedVehicles.reduce((sum, id) => {
    const v = VEHICLES_DATA.find(x => x.id === id);
    return sum + (v ? v.price : 0);
  }, 0);
  const propTotal = plannedProps.reduce((sum, id) => {
    const p = PROPERTIES_DATA.find(x => x.id === id);
    return sum + (p ? p.price : 0);
  }, 0);
  const dailyIncome = plannedProps.reduce((sum, id) => {
    const p = PROPERTIES_DATA.find(x => x.id === id);
    return sum + (p ? p.dailyIncome : 0);
  }, 0);
  const totalSlots = plannedProps.reduce((sum, id) => {
    const p = PROPERTIES_DATA.find(x => x.id === id);
    return sum + (p ? p.slots : 0);
  }, 0);

  document.getElementById("plannerTotalCost").textContent = `$${(vehTotal + propTotal).toLocaleString()}`;
  document.getElementById("plannerDailyIncome").textContent = `$${dailyIncome.toLocaleString()} / ${currentLang === "es" ? "día" : "day"}`;

  const slotEl = document.getElementById("plannerGarageSlots");
  const overCapacity = plannedVehicles.length > totalSlots;
  slotEl.textContent = overCapacity
    ? `${plannedVehicles.length} / ${totalSlots} (${currentLang === "es" ? "¡Compra Garaje!" : "Need Garage!"})`
    : `${plannedVehicles.length} / ${totalSlots} Slots`;
  slotEl.classList.toggle("slot-warning", overCapacity);
}

function renderVehicles() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const q = document.getElementById("vehSearch").value.toLowerCase();
  const cls = document.getElementById("vehClassFilter").value;
  const sort = document.getElementById("vehSort").value;

  let list = VEHICLES_DATA.filter(v => {
    const matchQ = v.name.toLowerCase().includes(q) || tField(v.note).toLowerCase().includes(q);
    const matchCls = cls === "ALL" || v.class === cls;
    return matchQ && matchCls;
  });

  if (sort === "speed") list.sort((a, b) => b.topSpeed - a.topSpeed);
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list.sort((a, b) => b.price - a.price);

  document.getElementById("vehiclesGrid").innerHTML = list.map(v => {
    const added = plannedVehicles.includes(v.id);
    return `
      <div class="cheat-card">
        <div>
          <div class="card-top">
            <span class="cat-tag">${v.class} • ${v.topSpeed} MPH</span>
            <span class="price-pill">$${v.price.toLocaleString()}</span>
          </div>
          <h3>${v.name}</h3>
          <p>${tField(v.note)}</p>
        </div>
        <div class="stat-bars">
          <div class="stat-row"><span>${currentLang === "es" ? "Velocidad" : "Top Speed"}</span><div class="stat-track"><div class="stat-fill" style="width:${v.speedPct}%"></div></div></div>
          <div class="stat-row"><span>${currentLang === "es" ? "Aceleración" : "Acceleration"}</span><div class="stat-track"><div class="stat-fill" style="width:${v.accelPct}%"></div></div></div>
          <div class="stat-row"><span>${currentLang === "es" ? "Manejo" : "Handling"}</span><div class="stat-track"><div class="stat-fill" style="width:${v.handlingPct}%"></div></div></div>
        </div>
        <button type="button" class="plan-toggle-btn ${added ? "added" : ""}" onclick="togglePlanVehicle('${v.id}')">
          ${added ? dict.inGarage : dict.addGarage}
        </button>
      </div>
    `;
  }).join("");
  updatePlannerSummary();
}

function renderProperties() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  document.getElementById("propertiesGrid").innerHTML = PROPERTIES_DATA.map(p => {
    const owned = plannedProps.includes(p.id);
    return `
      <div class="cheat-card">
        <div>
          <div class="card-top">
            <span class="cat-tag">${p.region} • +${p.slots} ${currentLang === "es" ? "Espacios" : "Garage Slots"}</span>
            <span class="price-pill">$${p.price.toLocaleString()}</span>
          </div>
          <h3>${tField(p.name)}</h3>
          <p>${tField(p.note)}</p>
        </div>
        <div class="code-box">
          ${currentLang === "es" ? `Ingreso Pasivo: +$${p.dailyIncome.toLocaleString()}/día • Retorno: ${p.roiDays} días` : `Passive Income: +$${p.dailyIncome.toLocaleString()}/day • ROI: ${p.roiDays} days`}
        </div>
        <button type="button" class="plan-toggle-btn ${owned ? "added" : ""}" onclick="togglePlanProperty('${p.id}')">
          ${owned ? dict.ownedProp : dict.buyProp}
        </button>
      </div>
    `;
  }).join("");
  updatePlannerSummary();
}

window.togglePlanVehicle = function(id) {
  plannedVehicles = plannedVehicles.includes(id) ? plannedVehicles.filter(x => x !== id) : [...plannedVehicles, id];
  localStorage.setItem("gta6_plan_vehs", JSON.stringify(plannedVehicles));
  renderVehicles();
};

window.togglePlanProperty = function(id) {
  plannedProps = plannedProps.includes(id) ? plannedProps.filter(x => x !== id) : [...plannedProps, id];
  localStorage.setItem("gta6_plan_props", JSON.stringify(plannedProps));
  renderProperties();
};

function renderMechanics() {
  document.getElementById("mechanicsGrid").innerHTML = MECHANICS_DATA.map(m => `
    <div class="cheat-card">
      <div>
        <span class="mech-badge">${tField(m.tag)}</span>
        <h3>${tField(m.title)}</h3>
        <p style="margin-top:8px;line-height:1.55;">${tField(m.desc)}</p>
      </div>
    </div>
  `).join("");
}

// ==========================================
// 5. AI ADVISOR & TIKTOK / INSTAGRAM CARD STUDIO
// ==========================================
function renderQuickPrompts() {
  const isEs = currentLang === "es";
  const prompts = isEs ? [
    { label: "💰 Ruta Más Rápida de Dinero", q: "¿Cuál es la ruta más rápida para ganar dinero sin perderlo en el Cap. 1?" },
    { label: "🏧 Cajeros ATM y Autos Raros", q: "¿Dónde están los cajeros ATM hackeables y el auto gratis de Paul Walker?" },
    { label: "🤝 Mejores Compradores (Fences)", q: "¿Qué fence paga más por joyas, bolsas de cocaína y autos robados?" },
    { label: "🥚 Easter Eggs Secretos", q: "¿Dónde están el huevo de la torre de radio, Dexter y el OVNI de las 2 AM?" }
  ] : [
    { label: "💰 Fastest Safe Money Route", q: "What is the fastest way to make money right now without getting my cash wiped?" },
    { label: "🏧 Hackable ATMs & Rare Cars", q: "Where are the hackable ATMs and Paul Walker's free green Eclipse?" },
    { label: "🤝 Best Fence Payouts", q: "Which fence pays the most for stolen jewelry, cocaine bags, and cars?" },
    { label: "🥚 Hidden Easter Eggs", q: "Where are the Radio Tower Easter egg, Dexter's apartment, and 2 AM UFO?" }
  ];
  document.getElementById("quickPromptsBar").innerHTML = prompts.map(p =>
    `<button type="button" class="prompt-chip" onclick="handleAiAsk('${p.q.replace(/'/g, "\\'")}')">${p.label}</button>`
  ).join("");
}

function updateAiQuotaUI() {
  const badge = document.getElementById("aiQuotaBadge");
  if (!badge) return;
  if (hasAccess("kingpin")) {
    badge.textContent = currentLang === "es"
      ? "👑 KINGPIN VIP: Consultas IA Ilimitadas Activas"
      : "👑 KINGPIN VIP: Unlimited AI Lookups Active";
  } else {
    const left = Math.max(0, 3 - aiUsageToday.count);
    badge.textContent = currentLang === "es"
      ? `Consultas IA Hoy: ${left} / 3 Gratis (Ilimitado con Kingpin VIP $4.99)`
      : `Daily AI Lookups: ${left} / 3 Free Remaining (Unlimited with Kingpin VIP $4.99)`;
  }
}

function getBuiltInLeonidaReply(question, chapter, lang) {
  const q = question.toLowerCase();
  const isEs = lang === "es";

  if (q.includes("atm") || q.includes("cajero") || q.includes("walker") || q.includes("rare") || q.includes("raro")) {
    return isEs
      ? "🏧 Cajeros ATM y Autos Raros: 1) Usa una grúa o el escáner WAiNK en Ocean Drive y Little Cuba para abrir cajeros ATM. 2) El Mitsubishi Eclipse verde de Paul Walker está gratis en un garaje de Vespucci Island (apaga la alarma de la pared antes de salir)."
      : "🏧 Hackable ATMs & Rare Cars: 1) Rip wall ATMs with a tow-truck winch or bypass them with WAiNK on Ocean Drive & Little Cuba. 2) Paul Walker's green Mitsubishi Eclipse is free inside a Vespucci Island villa garage—disable the wall alarm first!";
  }

  if (q.includes("money") || q.includes("dinero") || q.includes("cash") || q.includes("barn") || q.includes("granero")) {
    if (chapter === "ch1") {
      return isEs
        ? "🛡️ [Escudo Capítulo 1]: Antes de terminar 'Tourist Trap', el efectivo en mano se reinicia. Usa la Caja Fuerte de Brian (código 7700 en Key Lento) y deposita tus ganancias en tu Cuenta de Ahorros BuckMe."
        : "🛡️ [Chapter 1 Shield]: Cash on hand gets wiped at the end of Chapter 1 ('Tourist Trap'). Deposit earnings into your BuckMe Savings Account and sell early stash bags at Brian's Lockup (Keypad: 7700).";
    }
    return isEs
      ? "💰 Ruta más rápida de dinero: Ve al granero rojo de Apollo Aggregates (al este de Hamlet), llena una van de 10 espacios con bolsas de cocaína y la caja fuerte (~$40k–$89k por viaje), cambia de personaje para reiniciar el botín al instante y véndelo a Tyrone en La Perle (Vice City)."
      : "💰 Fastest Money Route: Hit the Apollo Aggregates red barn (east of Hamlet), load a 10-slot van with stash bags + office safe (~$40k–$89k per run), switch characters to instantly respawn the loot, and sell to Tyrone in La Perle (Vice City).";
  }

  if (q.includes("fence") || q.includes("vender") || q.includes("sell") || q.includes("jewelry") || q.includes("joyas")) {
    return isEs
      ? "🤝 Mejores Fences en Leonida:\n• Narcóticos / Bolsas: Tyrone (La Perle, Vice City) paga el máximo.\n• Joyas y Billetes Marcados: Yasmani (Little Cuba, Vice City) paga el máximo y vende pistas de bancos.\n• Autos Robados: Moses en Port Gellhorn (Cap. 2) o Randy en Balsero."
      : "🤝 Best Fences in Leonida:\n• Narcotics / Stash Bags: Tyrone (La Perle, Vice City) pays the highest rate.\n• Jewelry & Marked Bills: Yasmani (Little Cuba, Vice City) pays top dollar + sells Bank Vault tips.\n• Stolen Cars: Moses in Port Gellhorn (Ch. 2) or Randy in Balsero.";
  }

  return isEs
    ? "🤖 Consejo Táctico de Leonida: Guarda tus armas largas y bolsas de botín en el maletero de tu auto personal, usa WAiNK (Flecha Arriba + R1/RB) para escanear rastreadores GPS y revisa las 32 ubicaciones en la pestaña Mapa Táctico."
    : "🤖 Leonida Tactical Tip: Store extra rifles and stash bags inside your personal car's trunk, use WAiNK (D-Pad Up + R1/RB) to check stolen cars for GPS trackers, and explore all 32 pins on the Tactical Map tab.";
}

window.handleAiAsk = async function(promptText) {
  const messagesEl = document.getElementById("aiMessages");
  const chapter = document.getElementById("spoilerShield").value;

  if (!hasAccess("kingpin") && aiUsageToday.count >= 3) {
    document.getElementById("proModal").classList.remove("hidden");
    return;
  }

  messagesEl.innerHTML += `<div class="ai-msg user">${promptText}</div>`;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  aiUsageToday.count += 1;
  localStorage.setItem("gta6_ai_usage", JSON.stringify(aiUsageToday));
  updateAiQuotaUI();

  let reply = "";
  if (geminiApiKey) {
    try {
      const sysPrompt = `You are ViceLink AI, an expert tactical guide for Grand Theft Auto VI set in Leonida. Respond in ${currentLang === "es" ? "Spanish" : "English"}. Respect spoiler shield level: ${chapter}. Be concise and practical.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${sysPrompt}\n\nPlayer Question: ${promptText}` }] }] })
      });
      const data = await res.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || getBuiltInLeonidaReply(promptText, chapter, currentLang);
    } catch (err) {
      reply = getBuiltInLeonidaReply(promptText, chapter, currentLang);
    }
  } else {
    reply = getBuiltInLeonidaReply(promptText, chapter, currentLang);
  }

  messagesEl.innerHTML += `<div class="ai-msg bot">${reply.replace(/\n/g, "<br>")}</div>`;
  messagesEl.scrollTop = messagesEl.scrollHeight;
};

function renderSocialCard() {
  const canvas = document.getElementById("tiktokCanvas");
  const ctx = canvas.getContext("2d");
  const isIG = currentSocialStyle === "instagram";

  const grad = ctx.createLinearGradient(0, 0, 540, 960);
  if (isIG) {
    grad.addColorStop(0, "#190b28");
    grad.addColorStop(0.5, "#2b123b");
    grad.addColorStop(1, "#0a0d18");
  } else {
    grad.addColorStop(0, "#090d1a");
    grad.addColorStop(0.5, "#151c36");
    grad.addColorStop(1, "#070a12");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 540, 960);

  ctx.strokeStyle = isIG ? "#ff2a85" : "#00e5ff";
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, 492, 912);

  ctx.fillStyle = isIG ? "#ff7ab3" : "#00e5ff";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(isIG ? "INSTAGRAM STORY // LEONIDA INTEL" : "TIKTOK // LEONIDA TACTICAL HUB", 54, 82);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 48px sans-serif";
  ctx.fillText("VICELINK", 54, 136);

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`PLAYER: ${userHandle} (${userTier.toUpperCase()})`, 54, 172);

  const pct = Math.round((foundPins.length / LEONIDA_PINS.length) * 100);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(54, 220, 432, 160);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("100% STORY & MAP DISCOVERY", 78, 262);
  ctx.fillStyle = "#00e5ff";
  ctx.font = "900 64px sans-serif";
  ctx.fillText(`${pct}%`, 78, 336);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 18px sans-serif";
  ctx.fillText(`${foundPins.length} / ${LEONIDA_PINS.length} Pins Found`, 235, 326);

  const totalWorth = document.getElementById("plannerTotalCost").textContent;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(54, 410, 432, 150);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("PLANNED LEONIDA EMPIRE VALUE", 78, 452);
  ctx.fillStyle = "#4ade80";
  ctx.font = "900 46px sans-serif";
  ctx.fillText(totalWorth, 78, 518);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(54, 590, 432, 130);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("CHEAT CHALLENGES COMPLETED", 78, 632);
  ctx.fillStyle = "#ff2a85";
  ctx.font = "900 44px sans-serif";
  ctx.fillText(`${unlockedCheats.length} / ${CHEATS_DATA.length}`, 78, 692);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 19px sans-serif";
  ctx.fillText(isIG ? "Tap Link Sticker for Map & ATMs:" : "Link in Bio for Map, ATMs & Fences:", 54, 830);
  ctx.fillStyle = isIG ? "#ff2a85" : "#00e5ff";
  ctx.font = "900 26px sans-serif";
  ctx.fillText("vicelink.vercel.app", 54, 870);
}

// ==========================================
// 6. TIER & LANGUAGE SYNC + EVENT BINDINGS
// ==========================================
window.selectAccessTier = function(tier) {
  userTier = tier;
  localStorage.setItem("gta6_tier", tier);
  closeAllModals();
  syncAllUI();
};

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("gta6_lang", lang);
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key]) el.placeholder = dict[key];
  });
}

function syncAllUI() {
  applyLanguage(currentLang);
  syncHandleUI();

  document.querySelectorAll(".tier-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.settier === userTier);
  });

  const badgeLabels = {
    free: "FREE RECRUIT",
    street: "STREET PASS ($1.99)",
    kingpin: "KINGPIN VIP ($4.99)"
  };
  document.getElementById("currentTierBadge").textContent = badgeLabels[userTier] || "FREE RECRUIT";

  const adBanner = document.getElementById("adBannerSlot");
  if (adBanner) adBanner.style.display = hasAccess("street") ? "none" : "block";

  renderCheats();
  renderMap();
  renderGlitches();
  renderForum();
  renderVehicles();
  renderProperties();
  renderMechanics();
  renderQuickPrompts();
  updateAiQuotaUI();
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => { currentLang = btn.dataset.lang; syncAllUI(); });
});

document.querySelectorAll(".tier-pill").forEach(btn => {
  btn.addEventListener("click", () => selectAccessTier(btn.dataset.settier));
});

document.querySelectorAll(".plat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".plat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentPlatform = btn.dataset.platform;
    renderCheats();
  });
});

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const target = document.getElementById(`view-${btn.dataset.view}`);
    if (target) target.classList.add("active");
  });
});

document.querySelectorAll(".layer-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".layer-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentMapLayer = chip.dataset.layer;
    renderMap();
  });
});

document.getElementById("saveGlobalHandleBtn").onclick = () => {
  const val = document.getElementById("globalHandleInput").value.trim();
  if (val) {
    userHandle = val.startsWith("@") ? val : `@${val}`;
    syncHandleUI();
    renderForum();
  }
};

document.getElementById("cheatSearch").addEventListener("input", renderCheats);
document.getElementById("categoryFilter").addEventListener("change", renderCheats);
document.getElementById("statusFilter").addEventListener("change", renderCheats);
document.getElementById("favFilterBtn").addEventListener("click", () => {
  showFavsOnly = !showFavsOnly;
  document.getElementById("favFilterBtn").classList.toggle("active", showFavsOnly);
  renderCheats();
});

document.getElementById("regionFilter").addEventListener("change", renderMap);
document.getElementById("hideFoundBtn").addEventListener("click", () => {
  hideFound = !hideFound;
  document.getElementById("hideFoundBtn").classList.toggle("active", hideFound);
  renderMap();
});

const mapCanvas = document.getElementById("mapCanvas");
document.getElementById("zoomInBtn").onclick = () => { mapZoom = Math.min(mapZoom + 0.25, 2.25); mapCanvas.style.transform = `scale(${mapZoom})`; };
document.getElementById("zoomOutBtn").onclick = () => { mapZoom = Math.max(mapZoom - 0.25, 1); mapCanvas.style.transform = `scale(${mapZoom})`; };
document.getElementById("resetZoomBtn").onclick = () => { mapZoom = 1; mapCanvas.style.transform = `scale(1)`; };

document.getElementById("glitchCatFilter").addEventListener("change", renderGlitches);
document.getElementById("openProModal").onclick = () => document.getElementById("proModal").classList.remove("hidden");

const newTheoryForm = document.getElementById("newTheoryForm");
document.getElementById("toggleNewPostBtn").onclick = () => newTheoryForm.classList.toggle("hidden");
document.getElementById("cancelPostBtn").onclick = () => newTheoryForm.classList.add("hidden");
newTheoryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const titleText = document.getElementById("theoryTitle").value.trim();
  const bodyText = document.getElementById("theoryBody").value.trim();
  const newEntry = {
    id: "t_" + Date.now(),
    title: { en: titleText, es: titleText },
    tag: document.getElementById("theoryTag").value,
    author: userHandle,
    coords: document.getElementById("theoryCoords").value.trim(),
    body: { en: bodyText, es: bodyText },
    votes: 1,
    reactions: { "🔥": 1, "👽": 0, "🤯": 0, "😂": 0, "💀": 0 },
    comments: [],
    timestamp: Date.now()
  };
  theories.unshift(newEntry);
  upvotedIds.push(newEntry.id);
  localStorage.setItem("gta6_theories_v3", JSON.stringify(theories));
  localStorage.setItem("gta6_upvoted_theories", JSON.stringify(upvotedIds));
  newTheoryForm.reset();
  newTheoryForm.classList.add("hidden");
  renderForum();
});

document.getElementById("forumSearch").addEventListener("input", renderForum);
document.getElementById("forumTagFilter").addEventListener("change", renderForum);
document.getElementById("forumSort").addEventListener("change", renderForum);

document.querySelectorAll(".db-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".db-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".db-subview").forEach(v => v.classList.remove("active"));
    document.getElementById(`db-${btn.dataset.dbtab}`).classList.add("active");
  });
});

document.getElementById("clearPlannerBtn").onclick = () => {
  plannedVehicles = [];
  plannedProps = [];
  localStorage.setItem("gta6_plan_vehs", "[]");
  localStorage.setItem("gta6_plan_props", "[]");
  renderVehicles();
  renderProperties();
};

document.getElementById("vehSearch").addEventListener("input", renderVehicles);
document.getElementById("vehClassFilter").addEventListener("change", renderVehicles);
document.getElementById("vehSort").addEventListener("change", renderVehicles);

document.getElementById("aiChatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("aiUserInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  handleAiAsk(text);
});

document.getElementById("toggleApiKeyBtn").onclick = () => {
  document.getElementById("apiKeyDrawer").classList.toggle("hidden");
};
document.getElementById("saveApiKeyBtn").onclick = () => {
  geminiApiKey = document.getElementById("geminiApiKeyInput").value.trim();
  localStorage.setItem("gta6_gemini_key", geminiApiKey);
  document.getElementById("apiKeyDrawer").classList.add("hidden");
  alert("Gemini API Key saved locally!");
};

document.getElementById("aiMessages").innerHTML = `
  <div class="ai-msg bot">
    👋 <strong>${currentLang === "es" ? "¡Bienvenido a ViceLink IA!" : "Welcome to ViceLink AI!"}</strong> ${currentLang === "es" ? "Selecciona tu capítulo en el Escudo Anti-Spoilers y pregúntame sobre misiones, cajeros ATM, autos raros, fences o Easter eggs." : "Select your current story chapter in the Spoiler Shield above and ask me anything about GTA VI missions, hackable ATMs, rare free cars, fences, or Easter eggs."}
  </div>
`;

function openShareCardModal() {
  renderSocialCard();
  document.getElementById("shareCardModal").classList.remove("hidden");
}
document.getElementById("openShareCardBtn").onclick = openShareCardModal;
document.getElementById("openShareCardBtn2").onclick = openShareCardModal;

document.querySelectorAll(".social-style-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".social-style-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSocialStyle = btn.dataset.socialstyle;
    renderSocialCard();
  });
});

document.getElementById("downloadFlexCardBtn").onclick = () => {
  const canvas = document.getElementById("tiktokCanvas");
  const link = document.createElement("a");
  link.download = `ViceLink-GTA6-${currentSocialStyle}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

syncAllUI();
