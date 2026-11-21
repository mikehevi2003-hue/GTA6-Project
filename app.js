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
