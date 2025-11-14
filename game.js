// PuffLord – simple browser game by ChatGPT + Stephen 😄

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

// Game state
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

function getLocationById(id) {
  return LOCATIONS.find(l => l.id === id);
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

function currentCapacityUsed() {
  return Object.values(gameState.inventory).reduce((a, b) => a + b, 0);
}

function generateDailyPrices() {
  const location = getLocationById(gameState.locationId);
  const locMod = location ? location.priceModifier : 1;
  const prices = {};
  PRODUCTS.forEach(p => {
    const volatility = p.volatility;
    const randomFactor = 1 + (Math.random() * 2 - 1) * volatility; // +/- volatility
    let price = Math.round(p.basePrice * locMod * randomFactor);
    price = Math.max(5, price);
    prices[p.id] = price;
  });
  gameState.currentPrices = prices;

  applyDailyNewsModifier();
}

function applyDailyNewsModifier() {
  // Simple one-event-per-day system
  const roll = Math.random();
  let news;
  if (roll < 0.2) {
    // Hype på et random produkt (pris boost)
    const target = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const boost = 1.4 + Math.random() * 0.3;
    gameState.currentPrices[target.id] = Math.round(
      gameState.currentPrices[target.id] * boost
    );
    news = `Rygtet siger, at en influencer lavede en story med ${target.name}. Priserne stiger!`;
  } else if (roll < 0.35) {
    // crackdown i high-risk områder (øger risiko lidt)
    gameState.risk = Math.min(100, gameState.risk + 8);
    news = "Politiet varsler generel kontrol ved uddannelser og centre. Varme niveauet stiger.";
  } else if (roll < 0.5) {
    // Silent day - small stabilisation
    news = "Byen føles mærkeligt stille i dag. Priserne er nogenlunde stabile.";
  } else if (roll < 0.65) {
    // Cheap supply vibe
    const dropTarget = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const cut = 0.6 + Math.random() * 0.2;
    gameState.currentPrices[dropTarget.id] = Math.max(
      5,
      Math.round(gameState.currentPrices[dropTarget.id] * cut)
    );
    news = `En shady onkel kom forbi med et helt læs ${dropTarget.name}. Du kan købe dem billigt i dag.`;
  } else {
    news = "Snak i byen: 'Alle er på jagt efter den gode deal'. Timing betyder alt.";
  }
  gameState.news = news;
}

// UI RENDERING

function renderHeader() {
  document.getElementById("stat-day").textContent = gameState.day;
  document.getElementById("stat-money").textContent = `$${gameState.money}`;
  const loc = getLocationById(gameState.locationId);
  document.getElementById("stat-location").textContent = loc ? loc.name : "?";
  document.getElementById("stat-capacity-used").textContent = currentCapacityUsed();
  document.getElementById("stat-capacity-max").textContent = gameState.capacityMax;

  const riskFill = document.getElementById("risk-bar-fill");
  riskFill.style.width = `${gameState.risk}%`;
  document.getElementById("risk-bar-text").textContent = `${gameState.risk}%`;
}

function renderInventory() {
  const container = document.getElementById("inventory-list");
  let html = `
    <div class="table-header">
      <span>Item</span>
      <span>Qty</span>
      <span>Avg Cost</span>
      <span>Value</span>
    </div>
  `;

  PRODUCTS.forEach(p => {
    const qty = gameState.inventory[p.id] || 0;
    const price = gameState.currentPrices[p.id] || p.basePrice;
    const value = qty * price;
    const avgCostText = qty > 0 ? "~$" + p.basePrice : "-";
    html += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${p.emoji} ${p.name}</span>
          <span class="desc">${p.desc}</span>
        </div>
        <div class="qty-tag">${qty}</div>
        <div class="price-tag">${avgCostText}</div>
        <div class="price-tag">$${value}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderMarket() {
  const container = document.getElementById("market-list");
  const capacityUsed = currentCapacityUsed();

  // For at give lidt feedback om pris ift. base
  const htmlHeader = `
    <div class="table-header">
      <span>Flavor</span>
      <span>Price</span>
      <span>Owned</span>
      <span>Actions</span>
    </div>
  `;
  let rows = "";

  PRODUCTS.forEach(p => {
    const qty = gameState.inventory[p.id] || 0;
    const price = gameState.currentPrices[p.id] || p.basePrice;
    const ratio = price / p.basePrice;
    let priceClass = "";
    if (ratio <= 0.8) priceClass = "good";
    else if (ratio >= 1.25) priceClass = "bad";

    const canBuy =
      gameState.money >= price && capacityUsed < gameState.capacityMax;
    const canSell = qty > 0;

    rows += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${p.emoji} ${p.name}</span>
          <span class="desc">${p.desc}</span>
        </div>
        <div class="price-tag ${priceClass}">$${price}</div>
        <div class="qty-tag">${qty}</div>
        <div class="btn-group">
          <button class="row-btn buy-btn" data-action="buy" data-id="${p.id}" ${
      canBuy ? "" : "disabled"
    }>Buy</button>
          <button class="row-btn sell-btn" data-action="sell" data-id="${p.id}" ${
      canSell ? "" : "disabled"
    }>Sell</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = htmlHeader + rows;

  // Attach listeners
  container.querySelectorAll("button.row-btn").forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener("click", onMarketButtonClick);
  });
}

function renderLog() {
  const container = document.getElementById("event-log");
  container.innerHTML = gameState.log
    .slice()
    .reverse()
    .map(
      entry => `
      <div class="log-entry">
        <span class="time">D${entry.day}</span>
        <span>${entry.text}</span>
      </div>
    `
    )
    .join("");
}

function renderNews() {
  const banner = document.getElementById("news-banner");
  banner.textContent = gameState.news || "";
}

function renderLocations() {
  const container = document.getElementById("location-buttons");
  let html = "";
  LOCATIONS.forEach(loc => {
    const isActive = loc.id === gameState.locationId;
    html += `
      <button class="location-btn ${isActive ? "active" : ""}" data-loc="${
      loc.id
    }">
        <strong>${loc.name}</strong>
        <span class="meta">${loc.flavor}</span>
      </button>
    `;
  });
  container.innerHTML = html;

  container.querySelectorAll(".location-btn").forEach(btn => {
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

// LOGIC

function logEvent(tag, source, text) {
  gameState.log.push({
    day: gameState.day,
    tag,
    source,
    text
  });
  if (gameState.log.length > MAX_LOG_ENTRIES) {
    gameState.log.shift();
  }
}

function onMarketButtonClick(e) {
  const btn = e.currentTarget;
  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");
  if (!id || !action) return;

  if (action === "buy") {
    buyProduct(id);
  } else if (action === "sell") {
    sellProduct(id);
  }
  renderAll();
}

function buyProduct(productId) {
  const price = gameState.currentPrices[productId];
  if (price == null) return;

  if (gameState.money < price) {
    showModal(
      "Ikke nok cash",
      "Du prøver at spille stor dealer med småpenge. Tjen lidt mere først."
    );
    return;
  }
  const used = currentCapacityUsed();
  if (used >= gameState.capacityMax) {
    showModal(
      "Backpack fuld",
      "Din taske er helt pakket. Sælg noget, eller tag mindre risikable ture."
    );
    return;
  }

  gameState.money -= price;
  gameState.inventory[productId] = (gameState.inventory[productId] || 0) + 1;

  const p = getProductById(productId);
  logEvent("Buy", "Market", `Du købte 1x ${p.name} for $${price}.`);
  // Buying lidt øger heat
  gameState.risk = Math.min(100, gameState.risk + 1);
}

function sellProduct(productId) {
  const qty = gameState.inventory[productId] || 0;
  if (qty <= 0) return;

  const price = gameState.currentPrices[productId];
  if (price == null) return;

  gameState.inventory[productId] = qty - 1;
  gameState.money += price;

  const p = getProductById(productId);
  logEvent("Sell", "Market", `Du solgte 1x ${p.name} for $${price}.`);
  // Selling sænker lidt heat, du tømmer lageret
  gameState.risk = Math.max(0, gameState.risk - 1);
}

function travelTo(locationId) {
  const loc = getLocationById(locationId);
  if (!loc) return;

  // Lille rejse-cost
  const travelCost = 5;
  if (gameState.money < travelCost) {
    showModal(
      "Ingen billet",
      "Du har ikke engang råd til busbilletten. Få solgt lidt først."
    );
    return;
  }

  // Betal for rejsen
  gameState.money -= travelCost;
  const oldLoc = getLocationById(gameState.locationId).name;
  gameState.locationId = locationId;

  logEvent(
    "Travel",
    "City",
    `Du rejser fra ${oldLoc} til ${loc.name} og bruger $${travelCost}.`
  );

  // REJSE = NY DAG
  applyEndOfDayCycle(true);

  // Ny dag = nye priser
  generateDailyPrices();
  logEvent(
    "New day",
    "Game",
    `Ny dag efter rejsen. Byen føles anderledes, og priserne ændrer sig.`
  );

  renderAll();
}


  gameState.money -= travelCost;
  gameState.locationId = locationId;
  logEvent(
    "Travel",
    "City",
    `Du tager afsted mod ${loc.name}. Du bruger $${travelCost} på at komme derhen.`
  );

  // Skift lokation kan ændre heat lidt
  const locRisk = loc.riskModifier;
  if (locRisk > 1.2) {
    gameState.risk = Math.min(100, gameState.risk + 3);
  } else if (locRisk < 0.9) {
    gameState.risk = Math.max(0, gameState.risk - 2);
  }

  generateDailyPrices();
  renderAll();
}

function endDay() {
  // Check for raid based on risk + inventory
  const inventoryValue = estimateInventoryValue();
  const riskFactor = gameState.risk / 100;
  const chanceBase = 0.05 + riskFactor * 0.35; // 5% to 40%
  const roll = Math.random();

  if (roll < chanceBase && inventoryValue > 0) {
    // Raid happens
    const lostFraction = 0.3 + Math.random() * 0.4; // 30–70%
    let totalLostUnits = 0;
    PRODUCTS.forEach(p => {
      const current = gameState.inventory[p.id] || 0;
      if (current > 0) {
        const lose = Math.floor(current * lostFraction);
        gameState.inventory[p.id] = Math.max(0, current - lose);
        totalLostUnits += lose;
      }
    });
    const fine = Math.round(inventoryValue * (0.15 + Math.random() * 0.15));

    if (totalLostUnits > 0) {
      gameState.money = Math.max(0, gameState.money - fine);
      logEvent(
        "Raid",
        "Police",
        `En uanmeldt kontrol snuppede ca. ${totalLostUnits} puffbars og gav dig en bøde på $${fine}.`
      );
      showModal(
        "Skole + politi = bad combo",
        `En kontrol ramte dig i dag. En stor del af dit lager blev konfiskeret, og du måtte hoste op med en bøde. Måske skal du skrue lidt ned for varmen.`
      );
      gameState.risk = Math.max(5, Math.floor(gameState.risk * 0.4));
    }
  } else {
    logEvent(
      "Quiet Night",
      "City",
      "Dagen går uden at nogen mistænker noget. Du sover (nogenlunde) roligt."
    );
  }

  gameState.day += 1;

  // Lidt passiv heat-decay
  gameState.risk = Math.max(0, gameState.risk - 3);

  checkLoseConditions();

  generateDailyPrices();
  logEvent("New day", "Game", `Ny dag. Byen har ændret sig lidt, priserne også.`);
  renderAll();
}

function estimateInventoryValue() {
  let total = 0;
  PRODUCTS.forEach(p => {
    const qty = gameState.inventory[p.id] || 0;
    const price = gameState.currentPrices[p.id] || p.basePrice;
    total += qty * price;
  });
  return total;
}

function checkLoseConditions() {
  if (gameState.money <= 0 && estimateInventoryValue() === 0) {
    showModal(
      "Bankerot",
      "Du står tilbage uden cash og uden puffbars. PuffLord-drømmen sluttede lidt for tidligt. Start et nyt spil og prøv at spille den smartere."
    );
  }
}

// MODAL

function showModal(title, body) {
  const overlay = document.getElementById("modal-overlay");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");

  titleEl.textContent = title;
  bodyEl.textContent = body;
  overlay.classList.remove("hidden");
}

function hideModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

// INIT

function attachGlobalListeners() {
  document.getElementById("btn-end-day").addEventListener("click", () => {
    endDay();
  });
  document.getElementById("btn-new-game").addEventListener("click", () => {
    initGameState();
    renderAll();
  });
  document.getElementById("modal-close").addEventListener("click", hideModal);
  document.getElementById("modal-overlay").addEventListener("click", e => {
    if (e.target.id === "modal-overlay") hideModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachGlobalListeners();
  initGameState();
  renderAll();
});
