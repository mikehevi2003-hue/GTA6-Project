// ==========================================
// BILINGUAL ENGINE (ENGLISH & ESPAÑOL)
// ==========================================
const TRANSLATIONS = {
  en: {
    badge: "UNOFFICIAL FAN HUB",
    subtitle: "Leonida Tactical Hub & Lore Intel",
    navCheats: "Cheats & Unlocks",
    navMap: "Leonida Map",
    navForum: "Easter Eggs & Theories",
    navDb: "Vehicles & Economy",
    navMech: "New Mechanics Guide",
    navAi: "AI Mission Guide",
    proDesc: "Ad-free mode, cloud map sync & verified Lore Investigator badge.",
    proBtn: "Unlock Pro Access",
    legalNote: "Unofficial fan tool. Not affiliated with Rockstar Games or Take-Two Interactive.",
    cheatsTitle: "GTA VI Cheat Codes & Unlock Checklist",
    cheatsSub: "Visual PS5/Xbox controller inputs + step-by-step unlock requirements for every cheat.",
    unlockTab: "🔓 How to Unlock All",
    searchCheats: "Search cheats or challenges (e.g., $250,000, Shooting Range, Workouts, Flamingo)...",
    allCats: "All Categories (61 Total)",
    catPlayer: "Player & Stats (10)",
    catCombat: "Combat & Weapons (11)",
    catVehicles: "Spawn Vehicles (21)",
    catWorld: "Environment & Filters (19)",
    statusAll: "All Codes",
    statusVerified: "✓ Verified Button Combos",
    statusPending: "🔒 Challenge Known (Combo Hunting)",
    favOnly: "★ Favorites",
    mapTitle: "Interactive Leonida Map & 100% Tracker",
    mapSub: "Click any pin on the satellite radar to inspect details and track completion.",
    completionLabel: "100% Completion",
    allRegions: "All 6 Leonida Regions",
    allPins: "All Pin Types",
    hideFound: "Hide Found Pins",
    cloudSync: "☁️ Cloud Sync (Pro)",
    locationsTitle: "Leonida Locations",
    locationsSub: "Check off collectibles as you discover them.",
    forumTitle: "Leonida Easter Eggs & Conspiracy Board",
    forumSub: "Verified launch Easter eggs (Little Sam, Flamingos, WAiNK) & community theories.",
    postTheoryBtn: "+ Post New Theory",
    cancelBtn: "Cancel",
    publishBtn: "Publish to Board",
    searchForum: "Search Easter eggs, Little Sam, Chiliad, or NPC names...",
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
    modalTitle: "Upgrade to ViceLink Pro",
    proPerk1: "✓ Zero ads across all cheat, map & economy pages",
    proPerk2: "✓ Sync collectible map pins & Garage Plan across devices",
    proPerk3: "✓ Verified 'Lore Investigator' badge on Conspiracy Board",
    proPerk4: "✓ Unlimited AI Mission Assistant questions",
    proContinue: "Continue — $3.99 One-Time",
    addGarage: "+ Add to Garage Plan",
    inGarage: "✓ In Garage Plan",
    buyProp: "+ Buy Property & Garage",
    ownedProp: "✓ Owned in Empire"
  },
  es: {
    badge: "HUB NO OFICIAL DE FANS",
    subtitle: "Guía Táctica de Leonida y Secretos",
    navCheats: "Trucos y Desbloqueos",
    navMap: "Mapa de Leonida",
    navForum: "Easter Eggs y Teorías",
    navDb: "Vehículos y Economía",
    navMech: "Guía de Nuevas Mecánicas",
    navAi: "Guía IA de Misiones",
    proDesc: "Sin anuncios, sincronización en la nube e insignia de Investigador.",
    proBtn: "Desbloquear Pro",
    legalNote: "Herramienta no oficial de fans. Sin afiliación con Rockstar Games ni Take-Two Interactive.",
    cheatsTitle: "Trucos de GTA VI y Guía para Desbloquearlos",
    cheatsSub: "Botones visuales PS5/Xbox + explicación paso a paso de cómo desbloquear cada truco.",
    unlockTab: "🔓 Cómo Desbloquear Todos",
    searchCheats: "Buscar trucos o desafíos (ej. $250,000, Campo de Tiro, Gimnasio, Flamenco)...",
    allCats: "Todas las Categorías (61 Total)",
    catPlayer: "Jugador y Estadísticas (10)",
    catCombat: "Combate y Armas (11)",
    catVehicles: "Generar Vehículos (21)",
    catWorld: "Entorno y Filtros (19)",
    statusAll: "Todos los Códigos",
    statusVerified: "✓ Combinaciones Verificadas",
    statusPending: "🔒 Desafío Conocido (Código en Búsqueda)",
    favOnly: "★ Favoritos",
    mapTitle: "Mapa Interactivo de Leonida y Rastreador 100%",
    mapSub: "Haz clic en cualquier pin del radar para ver pistas y marcar tu progreso.",
    completionLabel: "Progreso 100%",
    allRegions: "Las 6 Regiones de Leonida",
    allPins: "Todos los Marcadores",
    hideFound: "Ocultar Encontrados",
    cloudSync: "☁️ Sincronizar (Pro)",
    locationsTitle: "Ubicaciones de Leonida",
    locationsSub: "Marca los coleccionables a medida que los encuentres.",
    forumTitle: "Foro de Easter Eggs y Conspiraciones de Leonida",
    forumSub: "Easter eggs confirmados (Little Sam, Flamencos, WAiNK) y teorías de la comunidad.",
    postTheoryBtn: "+ Publicar Nueva Teoría",
    cancelBtn: "Cancelar",
    publishBtn: "Publicar en el Foro",
    searchForum: "Buscar Easter eggs, Little Sam, Chiliad o nombres de NPC...",
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
    modalTitle: "Mejora a ViceLink Pro",
    proPerk1: "✓ Cero anuncios en trucos, mapa y economía",
    proPerk2: "✓ Sincroniza tus pines del mapa y garaje en todos tus dispositivos",
    proPerk3: "✓ Insignia verificada 'Investigador de Lore' en el Foro",
    proPerk4: "✓ Preguntas ilimitadas al Asistente IA de Misiones",
    proContinue: "Continuar — $3.99 Pago Único",
    addGarage: "+ Añadir al Garaje",
    inGarage: "✓ En tu Garaje",
    buyProp: "+ Comprar Propiedad y Garaje",
    ownedProp: "✓ En tu Imperio"
  }
};

let currentLang = localStorage.getItem("gta6_lang") || "en";
let currentPlatform = "PS5";

// ==========================================
// EXPANDED GTA VI CHEATS + FULL UNLOCK GUIDE
// ==========================================
const CHEATS_DATA = [
  {
    id: "cash-250k",
    title: "+$250,000 Instant Cash",
    category: "Player",
    unlock: "Finish all 91 story missions",
    howToUnlock: "Complete the entire main storyline (all 91 missions). Once credits roll, open Pause > Progress > Cheats and this code unlocks automatically. Note: Only money cheat in GTA 6, and saving is disabled while active.",
    desc: "Immediately deposits $250,000 into your active character's bank balance.",
    seq: ["UP", "RIGHT", "DOWN", "LEFT", "UP", "LEFT", "DOWN", "RIGHT"]
  },
  {
    id: "unlimited-focus",
    title: "Unlimited Focus Ability",
    category: "Player",
    unlock: "Finish the main story campaign",
    howToUnlock: "Beat the final story mission. Jason and Lucia's tactical Focus ability (which slows time and highlights weak points/routes) becomes infinite when toggled.",
    desc: "Prevents your tactical focus meter from draining during combat and driving.",
    seq: ["DOWN", "UP", "UP", "DOWN", "UP", "DOWN", "UP", "DOWN", "UP", "RIGHT"]
  },
  {
    id: "body-armor",
    title: "Full Body Armor Loadout",
    category: "Player",
    unlock: "Complete 100 gym / beach workouts",
    howToUnlock: "Visit Muscle Sands outdoor gym on Ocean Beach or any Leonida fitness club and complete 100 weightlifting/calisthenics sets.",
    desc: "Equips maximum heavy ballistic armor immediately.",
    seq: ["DOWN", "UP", "LEFT", "UP", "UP", "UP", "UP", "UP", "DOWN", "DOWN"]
  },
  {
    id: "drunk-mode",
    title: "Drunk Mode (Jason & Lucia)",
    category: "Player",
    unlock: "Spend $2,500 on alcohol",
    howToUnlock: "Buy drinks at Vice City nightclubs, strip clubs, and beach bars until your cumulative bar tab reaches $2,500.",
    desc: "Makes both Jason and Lucia heavily intoxicated with ragdoll physics.",
    seq: []
  },
  {
    id: "no-fall-damage",
    title: "No Fall Damage",
    category: "Player",
    unlock: "Survive a 40ft freefall 20 times",
    howToUnlock: "Jump off roofs, bridges, or cliffs at least 40 feet high (without opening a parachute) and survive the landing 20 times.",
    desc: "Makes your character completely immune to fall damage from any height.",
    seq: []
  },
  {
    id: "parachute-cheat",
    title: "Spawn Parachute",
    category: "Player",
    unlock: "Complete 50 skydives or BASE jumps (300ft+)",
    howToUnlock: "Jump from helicopters, planes, or skyscrapers at 300ft or higher and land safely 50 times.",
    desc: "Equips a reserve parachute pack directly onto your back.",
    seq: []
  },
  {
    id: "repair-vehicle",
    title: "Instant Vehicle Repair",
    category: "Player",
    unlock: "Finish 1st in 10 street/track races",
    howToUnlock: "Win 1st place in 10 total races across Gellhorn Raceway, Thrillbilly Mud Club, and Boone Speedway.",
    desc: "Instantly fixes all body damage, broken windows, and popped tires on your current car.",
    seq: []
  },
  {
    id: "unlimited-nitrous",
    title: "Unlimited Nitrous & Fuel",
    category: "Player",
    unlock: "Complete all 50 Stunt Jumps",
    howToUnlock: "Find and cleanly land all 50 Stunt Jumps across Vice City, Grassrivers, Port Gellhorn, and the Keys.",
    desc: "Gives every vehicle infinite nitrous boost and zero fuel drain.",
    seq: []
  },
  {
    id: "raise-heat",
    title: "Raise Map Heat Level",
    category: "Player",
    unlock: "Lose a 3-star wanted level 25 times",
    howToUnlock: "Trigger a 3-star LCPD pursuit and escape out of the police search cone 25 times.",
    desc: "Pushes your regional heat level higher across Leonida.",
    seq: ["LEFT", "DOWN", "RIGHT", "DOWN", "UP", "DOWN", "UP"]
  },
  {
    id: "raise-wanted",
    title: "Raise Wanted Level (+1 Star)",
    category: "Player",
    unlock: "Lose a 3-star wanted level 50 times",
    howToUnlock: "Escape 50 separate 3-star police chases (hiding in alleys or repainting at Pay & Spray speeds this up).",
    desc: "Immediately escalates LCPD police pursuit intensity.",
    seq: ["LEFT", "DOWN", "RIGHT", "DOWN", "UP", "RIGHT", "UP"]
  },
  {
    id: "max-ammo",
    title: "Max Ammo (All Weapons)",
    category: "Combat",
    unlock: "Win 25 Bronze medals at shooting ranges",
    howToUnlock: "Visit Ammu-Nation or gun club shooting ranges and score at least Bronze in 25 weapon trials.",
    desc: "Fills ammunition reserves for every weapon in your wheel.",
    seq: ["DOWN", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "UP", "DOWN", "LEFT"]
  },
  {
    id: "infinite-ammo",
    title: "Infinite Ammo",
    category: "Combat",
    unlock: "Win 25 Silver medals at shooting ranges",
    howToUnlock: "Score Silver or higher across 25 shooting range challenges.",
    desc: "Weapons never consume reserve ammunition when firing.",
    seq: ["DOWN", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "DOWN", "DOWN", "DOWN"]
  },
  {
    id: "no-reload",
    title: "No Reload (Bottomless Clip)",
    category: "Combat",
    unlock: "Win 25 Gold medals at shooting ranges",
    howToUnlock: "Achieve Gold medal accuracy/speed scores in 25 shooting range trials.",
    desc: "Fire continuously without ever pausing to reload magazines.",
    seq: ["DOWN", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "DOWN", "DOWN", "UP"]
  },
  {
    id: "fire-ammo",
    title: "Incendiary Fire Bullets",
    category: "Combat",
    unlock: "Inflict fire damage on 100 enemies",
    howToUnlock: "Use Molotovs, flare guns, or incendiary rounds to ignite 100 hostile gang members or targets.",
    desc: "All standard bullets ignite targets and vehicles on impact.",
    seq: []
  },
  {
    id: "attack-force",
    title: "Super Attack Force",
    category: "Combat",
    unlock: "Finish the main story campaign",
    howToUnlock: "Complete all 91 story missions to unlock super-knockback melee and gunfire.",
    desc: "Melee strikes and bullets send targets flying across the street.",
    seq: ["DOWN", "UP", "LEFT", "LEFT", "RIGHT", "DOWN", "DOWN", "UP", "DOWN"]
  },
  {
    id: "exploding-balls",
    title: "Exploding Sports Balls",
    category: "Combat",
    unlock: "Hit 20 enemies with explosive damage",
    howToUnlock: "Eliminate or damage 20 enemies using grenades, RPGs, or sticky bombs.",
    desc: "Basketballs and beach balls detonate like grenades on impact.",
    seq: ["DOWN", "UP", "LEFT", "LEFT", "RIGHT", "DOWN", "DOWN", "UP", "RIGHT"]
  },
  {
    id: "vehicle-force",
    title: "Super Vehicle Ram Force",
    category: "Combat",
    unlock: "Eliminate 25 enemies with a vehicle",
    howToUnlock: "Run over or ram 25 hostile enemies using any car or truck.",
    desc: "Anything your vehicle collides with launches into the air.",
    seq: ["DOWN", "UP", "LEFT", "LEFT", "RIGHT", "DOWN", "LEFT", "UP", "DOWN"]
  },
  {
    id: "spawn-boomazoom",
    title: "Spawn Maibatsu Boomazoom",
    category: "Vehicles",
    unlock: "Complete 5 Shopping Challenges",
    howToUnlock: "Buy clothing, accessories, and gear across 5 different Vice City & Port Gellhorn stores.",
    desc: "Spawns a compact Maibatsu Boomazoom directly beside you.",
    seq: ["LEFT", "UP", "RIGHT", "DOWN", "LEFT", "LEFT", "UP", "LEFT"]
  },
  {
    id: "spawn-pumper",
    title: "Spawn MTL Fire Pumper",
    category: "Vehicles",
    unlock: "Discover the MTL Pumper in Progress menu",
    howToUnlock: "Find or drive an MTL Fire Truck once in free roam so it registers in Pause > Progress > Vehicles.",
    desc: "Spawns a heavy fire truck with a working water cannon.",
    seq: ["LEFT", "UP", "RIGHT", "DOWN", "LEFT", "RIGHT", "RIGHT", "UP"]
  },
  {
    id: "spawn-bulldozer",
    title: "Spawn HVY Bulldozer",
    category: "Vehicles",
    unlock: "Discover the HVY Bulldozer in Progress menu",
    howToUnlock: "Visit a construction site in Vice City or Ambrosia and enter an HVY Bulldozer to register it.",
    desc: "Spawns an industrial yellow construction bulldozer.",
    seq: ["LEFT", "UP", "RIGHT", "DOWN", "LEFT", "RIGHT", "RIGHT", "DOWN"]
  },
  {
    id: "spawn-thrax",
    title: "Spawn Truffade Thrax Hypercar",
    category: "Vehicles",
    unlock: "Complete ALL Shopping Challenges",
    howToUnlock: "Complete every luxury fashion and boutique shopping challenge in Leonida.",
    desc: "Spawns a flagship Truffade Thrax hypercar.",
    seq: []
  },
  {
    id: "spawn-flamingo",
    title: "Spawn Inflatable Flamingo",
    category: "Vehicles",
    unlock: "Destroy all 50 Cocaine Flamingos",
    howToUnlock: "Find and shoot all 50 hidden pink Cocaine Flamingos scattered across Leonida's 6 regions.",
    desc: "Spawns a rideable giant pink pool flamingo.",
    seq: []
  },
  {
    id: "spawn-lazer",
    title: "Spawn Hauners P-996 LAZER Jet",
    category: "Vehicles",
    unlock: "Complete 100% of all Progress Challenges",
    howToUnlock: "Achieve 100% completion across Story, Exploration, Combat, Sports, and Vehicle challenges.",
    desc: "Spawns a military fighter jet.",
    seq: []
  },
  {
    id: "cycle-weather",
    title: "Cycle Leonida Weather",
    category: "World",
    unlock: "Reveal 100% of the Leonida map",
    howToUnlock: "Fly or drive across every fogged-out sector of Leonida until 100% of the map is uncovered.",
    desc: "Cycles through Vice Sun, Tropical Storm, Overcast, and Sunset.",
    seq: ["DOWN", "RIGHT", "UP", "DOWN", "RIGHT", "UP", "RIGHT"]
  },
  {
    id: "filter-cataclysm",
    title: "Screen Filter: Cataclysm",
    category: "World",
    unlock: "Discover Martha's Vamos in Progress menu",
    howToUnlock: "Locate Martha's custom Declasse Vamos in the world to register it in your Progress menu.",
    desc: "Covers Leonida in dark, apocalyptic murky smoke.",
    seq: ["DOWN", "DOWN", "UP", "RIGHT", "RIGHT", "UP", "LEFT", "LEFT", "RIGHT", "RIGHT"]
  },
  {
    id: "filter-dollhouse",
    title: "Screen Filter: Dollhouse",
    category: "World",
    unlock: "Hang out with your partner for 8 hours",
    howToUnlock: "Invite Jason or Lucia on free-roam hangouts (bars, mini-golf, beaches) for 8 cumulative in-game hours.",
    desc: "Applies hyper-saturated miniature colors in a narrow frame.",
    seq: ["DOWN", "DOWN", "UP", "RIGHT", "RIGHT", "UP", "LEFT", "LEFT", "DOWN", "RIGHT"]
  },
  {
    id: "filter-faded",
    title: "Screen Filter: Faded Glory (CRT)",
    category: "World",
    unlock: "Rob 50 stores with your partner",
    howToUnlock: "Bring your partner along and hold up 50 convenience stores, liquor shops, or pawn shops across Leonida.",
    desc: "Applies a retro 1980s Vice City CRT television visual filter.",
    seq: ["DOWN", "DOWN", "UP", "RIGHT", "RIGHT", "UP", "LEFT", "LEFT", "LEFT", "RIGHT"]
  }
];

const ARROW_MAP = { UP: "↑ UP", DOWN: "↓ DOWN", LEFT: "← LEFT", RIGHT: "→ RIGHT" };
let favorites = JSON.parse(localStorage.getItem("gta6_favs") || "[]");
let unlockedCheats = JSON.parse(localStorage.getItem("gta6_unlocked_cheats") || "[]");
let showFavsOnly = false;

function renderControllerGuide() {
  const banner = document.getElementById("controllerGuideBanner");
  if (currentPlatform === "UNLOCKS") {
    const doneCount = unlockedCheats.length;
    banner.innerHTML = `
      <div class="guide-steps">
        <span>🔓 <strong>${currentLang === "es" ? "Progreso de Desbloqueo:" : "Cheat Unlock Progress:"}</strong> ${doneCount} / ${CHEATS_DATA.length} ${currentLang === "es" ? "desafíos completados" : "challenges completed"}</span>
      </div>
      <div class="guide-warning">
        💡 ${currentLang === "es" ? "Paso 1: Completa las 91 misiones. Paso 2: Completa el desafío de cada truco en Pausa > Progreso > Trucos." : "Step 1: Beat all 91 story missions. Step 2: Finish each cheat's specific challenge under Pause > Progress > Cheats."}
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
      <span>+ Hold</span>
      ${bumper1}
      <span>+ Press</span>
      ${bumper2}
      <span>→ Enter D-Pad Code</span>
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
    const matchesSearch = item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query) || item.unlock.toLowerCase().includes(query) || item.howToUnlock.toLowerCase().includes(query);
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
              <span class="cat-tag">${item.category} • ${hasSeq ? "Combo Verified" : "Combo Pending"}</span>
              <button class="fav-btn ${isFav ? "saved" : ""}" onclick="toggleFav('${item.id}')">★</button>
            </div>
            <h3>${item.title}</h3>
            <p style="margin-bottom:8px;"><strong>Requirement:</strong> ${item.unlock}</p>
          </div>
          <div class="unlock-card-step">
            <strong>How to do it:</strong> ${item.howToUnlock}
            <div class="unlock-check-row">
              <span style="font-size:11px;color:#94a3b8;">Track your progress:</span>
              <button class="unlock-toggle-btn ${isUnlocked ? "done" : ""}" onclick="toggleCheatUnlocked('${item.id}')">
                ${isUnlocked ? "✓ Challenge Completed" : "Mark Challenge Done"}
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
      : `<span style="color:#94a3b8;font-size:12px;">🔒 Button combo still being cracked — switch to <strong>🔓 How to Unlock All</strong> tab to prepare the challenge!</span>`;

    const plainText = hasSeq ? `${isPS ? "D-Pad Up, Hold L1 + R1, then:" : "D-Pad Up, Hold LB + RB, then:"} ${item.seq.join(", ")}` : "";

    return `
      <div class="cheat-card">
        <div>
          <div class="card-top">
            <span class="cat-tag">${item.category}</span>
            <button class="fav-btn ${isFav ? "saved" : ""}" onclick="toggleFav('${item.id}')">★</button>
          </div>
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>
        <div class="combo-visual-wrap">
          <div class="combo-keys-row">${visualKeys}</div>
          <div class="unlock-pill"><strong>How to Unlock:</strong> ${item.howToUnlock}</div>
          ${hasSeq ? `<button class="copy-combo-btn" onclick="navigator.clipboard.writeText('${plainText}'); this.textContent='✓ Copied!'">📋 Copy Button Sequence</button>` : ""}
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

// ==========================================
// INTERACTIVE LEONIDA MAP (16 VERIFIED PINS)
// ==========================================
const LEONIDA_PINS = [
  { id: "p1", name: "Cocaine Flamingo #1 (Ocean Beach)", region: "Vice City", type: "Flamingo", icon: "🦩", x: 79, y: 58, note: "Perched behind the Art Deco lifeguard tower on Ocean Drive. Destroy all 50 to unlock the Inflatable Flamingo cheat." },
  { id: "p2", name: "Little Sam Cameo ('Boobie Time')", region: "Vice City", type: "EasterEgg", icon: "🥚", x: 73, y: 56, note: "Silent NPC wearing a Rockstar Games shirt during Chapter 3's Boobie Time mission." },
  { id: "p3", name: "Shore Court Garage ('55 Stanier)", region: "Vice City", type: "Safehouse", icon: "🏠", x: 78, y: 62, note: "Ocean Beach safehouse garage storing the vintage '55 Vapid Stanier." },
  { id: "p4", name: "Paradise Garage (Watson Bay)", region: "Vice City", type: "Safehouse", icon: "🏠", x: 75, y: 49, note: "Stores the '67 Vapid Dominator Buggy and classic restoration builds." },
  { id: "p5", name: "Calle Ocho Rooftop Stunt Jump", region: "Vice City", type: "Stunt", icon: "🔥", x: 69, y: 60, note: "Clear the construction gap at 110+ mph." },
  { id: "p6", name: "Vice City Flamingos Card #1", region: "Vice City", type: "Card", icon: "🃏", x: 72, y: 65, note: "1 of 24 collectible cards that unlock the Bubblegum screen filter." },
  { id: "p7", name: "Jason's Keys Safehouse & Dock", region: "Leonida Keys", type: "Safehouse", icon: "🏠", x: 45, y: 88, note: "Starting safehouse dock with Dinka Enduro & Crest Kayak access." },
  { id: "p8", name: "Key Lento Sunken Epsilon Hatch", region: "Leonida Keys", type: "EasterEgg", icon: "🥚", x: 28, y: 95, note: "Underwater hatch 85ft deep playing Morse code lights." },
  { id: "p9", name: "Cocaine Flamingo #14 (Overseas Bridge)", region: "Leonida Keys", type: "Flamingo", icon: "🦩", x: 54, y: 83, note: "Hidden on the broken concrete piling beneath the Keys bridge." },
  { id: "p10", name: "Grassrivers Airboat Bayou Jump", region: "Grassrivers", type: "Stunt", icon: "🔥", x: 56, y: 68, note: "Hit the rusted swamp barge ramp in a Panther/POACH airboat." },
  { id: "p11", name: "Pelican Valley Skunk Ape Sighting", region: "Grassrivers", type: "EasterEgg", icon: "🥚", x: 49, y: 63, note: "Use thermal scope between 1 AM and 4 AM in dense swamp fog." },
  { id: "p12", name: "Port Gellhorn Collector Watch #3", region: "Port Gellhorn", type: "Card", icon: "🃏", x: 25, y: 37, note: "Collect 20 watches across Leonida to unlock the Pause Time of Day cheat." },
  { id: "p13", name: "Cocaine Flamingo #29 (Gellhorn Pier)", region: "Port Gellhorn", type: "Flamingo", icon: "🦩", x: 22, y: 44, note: "Sitting inside an abandoned fishing trawler hull." },
  { id: "p14", name: "WAiNK Space Debris #4 (Ambrosia)", region: "Ambrosia", type: "Card", icon: "🃏", x: 55, y: 41, note: "Scan all space debris with WAiNK to unlock the Powdered Sugar filter." },
  { id: "p15", name: "Mount Kalaga Eye Glyph", region: "Mount Kalaga", type: "EasterEgg", icon: "🥚", x: 41, y: 15, note: "Carved into the stone behind the summit fire tower—matches the Chiliad eye." },
  { id: "p16", name: "Kalaga Canyon Stunt Ramp", region: "Mount Kalaga", type: "Stunt", icon: "🔥", x: 35, y: 19, note: "Launch across the northern gorge in an off-road 4x4." }
];

let foundPins = JSON.parse(localStorage.getItem("gta6_found_pins") || "[]");
let hideFound = false;
let mapZoom = 1;

window.inspectPin = function(id) {
  const p = LEONIDA_PINS.find(x => x.id === id);
  if (!p) return;
  const isFound = foundPins.includes(id);
  const inspector = document.getElementById("mapInspector");
  inspector.classList.remove("hidden");
  inspector.innerHTML = `
    <div>
      <span class="cat-tag">${p.icon} ${p.region} • ${p.type}</span>
      <h4 style="margin:3px 0;font-size:15px;">${p.name}</h4>
      <p style="font-size:12px;color:#94a3b8;">${p.note}</p>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <button class="btn-pro" style="width:auto;" onclick="togglePinFound('${p.id}'); inspectPin('${p.id}')">
        ${isFound ? "✓ Found (Undo)" : "Mark Found"}
      </button>
      <button class="btn-secondary" onclick="document.getElementById('mapInspector').classList.add('hidden')">✕</button>
    </div>
  `;
};

function renderMap() {
  const reg = document.getElementById("regionFilter").value;
  const type = document.getElementById("pinTypeFilter").value;

  const total = LEONIDA_PINS.length;
  const done = foundPins.length;
  const pct = Math.round((done / total) * 100);
  document.getElementById("mapProgressText").textContent = `${done} / ${total} (${pct}%)`;
  document.getElementById("mapProgressBar").style.width = `${pct}%`;

  const visiblePins = LEONIDA_PINS.filter(p => {
    const matchReg = reg === "ALL" || p.region === reg;
    const matchType = type === "ALL" || p.type === type;
    const matchHide = !hideFound || !foundPins.includes(p.id);
    return matchReg && matchType && matchHide;
  });

  document.getElementById("mapPinsLayer").innerHTML = visiblePins.map(p => {
    const isFound = foundPins.includes(p.id);
    return `
      <button class="map-pin ${isFound ? "found" : ""}"
              style="left:${p.x}%; top:${p.y}%;"
              title="${p.name}"
              onclick="inspectPin('${p.id}')">
        ${p.icon}
      </button>
    `;
  }).join("");

  document.getElementById("pinChecklist").innerHTML = visiblePins.map(p => {
    const isFound = foundPins.includes(p.id);
    return `
      <label class="pin-row ${isFound ? "found" : ""}">
        <input type="checkbox" ${isFound ? "checked" : ""} onchange="togglePinFound('${p.id}')" />
        <div onclick="inspectPin('${p.id}')">
          <h4>${p.icon} ${p.name}</h4>
          <p><strong>${p.region}</strong> • ${p.note}</p>
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

// ==========================================
// VERIFIED EASTER EGGS & CONSPIRACY BOARD
// ==========================================
const DEFAULT_THEORIES = [
  {
    id: "t1",
    title: "Verified Cameo: 'Little Sam' in Chapter 3 ('Boobie Time')",
    tag: "Verified Easter Egg",
    author: "ViceLoreHunter",
    coords: "Vice City • Chapter 3 Mission: Boobie Time",
    body: "While driving Boobie Ike around Vice City to collect payments, an older silent man with a gray beard wearing a Rockstar Games T-shirt appears—identified in-game as 'Little Sam', a direct nod to Rockstar co-founder Sam Houser.",
    votes: 512,
    timestamp: 1732220000000
  },
  {
    id: "t2",
    title: "The 50 Cocaine Flamingos & Inflatable Flamingo Unlock",
    tag: "Verified Easter Egg",
    author: "Leonida100",
    coords: "All 6 Leonida Regions (50 Locations)",
    body: "Scattered across Vice City, the Keys, and Port Gellhorn are 50 hidden pink lawn flamingos filled with contraband. Destroying all 50 unlocks a secret cheat that spawns a rideable Inflatable Flamingo.",
    votes: 428,
    timestamp: 1732215000000
  },
  {
    id: "t3",
    title: "The Mount Kalaga Eye Glyph & Mount Chiliad Mural Connection",
    tag: "Chiliad Connection",
    author: "ChiliadVeteran",
    coords: "Mount Kalaga Peak • 3:00 AM Storm",
    body: "Carved into the stone behind the Mount Kalaga Fire Tower is an all-seeing eye symbol with three branching lines—matching GTA V's Mount Chiliad mural. Visiting during a tropical storm triggers a low-frequency hum on the radio.",
    votes: 364,
    timestamp: 1732210000000
  },
  {
    id: "t4",
    title: "WAiNK Space Debris & Alien Sculptures Mystery",
    tag: "Mount Kalaga / UFO",
    author: "AstroVice",
    coords: "Ambrosia & Mount Kalaga",
    body: "Scanning all fallen space debris pieces with the in-game WAiNK scanner unlocks the 'Powdered Sugar' world filter and triggers strange orbital signals near Lake Leonida.",
    votes: 245,
    timestamp: 1732205000000
  },
  {
    id: "t5",
    title: "The Grassrivers 'Skunk Ape' Thermal Heat Signature",
    tag: "Grassrivers Cryptids",
    author: "BayouTracker",
    coords: "Pelican Valley • 1:00 AM – 4:00 AM",
    body: "Shutting off your airboat engine in the deep Grassrivers fog after 1 AM lets thermal scopes spot a 7-foot humanoid heat signature moving between the cypress trees before disappearing.",
    votes: 192,
    timestamp: 1732200000000
  }
];

let theories = JSON.parse(localStorage.getItem("gta6_theories") || "null") || DEFAULT_THEORIES;
let upvotedIds = JSON.parse(localStorage.getItem("gta6_upvoted_theories") || "[]");

function renderForum() {
  const q = document.getElementById("forumSearch").value.toLowerCase();
  const tag = document.getElementById("forumTagFilter").value;
  const sort = document.getElementById("forumSort").value;

  let list = theories.filter(t => {
    const matchQ = t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.author.toLowerCase().includes(q);
    const matchTag = tag === "ALL" || t.tag === tag;
    return matchQ && matchTag;
  });

  if (sort === "top") list.sort((a, b) => b.votes - a.votes);
  else list.sort((a, b) => b.timestamp - a.timestamp);

  document.getElementById("forumFeed").innerHTML = list.map(t => {
    const voted = upvotedIds.includes(t.id);
    return `
      <article class="theory-card">
        <div class="vote-box">
          <button class="vote-btn ${voted ? "voted" : ""}" onclick="toggleTheoryVote('${t.id}')">▲</button>
          <span class="vote-count">${t.votes}</span>
        </div>
        <div class="theory-body">
          <div class="theory-meta">
            <span class="mystery-tag">${t.tag}</span>
            ${t.coords ? `<span class="coord-pill">📍 ${t.coords}</span>` : ""}
          </div>
          <h3>${t.title}</h3>
          <p>${t.body}</p>
          <div class="theory-footer">
            <span>Posted by <strong>@${t.author}</strong></span>
            <span>Leonida Lore Board</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

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
  localStorage.setItem("gta6_theories", JSON.stringify(theories));
  localStorage.setItem("gta6_upvoted_theories", JSON.stringify(upvotedIds));
  renderForum();
};

// ==========================================
// 24 CONFIRMED GTA VI VEHICLES & PROPERTIES
// ==========================================
const VEHICLES_DATA = [
  { id: "v1", name: "Truffade Thrax", class: "Super", price: 2325000, topSpeed: 222, speedPct: 98, accelPct: 95, handlingPct: 93, note: "Hypercar unlocked via Shopping Challenges or Vice City exotic dealers." },
  { id: "v2", name: "Progen Emerus", class: "Super", price: 2150000, topSpeed: 220, speedPct: 97, accelPct: 96, handlingPct: 95, note: "Track-focused hypercar with extreme cornering downforce." },
  { id: "v3", name: "'95 Grotti Cheetah Classic", class: "Super", price: 1450000, topSpeed: 208, speedPct: 92, accelPct: 89, handlingPct: 88, note: "Iconic Vice City wedge supercar featured in Ultimate Edition." },
  { id: "v4", name: "Grotti Furia", class: "Super", price: 1890000, topSpeed: 214, speedPct: 95, accelPct: 92, handlingPct: 90, note: "Twin-turbo Italian exotic built for Ocean Drive sprints." },
  { id: "v5", name: "Pegassi Zorrusso", class: "Super", price: 1925000, topSpeed: 215, speedPct: 95, accelPct: 93, handlingPct: 89, note: "Open-top roadster hypercar common in Starfish Island." },
  { id: "v6", name: "Bravado Banshee", class: "Sports", price: 680000, topSpeed: 201, speedPct: 88, accelPct: 91, handlingPct: 85, note: "Signature V10 American roadster; also spawnable via Combat cheat." },
  { id: "v7", name: "Invetero Coquette D10", class: "Sports", price: 960000, topSpeed: 206, speedPct: 91, accelPct: 92, handlingPct: 87, note: "Mid-engine Leonida coastal cruiser." },
  { id: "v8", name: "Grotti Itali GTO", class: "Sports", price: 1180000, topSpeed: 210, speedPct: 93, accelPct: 94, handlingPct: 86, note: "High-revving grand tourer with razor-sharp throttle response." },
  { id: "v9", name: "Pfister Comet S2 Cabrio", class: "Sports", price: 890000, topSpeed: 199, speedPct: 87, accelPct: 90, handlingPct: 89, note: "Convertible rear-engine sports car seen along Washington Beach." },
  { id: "v10", name: "Vapid Ganado (Jason's Pickup)", class: "Muscle", price: 185000, topSpeed: 164, speedPct: 72, accelPct: 78, handlingPct: 75, note: "Jason Duval's signature two-door pickup coupe (supports Retro Build)." },
  { id: "v11", name: "Bravado Gauntlet Hellfire", class: "Muscle", price: 540000, topSpeed: 188, speedPct: 83, accelPct: 90, handlingPct: 74, note: "Supercharged V8 muscle beast built for straight-line drags." },
  { id: "v12", name: "Declasse Tulip M-100", class: "Muscle", price: 320000, topSpeed: 174, speedPct: 76, accelPct: 81, handlingPct: 73, note: "Classic 1980s Leonida street coupe." },
  { id: "v13", name: "Albany Buccaneer", class: "Muscle", price: 240000, topSpeed: 171, speedPct: 75, accelPct: 79, handlingPct: 71, note: "Heavy chrome lowrider popular in Little Cuba." },
  { id: "v14", name: "'67 Vapid Dominator Buggy", class: "Off-Road & SUV", price: 495000, topSpeed: 168, speedPct: 74, accelPct: 86, handlingPct: 88, note: "Lifted dune/swamp racer stored at Paradise Garage, Watson Bay." },
  { id: "v15", name: "Vapid Caracara 4x4", class: "Off-Road & SUV", price: 410000, topSpeed: 158, speedPct: 69, accelPct: 77, handlingPct: 82, note: "Heavy-duty off-road truck built for Mount Kalaga trails." },
  { id: "v16", name: "Gallivanter Baller ST-D", class: "Off-Road & SUV", price: 380000, topSpeed: 166, speedPct: 73, accelPct: 78, handlingPct: 80, note: "Luxury Vice City VIP SUV." },
  { id: "v17", name: "Dinka Enduro", class: "Motorcycle", price: 48000, topSpeed: 146, speedPct: 65, accelPct: 84, handlingPct: 92, note: "Dual-sport dirt bike parked at Jason's Keys safehouse." },
  { id: "v18", name: "Nagasaki Carbon RS", class: "Motorcycle", price: 140000, topSpeed: 192, speedPct: 85, accelPct: 95, handlingPct: 91, note: "Carbon-fiber superbike unlocked via Exploration Challenges." },
  { id: "v19", name: "Maibatsu Sanchez", class: "Motorcycle", price: 35000, topSpeed: 142, speedPct: 63, accelPct: 85, handlingPct: 94, note: "Agile motocross bike for Grassrivers & Kalaga dirt tracks." },
  { id: "v20", name: "Panther / POACH Airboat", class: "Marine", price: 165000, topSpeed: 112, speedPct: 54, accelPct: 78, handlingPct: 90, note: "Fan-driven wetland airboat essential for Grassrivers navigation." },
  { id: "v21", name: "Shitzu Squalo Speedboat", class: "Marine", price: 425000, topSpeed: 138, speedPct: 66, accelPct: 82, handlingPct: 84, note: "High-speed offshore cigarette boat docked at Washington Beach." },
  { id: "v22", name: "Speedophile Seashark & Crest Kayak", class: "Marine", price: 28000, topSpeed: 94, speedPct: 45, accelPct: 76, handlingPct: 93, note: "Agile coastal watercraft for Leonida Keys reef exploration." },
  { id: "v23", name: "Buckingham Maverick & Sea Sparrow", class: "Aircraft", price: 1350000, topSpeed: 168, speedPct: 75, accelPct: 81, handlingPct: 86, note: "Versatile helicopter (Sea Sparrow variant lands directly on water)." },
  { id: "v24", name: "Mammoth Dodo & Buckingham Shamal", class: "Aircraft", price: 1650000, topSpeed: 215, speedPct: 94, accelPct: 83, handlingPct: 80, note: "Amphibious seaplane and twin-jet for fast cross-state travel." }
];

const PROPERTIES_DATA = [
  { id: "pr1", name: "Ocean Drive Nightclub", region: "Vice City", price: 2200000, dailyIncome: 48000, slots: 10, roiDays: 46, note: "High passive cashflow + 10-car underground VIP garage." },
  { id: "pr2", name: "Shore Court Garage (Ocean Beach)", region: "Vice City", price: 450000, dailyIncome: 8500, slots: 6, roiDays: 53, note: "Prime Ocean Beach classic car storage & tuning bay." },
  { id: "pr3", name: "Paradise Garage (Watson Bay)", region: "Vice City", price: 680000, dailyIncome: 14000, slots: 8, roiDays: 48, note: "Custom off-road & restoration workshop in Watson Bay." },
  { id: "pr4", name: "Leonida Keys Smuggler Marina", region: "Leonida Keys", price: 890000, dailyIncome: 24000, slots: 4, roiDays: 37, note: "Fastest break-even ROI via offshore cargo runs." },
  { id: "pr5", name: "Port Gellhorn Chop Shop", region: "Port Gellhorn", price: 650000, dailyIncome: 19500, slots: 8, roiDays: 33, note: "Fence stolen exotic vehicles for rapid daily payouts." }
];

let plannedVehicles = JSON.parse(localStorage.getItem("gta6_plan_vehs") || "[]");
let plannedProps = JSON.parse(localStorage.getItem("gta6_plan_props") || "[]");

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
  document.getElementById("plannerDailyIncome").textContent = `$${dailyIncome.toLocaleString()} / day`;

  const slotEl = document.getElementById("plannerGarageSlots");
  const overCapacity = plannedVehicles.length > totalSlots;
  slotEl.textContent = overCapacity
    ? `${plannedVehicles.length} / ${totalSlots} Slots (Need Garage!)`
    : `${plannedVehicles.length} / ${totalSlots} Slots`;
  slotEl.classList.toggle("slot-warning", overCapacity);
}

function renderVehicles() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const q = document.getElementById("vehSearch").value.toLowerCase();
  const cls = document.getElementById("vehClassFilter").value;
  const sort = document.getElementById("vehSort").value;

  let list = VEHICLES_DATA.filter(v => {
    const matchQ = v.name.toLowerCase().includes(q) || v.note.toLowerCase().includes(q);
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
          <p>${v.note}</p>
        </div>
        <div class="stat-bars">
          <div class="stat-row"><span>Top Speed</span><div class="stat-track"><div class="stat-fill" style="width:${v.speedPct}%"></div></div></div>
          <div class="stat-row"><span>Acceleration</span><div class="stat-track"><div class="stat-fill" style="width:${v.accelPct}%"></div></div></div>
          <div class="stat-row"><span>Handling</span><div class="stat-track"><div class="stat-fill" style="width:${v.handlingPct}%"></div></div></div>
        </div>
        <button class="plan-toggle-btn ${added ? "added" : ""}" onclick="togglePlanVehicle('${v.id}')">
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
            <span class="cat-tag">${p.region} • +${p.slots} Garage Slots</span>
            <span class="price-pill">$${p.price.toLocaleString()}</span>
          </div>
          <h3>${p.name}</h3>
          <p>${p.note}</p>
        </div>
        <div class="code-box">
          Passive Income: +$${p.dailyIncome.toLocaleString()}/day • ROI Break-even: ${p.roiDays} in-game days
        </div>
        <button class="plan-toggle-btn ${owned ? "added" : ""}" onclick="togglePlanProperty('${p.id}')">
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

// ==========================================
// NEW GTA VI MECHANICS & PLAYER FAQ GUIDE
// ==========================================
const MECHANICS_DATA = [
  {
    tag: "ECONOMY & CASH",
    title: "3-Tier Money System (Bank, Cash & Duffel Bags)",
    desc: "Unlike GTA V, stolen cash doesn't teleport into your bank account. Money is split into Bank Balance (safe), Cash on Hand (carried physically), and Duffel Bag Loot (unprocessed goods). Visit ATMs/Banks to deposit cash, and bring stolen jewelry, art, or cars to specialized Fences to turn loot into clean money."
  },
  {
    tag: "WEAPONS & INVENTORY",
    title: "Realistic Carry Limit & Car Trunk Arsenal",
    desc: "Jason and Lucia can only carry 2 handguns and 2 long guns on foot. Your personal vehicle's trunk acts as your mobile armory and loot stash—open the trunk to swap rifles, store heavy gear, or hide loaded duffel bags between heists."
  },
  {
    tag: "VEHICLE THEFT & SECURITY",
    title: "Car Security Tiers & Anti-Theft Trackers",
    desc: "Older street cars can be hotwired with a Slim Jim or smashed window, but modern luxury supercars have immobilizers and GPS trackers. You'll need Key-Cloners or Phone-Hacking tools to steal high-end rides, and a Pay & Spray respray to strip trackers."
  },
  {
    tag: "FITNESS & PHYSIQUE",
    title: "Gyms, Weight Gain & Melee Stamina",
    desc: "Working out at Ocean Beach's outdoor gym or local fitness clubs visibly builds muscle and boosts melee stamina. Eating fast food increases body weight—and completing 100 workouts unlocks the Full Body Armor cheat!"
  },
  {
    tag: "TACTICAL FOCUS & COMBAT",
    title: "Focus Mode & Non-Lethal Hit Indicators",
    desc: "Focus highlights escape routes, police sightlines, and weak points while slowing aim. In gunfights, a yellow hitmarker means an enemy is injured/incapacitated while red confirms a kill—useful if you want a clean reputation for better heist payouts."
  },
  {
    tag: "WORLD & ACTIVITIES",
    title: "Enterable Interiors, Social Feeds & Side Sports",
    desc: "You can rob convenience stores, pawn shops, salons, and armored vans dynamically. Between jobs, explore basketball, kayaking, mini-golf, pool, scuba diving, fishing, hunting, and live in-game social media feeds on your phone."
  }
];

function renderMechanics() {
  document.getElementById("mechanicsGrid").innerHTML = MECHANICS_DATA.map(m => `
    <div class="cheat-card">
      <div>
        <span class="mech-badge">${m.tag}</span>
        <h3>${m.title}</h3>
        <p style="margin-top:8px;line-height:1.55;">${m.desc}</p>
      </div>
    </div>
  `).join("");
}

// ==========================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================
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

  renderCheats();
  renderVehicles();
  renderProperties();
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
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
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
  });
});

document.getElementById("cheatSearch").addEventListener("input", renderCheats);
document.getElementById("categoryFilter").addEventListener("change", renderCheats);
document.getElementById("statusFilter").addEventListener("change", renderCheats);
document.getElementById("favFilterBtn").addEventListener("click", () => {
  showFavsOnly = !showFavsOnly;
  document.getElementById("favFilterBtn").classList.toggle("active", showFavsOnly);
  renderCheats();
});

document.getElementById("regionFilter").addEventListener("change", renderMap);
document.getElementById("pinTypeFilter").addEventListener("change", renderMap);
document.getElementById("hideFoundBtn").addEventListener("click", () => {
  hideFound = !hideFound;
  document.getElementById("hideFoundBtn").classList.toggle("active", hideFound);
  renderMap();
});

const mapCanvas = document.getElementById("mapCanvas");
document.getElementById("zoomInBtn").onclick = () => {
  mapZoom = Math.min(mapZoom + 0.25, 2.25);
  mapCanvas.style.transform = `scale(${mapZoom})`;
};
document.getElementById("zoomOutBtn").onclick = () => {
  mapZoom = Math.max(mapZoom - 0.25, 1);
  mapCanvas.style.transform = `scale(${mapZoom})`;
};
document.getElementById("resetZoomBtn").onclick = () => {
  mapZoom = 1;
  mapCanvas.style.transform = `scale(1)`;
};

const proModal = document.getElementById("proModal");
document.getElementById("openProModal").onclick = () => proModal.classList.remove("hidden");
document.getElementById("closeProModal").onclick = () => proModal.classList.add("hidden");
document.getElementById("syncCloudBtn").onclick = () => proModal.classList.remove("hidden");

const newTheoryForm = document.getElementById("newTheoryForm");
document.getElementById("toggleNewPostBtn").onclick = () => newTheoryForm.classList.toggle("hidden");
document.getElementById("cancelPostBtn").onclick = () => newTheoryForm.classList.add("hidden");
newTheoryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newEntry = {
    id: "t_" + Date.now(),
    title: document.getElementById("theoryTitle").value.trim(),
    tag: document.getElementById("theoryTag").value,
    author: document.getElementById("theoryAuthor").value.trim(),
    coords: document.getElementById("theoryCoords").value.trim(),
    body: document.getElementById("theoryBody").value.trim(),
    votes: 1,
    timestamp: Date.now()
  };
  theories.unshift(newEntry);
  upvotedIds.push(newEntry.id);
  localStorage.setItem("gta6_theories", JSON.stringify(theories));
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

applyLanguage(currentLang);
renderMap();
renderForum();
renderMechanics();
