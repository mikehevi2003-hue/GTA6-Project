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

// Platform Switcher
document.querySelectorAll(".plat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".plat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentPlatform = btn.dataset.platform;
    renderCheats();
  });
});

// Sidebar Navigation
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
  });
});

// Filters & Modal
searchInput.addEventListener("input", renderCheats);
categoryFilter.addEventListener("change", renderCheats);
favFilterBtn.addEventListener("click", () => {
  showFavsOnly = !showFavsOnly;
  favFilterBtn.classList.toggle("active", showFavsOnly);
  renderCheats();
});

const proModal = document.getElementById("proModal");
document.getElementById("openProModal").onclick = () => proModal.classList.remove("hidden");
document.getElementById("closeProModal").onclick = () => proModal.classList.add("hidden");

renderCheats();
