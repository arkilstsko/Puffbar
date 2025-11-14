// PuffLord – browser game by ChatGPT + Stephen 😄

// ------------------------------------
// CONFIG
// ------------------------------------

const PRODUCTS = [
  {
    id: "basic-breeze",
    name: "Basic Breeze",
    emoji: "💨",
    basePrice: 15,
    volatility: 0.25,
    desc: "Standard puff, alle 9. klasses favorit."
  },
  {
    id: "ice-blast",
    name: "Ice Blast",
    emoji: "🧊",
    basePrice: 22,
    volatility: 0.35,
    desc: "Iskold mentol, stort hype på TikTok."
  },
  {
    id: "rainbow-rush",
    name: "Rainbow Rush 5000",
    emoji: "🌈",
    basePrice: 35,
    volatility: 0.45,
    desc: "Alt for mange smage i én. Kids elsker den."
  },
  {
    id: "mango-madness",
    name: "Mango Madness",
    emoji: "🥭",
    basePrice: 28,
    volatility: 0.3,
    desc: "Sød mango, god margin i de rige kvarterer."
  }
];

const LOCATIONS = [
  {
    id: "downtown",
    name: "Downtown",
    priceModifier: 1.0,
    riskModifier: 1.0,
    flavor: "Balanceret marked – fine priser, moderat risiko."
  },
  {
    id: "mall",
    name: "Skymall",
    priceModifier: 1.2,
    riskModifier: 1.4,
    flavor: "Rige kids med lommepenge – men security er vågen."
  },
  {
    id: "skate-park",
    name: "Skate Park",
    priceModifier: 0.9,
    riskModifier: 0.7,
    flavor: "Billige deals, lavere risiko – men lavere priser."
  },
  {
    id: "docks",
    name: "Neon Docks",
    priceModifier: 0.8,
    riskModifier: 1.6,
    flavor: "Billige bulk-køb, høj risiko for raids."
  }
];

const MAX_LOG_ENTRIES = 40;

// ------------------------------------
// GAME STATE
// ------------------------------------

const gameState = {
  day: 1,
  money: 300,
  locationId: "downtown",
  risk: 10,
  capacityMax: 60,
  inventory: {},
  currentPrices: {},
  log: [],
  news: ""
};

// ------------------------------------
// LOG EVENT  (MOVED UP - IMPORTANT!)
// ------------------------------------

function logEvent(tag, source, text) {
  gameState.log.push({ day: gameState.day, tag, source, text });

  if (gameState.log.length > MAX_LOG_ENTRIES) {
    gameState.log.shift();
  }
}

// ------------------------------------
// INIT GAME
// ------------------------------------

function initGameState() {
  gameState.day = 1;
  gameState.money = 300;
  gameState.locationId = "downtown";
  gameState.risk = 10;
  gameState.capacityMax = 60;

  gameState.inventory = {};
  PRODUCTS.forEach(p => (gameState.inventory[p.id] = 0));

  gameState.log = [];
  gameState.news = "Velkommen til PuffLord. Køb billigt, sælg dyrt. Undgå raids.";

  generateDailyPrices();

  logEvent("New day", "Game", "Du starter som ny PuffLord-in-spe.");
}

// ------------------------------------
// HELPERS
// ------------------------------------

function getLocationById(id) {
  return LOCATIONS.find(l => l.id === id);
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

function currentCapacityUsed() {
  return Object.values(gameState.inventory).reduce((a, b) => a + b, 0);
}

function estimateInventoryValue() {
  let total = 0;
  PRODUCTS.forEach(p => {
    total += gameState.inventory[p.id] * gameState.currentPrices[p.id];
  });
  return total;
}

// ------------------------------------
// DAILY PRICES & EVENTS
// ------------------------------------

function generateDailyPrices() {
  const loc = getLocationById(gameState.locationId);
  const locMod = loc.priceModifier;

  const prices = {};
  PRODUCTS.forEach(p => {
    const rand = 1 + (Math.random() * 2 - 1) * p.volatility;
    let price = Math.round(p.basePrice * rand * locMod);
    price = Math.max(5, price);
    prices[p.id] = price;
  });

  gameState.currentPrices = prices;
  applyDailyEvent();
}

function applyDailyEvent() {
  const roll = Math.random();
  let news;

  if (roll < 0.2) {
    const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    gameState.currentPrices[p.id] = Math.round(gameState.currentPrices[p.id] * 1.5);
    news = `${p.name} går viralt på TikTok! Priserne stiger voldsomt.`;
  } else if (roll < 0.35) {
    gameState.risk = Math.min(100, gameState.risk + 8);
    news = "Politiet øger kontrol ved skoler og centre.";
  } else if (roll < 0.5) {
    news = "Stilhed i gaderne. Intet særligt sker i dag.";
  } else if (roll < 0.65) {
    const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    gameState.currentPrices[p.id] = Math.round(gameState.currentPrices[p.id] * 0.65);
    news = `Billig import! ${p.name} er på tilbud i dag.`;
  } else {
    news = "Rygter i byen: 'Priserne skifter hurtigt, hold øje.'";
  }

  gameState.news = news;
}

// ------------------------------------
// DAY CYCLE (used for end-day AND travel)
// ------------------------------------

function applyEndOfDayCycle(isTravel = false) {
  const invValue = estimateInventoryValue();
  const raidChance = 0.05 + (gameState.risk / 100) * 0.35;

  if (Math.random() < raidChance && invValue > 0) {
    const lostFraction = 0.3 + Math.random() * 0.4;
    let lostTotal = 0;

    PRODUCTS.forEach(p => {
      const cur = gameState.inventory[p.id];
      const lose = Math.floor(cur * lostFraction);
      gameState.inventory[p.id] = Math.max(0, cur - lose);
      lostTotal += lose;
    });

    const fine = Math.round(invValue * (0.15 + Math.random() * 0.15));
    gameState.money = Math.max(0, gameState.money - fine);

    logEvent("Raid", "Police", `Politiet konfiskerede buffer – mistede ${lostTotal} puffbars + bøde $${fine}.`);

    showModal("Kontrol", "Politiet lavede en kontrol – du mistede varer og fik en bøde.");

    gameState.risk = Math.max(5, Math.floor(gameState.risk * 0.4));
  }

  gameState.day++;
  gameState.risk = Math.max(0, gameState.risk - (isTravel ? 2 : 3));

  checkLoseConditions();
}

// ------------------------------------
// BUY / SELL
// ------------------------------------

function buyProduct(id) {
  const price = gameState.currentPrices[id];
  if (gameState.money < price) {
    showModal("Ingen penge", "Du har ikke råd til dette køb.");
    return;
  }

  if (currentCapacityUsed() >= gameState.capacityMax) {
    showModal("Taske fuld", "Du kan ikke bære mere.");
    return;
  }

  gameState.money -= price;
  gameState.inventory[id]++;
  gameState.risk++;

  const p = getProductById(id);
  logEvent("Buy", "Market", `Købte ${p.name} for $${price}.`);
}

function sellProduct(id) {
  if (gameState.inventory[id] <= 0) return;

  const price = gameState.currentPrices[id];
  gameState.inventory[id]--;
  gameState.money += price;
  gameState.risk = Math.max(0, gameState.risk - 1);

  const p = getProductById(id);
  logEvent("Sell", "Market", `Solgte ${p.name} for $${price}.`);
}

// ------------------------------------
// TRAVEL (counts as a new day)
// ------------------------------------

function travelTo(locationId) {
  const loc = getLocationById(locationId);
  const cost = 5;

  if (gameState.money < cost) {
    showModal("Ingen billet", "Du har ikke råd til at rejse.");
    return;
  }

  const oldLoc = getLocationById(gameState.locationId).name;

  gameState.money -= cost;
  gameState.locationId = locationId;

  logEvent("Travel", "City", `Rejser fra ${oldLoc} til ${loc.name} for $${cost}.`);

  applyEndOfDayCycle(true);
  generateDailyPrices();

  logEvent("New day", "Game", "Ny dag efter rejsen – priserne har ændret sig.");
  renderAll();
}

// ------------------------------------
// END DAY BUTTON
// ------------------------------------

function endDay() {
  applyEndOfDayCycle(false);
  generateDailyPrices();
  logEvent("New day", "Game", "Ny dag – byen ændrer sig.");
  renderAll();
}

// ------------------------------------
// RENDER UI
// ------------------------------------

function renderHeader() {
  document.getElementById("stat-day").textContent = gameState.day;
  document.getElementById("stat-money").textContent = `$${gameState.money}`;
  document.getElementById("stat-location").textContent = getLocationById(gameState.locationId).name;
  document.getElementById("stat-capacity-used").textContent = currentCapacityUsed();
  document.getElementById("stat-capacity-max").textContent = gameState.capacityMax;

  document.getElementById("risk-bar-fill").style.width = `${gameState.risk}%`;
  document.getElementById("risk-bar-text").textContent = `${gameState.risk}%`;
}

function renderInventory() {
  const el = document.getElementById("inventory-list");

  let html = `
    <div class="table-header">
      <span>Item</span><span>Qty</span><span>Avg</span><span>Value</span>
    </div>
  `;

  PRODUCTS.forEach(p => {
    const qty = gameState.inventory[p.id];
    const price = gameState.currentPrices[p.id];

    html += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${p.emoji} ${p.name}</span>
          <span class="desc">${p.desc}</span>
        </div>
        <div>${qty}</div>
        <div>~$${p.basePrice}</div>
        <div>$${qty * price}</div>
      </div>
    `;
  });

  el.innerHTML = html;
}

function renderMarket() {
  const el = document.getElementById("market-list");

  let html = `
    <div class="table-header">
      <span>Flavor</span><span>Price</span><span>Owned</span><span>Actions</span>
    </div>
  `;

  PRODUCTS.forEach(p => {
    const qty = gameState.inventory[p.id];
    const price = gameState.currentPrices[p.id];

    html += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${p.emoji} ${p.name}</span>
          <span class="desc">${p.desc}</span>
        </div>
        <div>$${price}</div>
        <div>${qty}</div>
        <div class="btn-group">
          <button class="row-btn buy-btn" data-id="${p.id}" data-action="buy" ${gameState.money >= price && currentCapacityUsed() < gameState.capacityMax ? "" : "disabled"}>Buy</button>
          <button class="row-btn sell-btn" data-id="${p.id}" data-action="sell" ${qty > 0 ? "" : "disabled"}>Sell</button>
        </div>
      </div>
    `;
  });

  el.innerHTML = html;

  el.querySelectorAll("button").forEach(btn =>
    !btn.disabled && btn.addEventListener("click", onMarketButtonClick)
  );
}

function renderLog() {
  const el = document.getElementById("event-log");
  el.innerHTML = gameState.log
    .slice()
    .reverse()
    .map(l => `<div class="log-entry"><span class="time">D${l.day}</span> ${l.text}</div>`)
    .join("");
}

function renderNews() {
  document.getElementById("news-banner").textContent = gameState.news;
}

function renderLocations() {
  const el = document.getElementById("location-buttons");

  el.innerHTML = LOCATIONS.map(loc => `
    <button class="location-btn ${loc.id === gameState.locationId ? "active" : ""}" data-loc="${loc.id}">
      <strong>${loc.name}</strong>
      <span class="meta">${loc.flavor}</span>
    </button>
  `).join("");

  el.querySelectorAll("button").forEach(btn =>
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-loc");
      if (id !== gameState.locationId) travelTo(id);
    })
  );
}

function renderAll() {
  renderHeader();
  renderInventory();
  renderMarket();
  renderNews();
  renderLog();
  renderLocations();
}

// ------------------------------------
// CLICK HANDLERS
// ------------------------------------

function onMarketButtonClick(e) {
  const id = e.target.dataset.id;
  const action = e.target.dataset.action;

  if (action === "buy") buyProduct(id);
  else sellProduct(id);

  renderAll();
}

// ------------------------------------
// LOSE CONDITIONS
// ------------------------------------

function checkLoseConditions() {
  if (gameState.money <= 0 && estimateInventoryValue() === 0) {
    showModal("Bankerot", "Du er broke og har ingen puffbars. Game over.");
  }
}

// ------------------------------------
// MODAL
// ------------------------------------

function showModal(title, body) {
  const overlay = document.getElementById("modal-overlay");
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").textContent = body;
  overlay.classList.remove("hidden");
}

function hideModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

// ------------------------------------
// INIT + EVENT LISTENERS
// ------------------------------------

function attachGlobalListeners() {
  document.getElementById("btn-end-day").addEventListener("click", endDay);
  document.getElementById("btn-new-game").addEventListener("click", () => {
    initGameState();
    renderAll();
  });

  const overlay = document.getElementById("modal-overlay");
  overlay.addEventListener("click", e => {
    if (e.target === overlay) hideModal();
  });

  document.getElementById("modal-close").addEventListener("click", hideModal);
}

document.addEventListener("DOMContentLoaded", () => {
  hideModal();
  attachGlobalListeners();
  initGameState();
  renderAll();
});
