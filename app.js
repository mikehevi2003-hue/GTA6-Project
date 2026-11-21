// ==========================================
// STAGE 1: CHEAT CODES & PHONE HUB
// ==========================================
const CHEATS_DATA = [
  {
    id: "invincibility",
    title: "5-Minute Invincibility",
    category: "Player",
    desc: "Makes Jason or Lucia immune to bullets, explosions, and melee damage for 5 minutes.",
    PS5: "RIGHT, X, RIGHT, LEFT, RIGHT, R1, RIGHT, LEFT, X, TRIANGLE",
    XBOX: "RIGHT, A, RIGHT, LEFT, RIGHT, RB, RIGHT, LEFT, A, Y",
    PHONE: "1-999-724-654-5537"
  },
  {
    id: "max-health-armor",
    title: "Max Health & Full Armor",
    category: "Player",
    desc: "Instantly refills health bar, body armor, and repairs current vehicle.",
    PS5: "CIRCLE, L1, TRIANGLE, R2, X, SQUARE, CIRCLE, RIGHT, SQUARE, L1, L1, L1",
    XBOX: "B, LB, Y, RT, A, X, B, RIGHT, X, LB, LB, LB",
    PHONE: "1-999-887-853"
  },
  {
    id: "lower-wanted",
    title: "Lower Wanted Level (-1 Star)",
    category: "Wanted",
    desc: "Reduces Leonida Police Department pursuit by one star.",
    PS5: "R1, R1, CIRCLE, R2, RIGHT, LEFT, RIGHT, LEFT, RIGHT, LEFT",
    XBOX: "RB, RB, B, RT, RIGHT, LEFT, RIGHT, LEFT, RIGHT, LEFT",
    PHONE: "1-999-529-93787"
  },
  {
    id: "raise-wanted",
    title: "Raise Wanted Level (+1 Star)",
    category: "Wanted",
    desc: "Increases police pursuit intensity by one star.",
    PS5: "R1, R1, CIRCLE, R2, LEFT, RIGHT, LEFT, RIGHT, LEFT, RIGHT",
    XBOX: "RB, RB, B, RT, LEFT, RIGHT, LEFT, RIGHT, LEFT, RIGHT",
    PHONE: "1-999-384-48483"
  },
  {
    id: "spawn-supercar",
    title: "Spawn Vice Exotic Supercar",
    category: "Vehicles",
    desc: "Spawns a tuned twin-turbo exotic coupe directly in front of you.",
    PS5: "R1, CIRCLE, R2, RIGHT, L1, L2, X, X, SQUARE, R1",
    XBOX: "RB, B, RT, RIGHT, LB, LT, A, A, X, RB",
    PHONE: "1-999-266-38"
  },
  {
    id: "change-weather",
    title: "Cycle Leonida Weather",
    category: "World",
    desc: "Rotates through Clear Vice Sun, Tropical Storm, Overcast, and Sunset.",
    PS5: "R2, X, L1, L1, L2, L2, L2, SQUARE",
    XBOX: "RT, A, LB, LB, LT, LT, LT, X",
    PHONE: "1-999-625-348-7246"
  }
];

let currentPlatform = "PS5";
let favorites = JSON.parse(localStorage.getItem("gta6_favs") || "[]");
let showFavsOnly = false;

const cheatsGrid = document.getElementById("cheatsGrid");
const searchInput = document.getElementById("cheatSearch");
const categoryFilter = document.getElementById("categoryFilter");
const favFilterBtn = document.getElementById("favFilterBtn");
const proModal = document.getElementById("proModal");

function renderCheats() {
  const query = searchInput.value.toLowerCase();
  const cat = categoryFilter.value;

  const filtered = CHEATS_DATA.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query);
    const matchesCat = cat === "ALL" || item.category === cat;
    const matchesFav = !showFavsOnly || favorites.includes(item.id);
    return matchesSearch && matchesCat && matchesFav;
  });

  cheatsGrid.innerHTML = filtered.map(item => {
    const isFav = favorites.includes(item.id);
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
        <div class="code-box">${item[currentPlatform]}</div>
      </div>
    `;
  }).join("");
}

window.toggleFav = function(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem("gta6_favs", JSON.stringify(favorites));
  renderCheats();
};

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

searchInput.addEventListener("input", renderCheats);
categoryFilter.addEventListener("change", renderCheats);
favFilterBtn.addEventListener("click", () => {
  showFavsOnly = !showFavsOnly;
  favFilterBtn.classList.toggle("active", showFavsOnly);
  renderCheats();
});

document.getElementById("openProModal").onclick = () => proModal.classList.remove("hidden");
document.getElementById("closeProModal").onclick = () => proModal.classList.add("hidden");

renderCheats();

// ==========================================
// STAGE 2A: INTERACTIVE LEONIDA MAP & TRACKER
// ==========================================
const LEONIDA_PINS = [
  { id: "p1", name: "Ocean Beach Neon Card #1", region: "Vice City", type: "Card", icon: "🃏", x: 73, y: 61, note: "Behind the Art Deco lifeguard tower on Ocean Drive." },
  { id: "p2", name: "Little Cuba Rooftop Jump", region: "Vice City", type: "Stunt", icon: "🔥", x: 67, y: 65, note: "Hit the construction ramp at 110+ mph over Calle Ocho." },
  { id: "p3", name: "Bayside Penthouse Safehouse", region: "Vice City", type: "Safehouse", icon: "🏠", x: 70, y: 56, note: "6-car garage + helipad access." },
  { id: "p4", name: "Sinfrontera Vault Job", region: "Vice City", type: "Robbery", icon: "💰", x: 65, y: 60, note: "Requires thermal charges and getaway boat." },
  { id: "p5", name: "Brian Heder's Canal Trailer", region: "Leonida Keys", type: "Safehouse", icon: "🏠", x: 43, y: 90, note: "Starting boat dock & smuggling stash." },
  { id: "p6", name: "Key Lento Sunken Reef Card", region: "Leonida Keys", type: "Card", icon: "🃏", x: 35, y: 94, note: "Inside the shipwreck hull 20ft underwater." },
  { id: "p7", name: "Pelican Valley Airboat Jump", region: "Grassrivers", type: "Stunt", icon: "🔥", x: 52, y: 76, note: "Launch off the rusted swamp barge." },
  { id: "p8", name: "Gator Bayou Tactical SMG", region: "Grassrivers", type: "Weapon", icon: "🔫", x: 48, y: 72, note: "Hidden inside the abandoned stilted shack." },
  { id: "p9", name: "Jack of Hearts Backroom Safe", region: "Port Gellhorn", type: "Robbery", icon: "💰", x: 26, y: 36, note: "Crack safe after midnight for $18,500." },
  { id: "p10", name: "Port Gellhorn Pawn Gold Revolver", region: "Port Gellhorn", type: "Weapon", icon: "🔫", x: 29, y: 41, note: "Complete the 3 bounty posters outside." },
  { id: "p11", name: "Ambrosia Sugar Refinery Card", region: "Ambrosia", type: "Card", icon: "🃏", x: 54, y: 46, note: "Top of the eastern conveyor silo." },
  { id: "p12", name: "Mount Kalaga Summit Fire Tower", region: "Mount Kalaga", type: "Weapon", icon: "🔫", x: 41, y: 16, note: "High-powered hunting rifle & panoramic lookout." }
];

let foundPins = JSON.parse(localStorage.getItem("gta6_found_pins") || "[]");
let hideFound = false;
let mapZoom = 1;

const mapPinsLayer = document.getElementById("mapPinsLayer");
const pinChecklist = document.getElementById("pinChecklist");
const regionFilter = document.getElementById("regionFilter");
const pinTypeFilter = document.getElementById("pinTypeFilter");
const hideFoundBtn = document.getElementById("hideFoundBtn");
const mapCanvas = document.getElementById("mapCanvas");

function renderMap() {
  const reg = regionFilter.value;
  const type = pinTypeFilter.value;

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

  mapPinsLayer.innerHTML = visiblePins.map(p => {
    const isFound = foundPins.includes(p.id);
    return `
      <button class="map-pin ${isFound ? "found" : ""}"
              style="left:${p.x}%; top:${p.y}%;"
              title="${p.name} (${p.region}) — Click to toggle found"
              onclick="togglePinFound('${p.id}')">
        ${p.icon}
      </button>
    `;
  }).join("");

  pinChecklist.innerHTML = visiblePins.map(p => {
    const isFound = foundPins.includes(p.id);
    return `
      <label class="pin-row ${isFound ? "found" : ""}">
        <input type="checkbox" ${isFound ? "checked" : ""} onchange="togglePinFound('${p.id}')" />
        <div>
          <h4>${p.icon} ${p.name}</h4>
          <p><strong>${p.region}</strong> • ${p.note}</p>
        </div>
      </label>
    `;
  }).join("");
}

window.togglePinFound = function(id) {
  if (foundPins.includes(id)) {
    foundPins = foundPins.filter(f => f !== id);
  } else {
    foundPins.push(id);
  }
  localStorage.setItem("gta6_found_pins", JSON.stringify(foundPins));
  renderMap();
};

regionFilter.addEventListener("change", renderMap);
pinTypeFilter.addEventListener("change", renderMap);
hideFoundBtn.addEventListener("click", () => {
  hideFound = !hideFound;
  hideFoundBtn.classList.toggle("active", hideFound);
  renderMap();
});

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
document.getElementById("syncCloudBtn").onclick = () => proModal.classList.remove("hidden");

renderMap();

// ==========================================
// STAGE 2B: MYSTERIES & CONSPIRACY FORUM
// ==========================================
const DEFAULT_THEORIES = [
  {
    id: "t1",
    title: "The Mount Kalaga Eye Glyph & Mount Chiliad Mural Connection",
    tag: "Chiliad Connection",
    author: "ChiliadVeteran",
    coords: "Mount Kalaga Peak • 3:00 AM Thunderstorm",
    body: "Carved into the stone behind the Mount Kalaga Fire Tower is an all-seeing eye symbol with three branching lines—matching the exact geometry of GTA V's Mount Chiliad mural. Standing at the summit during a tropical storm triggers a low-frequency hum on the car radio.",
    votes: 342,
    timestamp: 1732210000000
  },
  {
    id: "t2",
    title: "Submerged Epsilon Hatch Off the Coast of Key Lento",
    tag: "Easter Eggs",
    author: "LeonidaDiver",
    coords: "Leonida Keys • 85ft Depth",
    body: "Just like the sunken hatch in GTA V's Pacific Ocean, diving south of Key Lento reveals a reinforced metal hatch with a blinking light. Using a flashlight near the porthole plays Morse code translating to 'KIFFLOM RETURNS'.",
    votes: 218,
    timestamp: 1732200000000
  },
  {
    id: "t3",
    title: "The Grassrivers 'Skunk Ape' & Nighttime Swamp Lights",
    tag: "Grassrivers Cryptids",
    author: "BayouTracker",
    coords: "Pelican Valley • 1:00 AM – 4:00 AM",
    body: "If you shut off your airboat engine in the deep Grassrivers fog after 1 AM, thermal scopes briefly pick up a 7-foot humanoid heat signature moving between the cypress trees before vanishing.",
    votes: 164,
    timestamp: 1732190000000
  },
  {
    id: "t4",
    title: "Who is the Mysterious Suit Watching Lucia & Jason in Vice City?",
    tag: "NPC Secrets",
    author: "ViceLoreHunter",
    coords: "Ocean Drive & Port Gellhorn",
    body: "In three separate story cutscenes and outside the Sinfrontera Bank, the same unnamed NPC in a silver suit and dark sunglasses appears in the background taking notes—resembling the Strange Man / IAA handler archetype.",
    votes: 129,
    timestamp: 1732180000000
  }
];

let theories = JSON.parse(localStorage.getItem("gta6_theories") || "null") || DEFAULT_THEORIES;
let upvotedIds = JSON.parse(localStorage.getItem("gta6_upvoted_theories") || "[]");

const forumFeed = document.getElementById("forumFeed");
const forumSearch = document.getElementById("forumSearch");
const forumTagFilter = document.getElementById("forumTagFilter");
const forumSort = document.getElementById("forumSort");
const newTheoryForm = document.getElementById("newTheoryForm");

function renderForum() {
  const q = forumSearch.value.toLowerCase();
  const tag = forumTagFilter.value;
  const sort = forumSort.value;

  let list = theories.filter(t => {
    const matchQ = t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.author.toLowerCase().includes(q);
    const matchTag = tag === "ALL" || t.tag === tag;
    return matchQ && matchTag;
  });

  if (sort === "top") {
    list.sort((a, b) => b.votes - a.votes);
  } else {
    list.sort((a, b) => b.timestamp - a.timestamp);
  }

  forumFeed.innerHTML = list.map(t => {
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
            <span>Community Lore Thread</span>
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

forumSearch.addEventListener("input", renderForum);
forumTagFilter.addEventListener("change", renderForum);
forumSort.addEventListener("change", renderForum);

renderForum();

// ==========================================
// STAGE 3A: SCALABLE LANGUAGE ENGINE (EN / ES)
// ==========================================
const TRANSLATIONS = {
  en: {
    badge: "UNOFFICIAL FAN HUB",
    subtitle: "Leonida Tactical Hub & Lore Intel",
    navCheats: "Cheat Codes & Phone",
    navMap: "Leonida Map",
    navForum: "Mysteries & Theories",
    navDb: "Vehicles & Economy",
    navAi: "AI Mission Guide",
    proDesc: "Ad-free mode, cloud map sync & verified Lore Investigator badge.",
    proBtn: "Unlock Pro Access",
    legalNote: "Unofficial fan tool. Not affiliated with Rockstar Games or Take-Two Interactive.",
    cheatsTitle: "Cheat Codes & In-Game Phone Dialer",
    cheatsSub: "Instant PS5 button combos, Xbox inputs, and Leonida cell codes.",
    phoneTab: "Phone Dial",
    searchCheats: "Search cheats (e.g., Invincibility, Wanted Level, Supercar)...",
    allCats: "All Categories",
    catPlayer: "Player & Health",
    catWanted: "Wanted Level",
    catVehicles: "Vehicles",
    catWorld: "World & Weather",
    favOnly: "★ Favorites Only",
    adSlot: "SPONSORED AD SLOT (Google AdSense / Gaming Affiliate Banner — Removed for Pro Users)",
    mapTitle: "Interactive Leonida Map & 100% Tracker",
    mapSub: "Click glowing pins or check off locations to track your story completion.",
    completionLabel: "100% Completion",
    allRegions: "All 6 Leonida Regions",
    allPins: "All Pin Types",
    hideFound: "Hide Found Pins",
    cloudSync: "☁️ Cloud Sync (Pro)",
    locationsTitle: "Leonida Locations",
    locationsSub: "Check off collectibles as you discover them.",
    forumTitle: "Leonida Mysteries & Conspiracy Board",
    forumSub: "Investigate Mount Kalaga sightings, Chiliad connections, NPC secrets & Easter eggs.",
    postTheoryBtn: "+ Post New Theory",
    cancelBtn: "Cancel",
    publishBtn: "Publish to Board",
    searchForum: "Search theories, keywords, or NPC names...",
    allTags: "All Conspiracy Tags",
    sortTop: "Sort: Top Upvoted",
    sortNew: "Sort: Newest First",
    dbTitle: "Leonida Vehicles, Properties & Economy",
    dbSub: "Compare vehicle performance, business ROI, and plan your garage empire.",
    tabVehicles: "🏎️ Vehicles",
    tabProperties: "🏢 Properties & ROI",
    plannerWorth: "Planned Asset Value",
    plannerIncome: "Daily Passive Income",
    plannerGarage: "Garage Slots Used",
    clearPlan: "Reset Plan",
    searchVeh: "Search vehicles (e.g., Cheetah, Banshee, Airboat, Buccaneer)...",
    allClasses: "All Vehicle Classes",
    sortSpeed: "Sort: Top Speed",
    sortPriceLow: "Price: Low to High",
    sortPriceHigh: "Price: High to Low",
    modalTitle: "Upgrade to ViceLink Pro",
    proPerk1: "✓ Zero ads across all cheat, map & economy pages",
    proPerk2: "✓ Sync collectible map pins & Garage Plan across devices",
    proPerk3: "✓ Verified 'Lore Investigator' badge on Conspiracy Board",
    proPerk4: "✓ Unlimited AI Mission Assistant questions",
    proContinue: "Continue — $3.99 One-Time",
    addGarage: "+ Add to Garage Plan",
    inGarage: "✓ In Garage Plan",
    buyProp: "+ Add Property to Empire",
    ownedProp: "✓ Owned in Empire"
  },
  es: {
    badge: "HUB NO OFICIAL DE FANS",
    subtitle: "Guía Táctica de Leonida y Secretos",
    navCheats: "Trucos y Teléfono",
    navMap: "Mapa de Leonida",
    navForum: "Misterios y Teorías",
    navDb: "Vehículos y Economía",
    navAi: "Guía IA de Misiones",
    proDesc: "Sin anuncios, sincronización en la nube e insignia de Investigador.",
    proBtn: "Desbloquear Pro",
    legalNote: "Herramienta no oficial de fans. Sin afiliación con Rockstar Games ni Take-Two Interactive.",
    cheatsTitle: "Códigos de Trucos y Números de Teléfono",
    cheatsSub: "Combinaciones rápidas para PS5, Xbox y códigos de celular en Leonida.",
    phoneTab: "Teléfono",
    searchCheats: "Buscar trucos (ej. Invencibilidad, Nivel de Búsqueda, Superauto)...",
    allCats: "Todas las Categorías",
    catPlayer: "Jugador y Salud",
    catWanted: "Nivel de Búsqueda",
    catVehicles: "Vehículos",
    catWorld: "Mundo y Clima",
    favOnly: "★ Solo Favoritos",
    adSlot: "ESPACIO PATROCINADO (Banner de Anuncios — Oculto para Usuarios Pro)",
    mapTitle: "Mapa Interactivo de Leonida y Rastreador 100%",
    mapSub: "Haz clic en los pines o marca ubicaciones para seguir tu progreso.",
    completionLabel: "Progreso 100%",
    allRegions: "Las 6 Regiones de Leonida",
    allPins: "Todos los Marcadores",
    hideFound: "Ocultar Encontrados",
    cloudSync: "☁️ Sincronizar (Pro)",
    locationsTitle: "Ubicaciones de Leonida",
    locationsSub: "Marca los coleccionables a medida que los encuentres.",
    forumTitle: "Foro de Misterios y Conspiraciones de Leonida",
    forumSub: "Investiga avistamientos en Mount Kalaga, conexiones con Chiliad, NPCs y Easter eggs.",
    postTheoryBtn: "+ Publicar Nueva Teoría",
    cancelBtn: "Cancelar",
    publishBtn: "Publicar en el Foro",
    searchForum: "Buscar teorías, palabras clave o nombres de NPC...",
    allTags: "Todas las Etiquetas",
    sortTop: "Ordenar: Más Votadas",
    sortNew: "Ordenar: Más Recientes",
    dbTitle: "Vehículos, Propiedades y Economía de Leonida",
    dbSub: "Compara rendimiento de autos, retorno de negocios y planifica tu garaje.",
    tabVehicles: "🏎️ Vehículos",
    tabProperties: "🏢 Propiedades y ROI",
    plannerWorth: "Valor Total del Plan",
    plannerIncome: "Ingreso Pasivo Diario",
    plannerGarage: "Espacios de Garaje",
    clearPlan: "Reiniciar Plan",
    searchVeh: "Buscar vehículos (ej. Cheetah, Banshee, Airboat, Buccaneer)...",
    allClasses: "Todas las Clases",
    sortSpeed: "Ordenar: Velocidad Máx.",
    sortPriceLow: "Precio: Menor a Mayor",
    sortPriceHigh: "Precio: Mayor a Menor",
    modalTitle: "Mejora a ViceLink Pro",
    proPerk1: "✓ Cero anuncios en trucos, mapa y economía",
    proPerk2: "✓ Sincroniza tus pines del mapa y garaje en todos tus dispositivos",
    proPerk3: "✓ Insignia verificada 'Investigador de Lore' en el Foro",
    proPerk4: "✓ Preguntas ilimitadas al Asistente IA de Misiones",
    proContinue: "Continuar — $3.99 Pago Único",
    addGarage: "+ Añadir al Garaje",
    inGarage: "✓ En tu Garaje",
    buyProp: "+ Añadir Propiedad",
    ownedProp: "✓ En tu Imperio"
  }
};

let currentLang = localStorage.getItem("gta6_lang") || "en";

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

  if (typeof renderVehicles === "function") renderVehicles();
  if (typeof renderProperties === "function") renderProperties();
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
});

// ==========================================
// STAGE 3B: VEHICLES, PROPERTIES & ECONOMY
// ==========================================
const VEHICLES_DATA = [
  { id: "v1", name: "Grotti Cheetah Classic V", class: "Super", price: 1850000, topSpeed: 218, speedPct: 96, accelPct: 92, handlingPct: 90, note: "Twin-turbo Vice City icon with active rear aero." },
  { id: "v2", name: "Bravado Banshee GTS", class: "Sports", price: 940000, topSpeed: 204, speedPct: 89, accelPct: 94, handlingPct: 86, note: "High-torque V10 coupe built for Ocean Drive sprints." },
  { id: "v3", name: "Albany Buccaneer Custom", class: "Muscle", price: 420000, topSpeed: 178, speedPct: 78, accelPct: 85, handlingPct: 72, note: "Hydraulic lowrider favored across Little Cuba." },
  { id: "v4", name: "Grassrivers Swamp Airboat", class: "Marine", price: 165000, topSpeed: 112, speedPct: 55, accelPct: 76, handlingPct: 88, note: "Skims shallow wetlands and bayou trails effortlessly." },
  { id: "v5", name: "Pegassi Torero XO Leonida", class: "Super", price: 2450000, topSpeed: 224, speedPct: 99, accelPct: 96, handlingPct: 93, note: "Flagship hypercar with unmatched top-end speed." },
  { id: "v6", name: "Buckingham Maverick Twin", class: "Aircraft", price: 1350000, topSpeed: 165, speedPct: 74, accelPct: 80, handlingPct: 84, note: "Fast rooftop extraction across all 6 Leonida regions." }
];

const PROPERTIES_DATA = [
  { id: "pr1", name: "Ocean Drive Nightclub", region: "Vice City", price: 2200000, dailyIncome: 48000, slots: 10, roiDays: 46, note: "High passive cashflow + 10-car underground VIP garage." },
  { id: "pr2", name: "Bayside Penthouse Suite", region: "Vice City", price: 1450000, dailyIncome: 15000, slots: 6, roiDays: 97, note: "Helipad access, heist planning room & 6-car garage." },
  { id: "pr3", name: "Leonida Keys Smuggler Marina", region: "Leonida Keys", price: 890000, dailyIncome: 24000, slots: 4, roiDays: 37, note: "Fastest break-even ROI via offshore cargo runs." },
  { id: "pr4", name: "Port Gellhorn Chop Shop", region: "Port Gellhorn", price: 650000, dailyIncome: 19500, slots: 8, roiDays: 33, note: "Boost & strip exotic cars for rapid daily payouts." }
];

let plannedVehicles = JSON.parse(localStorage.getItem("gta6_plan_vehs") || "[]");
let plannedProps = JSON.parse(localStorage.getItem("gta6_plan_props") || "[]");

const vehiclesGrid = document.getElementById("vehiclesGrid");
const propertiesGrid = document.getElementById("propertiesGrid");
const vehSearch = document.getElementById("vehSearch");
const vehClassFilter = document.getElementById("vehClassFilter");
const vehSort = document.getElementById("vehSort");

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
  document.getElementById("plannerGarageSlots").textContent = `${plannedVehicles.length} / ${totalSlots} Slots`;
}

function renderVehicles() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const q = vehSearch.value.toLowerCase();
  const cls = vehClassFilter.value;
  const sort = vehSort.value;

  let list = VEHICLES_DATA.filter(v => {
    const matchQ = v.name.toLowerCase().includes(q) || v.note.toLowerCase().includes(q);
    const matchCls = cls === "ALL" || v.class === cls;
    return matchQ && matchCls;
  });

  if (sort === "speed") list.sort((a, b) => b.topSpeed - a.topSpeed);
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list.sort((a, b) => b.price - a.price);

  vehiclesGrid.innerHTML = list.map(v => {
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
  propertiesGrid.innerHTML = PROPERTIES_DATA.map(p => {
    const owned = plannedProps.includes(p.id);
    return `
      <div class="cheat-card">
        <div>
          <div class="card-top">
            <span class="cat-tag">${p.region} • ${p.slots} Garage Slots</span>
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
  if (plannedVehicles.includes(id)) {
    plannedVehicles = plannedVehicles.filter(x => x !== id);
  } else {
    plannedVehicles.push(id);
  }
  localStorage.setItem("gta6_plan_vehs", JSON.stringify(plannedVehicles));
  renderVehicles();
};

window.togglePlanProperty = function(id) {
  if (plannedProps.includes(id)) {
    plannedProps = plannedProps.filter(x => x !== id);
  } else {
    plannedProps.push(id);
  }
  localStorage.setItem("gta6_plan_props", JSON.stringify(plannedProps));
  renderProperties();
};

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

vehSearch.addEventListener("input", renderVehicles);
vehClassFilter.addEventListener("change", renderVehicles);
vehSort.addEventListener("change", renderVehicles);

applyLanguage(currentLang);
renderVehicles();
renderProperties();
