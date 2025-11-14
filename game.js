// PuffLord – simple browser game by ChatGPT + Stephen 😄

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

function initGameState() {
  gameState.day = 1;
  gameState.money = 300;
  gameState.locationId = "downtown";
  gameState.risk = 10;
  gameState.capacityMax = 60;
  gameState.inventory = {};
  PRODUCTS.forEach(p => (gameState.inventory[p.id] = 0));
  gameState.log = [];
  gameState.news = "Velkommen til byen. Du starter med lidt lommepenge og en tom rygsæk.";

  generateDailyPrices();
  logEvent("New day", "Game", "Du starter som ny PuffLord-in-spe. Køb billigt, sælg dyrt.");
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
    const qty = gameState.inventory[p.id];
    const price = gameState.currentPrices[p.id];
    total += qty * price;
  });
  return total;
}

// ------------------------------------
// DAILY CYCLE & EVENTS
// ------------------------------------

function generateDailyPrices() {
  const location = getLocationById(gameState.locationId);
  const locMod = location.priceModifier;

  const prices = {};
  PRODUCTS.forEach(p => {
    const randomFactor = 1 + (Math.random() * 2 - 1) * p.volatility;
    let price = Math.round(p.basePrice * locMod * randomFactor);
    price = Math.max(5, price);
    prices[p.id] = price;
  });

  gameState.currentPrices = prices;
  applyDailyNewsModifier();
}

function applyDailyNewsModifier() {
  const roll = Math.random();
  let news;

  if (roll < 0.2) {
    const target = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const boost = 1.4 + Math.random() * 0.3;
    gameState.currentPrices[target.id] = Math.round(gameState.currentPrices[target.id] * boost);
    news = `Influencer-hype på ${target.name}! Priserne stiger.`;
  } else if (roll < 0.35) {
    gameState.risk = Math.min(100, gameState.risk + 8);
    news = "Politiet varsler kontrol ved skoler og centre.";
  } else if (roll < 0.5) {
    news = "Stille dag. Priserne er nogenlunde stabile.";
  } else if (roll < 0.65) {
    const target = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const cut = 0.6 + Math.random() * 0.2;
    gameState.currentPrices[target.id] = Math.max(5, Math.round(gameState.currentPrices[target.id] * cut));
    news = `Et shady lager dumpede ${target.name}. Billigt i dag!`;
  } else {
    news = "Rygter i byen siger priserne svinger vildt. Timing er alt.";
  }

  gameState.news = news;
}

function applyEndOfDayCycle(isTravel = false) {
  const inventoryValue = estimateInventoryValue();
  const riskFactor = gameState.risk / 100;
  const raidChance = 0.05 + riskFactor * 0.35;
  const roll = Math.random();

  if (roll < raidChance && inventoryValue > 0) {
    const lostFraction = 0.3 + Math.random() * 0.4;
    let totalLostUnits = 0;

    PRODUCTS.forEach(p => {
      const current = gameState.inventory[p.id];
      const lose = Math.floor(current * lostFraction);
      gameState.inventory[p.id] = Math.max(0, current - lose);
      totalLostUnits += lose;
    });

    const fine = Math.round(inventoryValue * (0.15 + Math.random() * 0.15));
    gameState.money = Math.max(0, gameState.money - fine);

    logEvent("Raid", "Police", `Du blev busted. Mistede ~${totalLostUnits} puffbars og fik en bøde på $${fine}.`);

    showModal(
      "Kontrol",
      "Politiet gennemførte en kontrol. Dit lager blev delvist konfiskeret."
    );

    gameState.risk = Math.max(5, Math.floor(gameState.risk * 0.4));
  }

  gameState.day += 1;
  gameState.risk = Math.max(0, gameState.risk - (isTravel ? 2 : 3));

  checkLoseConditions();
}

// ------------------------------------
// BUY / SELL
// ------------------------------------

function buyProduct(productId) {
  const price = gameState.currentPrices[productId];
  const used = currentCapacityUsed();

  if (gameState.money < price) {
    showModal("Ikke nok cash", "Du har ikke råd til dette køb.");
    return;
  }

  if (used >= gameState.capacityMax) {
    showModal("Backpack fuld", "Din taske er helt fyldt.");
    return;
  }

  gameState.money -= price;
  gameState.inventory[productId]++;
  gameState.risk = Math.min(100, gameState.risk + 1);

  const p = getProductById(productId);
  logEvent("Buy", "Market", `Du købte: ${p.name} for $${price}.`);
}

function sellProduct(productId) {
  if (gameState.inventory[productId] <= 0) return;

  const price = gameState.currentPrices[productId];
  gameState.inventory[productId]--;
  gameState.money += price;
  gameState.risk = Math.max(0, gameState.risk - 1);

  const p = getProductById(productId);
  logEvent("Sell", "Market", `Du solgte: ${p.name} for $${price}.`);
}

// ------------------------------------
// TRAVEL (counts as a day)
// ------------------------------------

function travelTo(locationId) {
  const loc = getLocationById(locationId);
  const travelCost = 5;

  if (gameState.money < travelCost) {
    showModal("Ingen billet", "Du har ikke råd til rejsen.");
    return;
  }

  const oldLoc = getLocationById(gameState.locationId).name;

  gameState.money -= travelCost;
  gameState.locationId = locationId;

  logEvent("Travel", "City", `Du rejste fra ${oldLoc} til ${loc.name} for $${travelCost}.`);

  applyEndOfDayCycle(true);
  generateDailyPrices();

  logEvent("New day", "Game", `Ny dag efter rejsen. Priserne ændrer sig.`);
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
// UI RENDERING
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
  const container = document.getElementById("inventory-list");
  let html = `
    <div class="table-header">
      <span>Item</span><span>Qty</span><span>Avg Cost</span><span>Value</span>
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

  container.innerHTML = html;
}

function renderMarket() {
  const container = document.getElementById("market-list");

  let html = `
    <div class="table-header">
      <span>Flavor</span><span>Price</span><span>Owned</span><span>Actions</span>
    </div>
  `;

  PRODUCTS.forEach(p => {
    const qty = gameState.inventory[p.id];
    const price = gameState.currentPrices[p.id];
    const canBuy = gameState.money >= price && currentCapacityUsed() < gameState.capacityMax;

    html += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${p.emoji} ${p.name}</span>
          <span class="desc">${p.desc}</span>
        </div>
        <div>$${price}</div>
        <div>${qty}</div>
        <div class="btn-group">
          <button class="row-btn buy-btn" data-action="buy" data-id="${p.id}" ${canBuy ? "" : "disabled"}>Buy</button>
          <button class="row-btn sell-btn" data-action="sell" data-id="${p.id}" ${qty > 0 ? "" : "disabled"}>Sell</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll("button").forEach(btn => {
    if (!btn.disabled) btn.addEventListener("click", onMarketButtonClick);
  });
}

function renderLog() {
  const container = document.getElementById("event-log");
  container.innerHTML = gameState.log
    .slice()
    .reverse()
    .map(l => `<div class="log-entry"><span class="time">D${l.day}</span> ${l.text}</div>`)
    .join("");
}

function renderNews() {
  document.getElementById("news-banner").textContent = gameState.news;
}

function renderLocations() {
  const container = document.getElementById("location-buttons");

  container.innerHTML = LOCATIONS.map(loc => `
    <button class="location-btn ${loc.id === gameState.locationId ? "active" : ""}"
            data-loc="${loc.id}">
      <strong>${loc.name}</strong>
      <span class="meta">${loc.flavor}</span>
    </button>
  `).join("");

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const locId = btn.getAttribute("data-loc");
      if (locId !== gameState.locationId) {
        travelTo(locId);
      }
    });
  });
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
// EVENT HANDLERS
// ------------------------------------

function onMarketButtonClick(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "buy") buyProduct(id);
  else sellProduct(id);

  renderAll();
}

function checkLoseConditions() {
  if (gameState.money <= 0 && estimateInventoryValue() === 0) {
    showModal(
      "Bankerot",
      "Du står tilbage uden cash og uden puffbars. Start forfra."
    );
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
// INIT
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
  hideModal(); // ALWAYS start hidden
  attachGlobalListeners();
  initGameState();
  renderAll();
});
