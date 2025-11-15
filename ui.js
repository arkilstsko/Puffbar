// ui.js
// Rendering logic for the mobile-native PuffLord experience.

import {
  PRODUCTS,
  LOCATIONS,
  INVESTMENTS,
  PRESTIGE_CONFIG,
} from "./config.js";
import {
  gameState,
  currentCapacityUsed,
  currentCapacityMax,
  warehouseCapacityUsed,
  currentWarehouseCapacity,
  getTransportOption,
  calculateNetWorth,
} from "./state.js";
import {
  buyProduct,
  sellProduct,
  getEffectiveBuyPrice,
  getEffectiveSellPrice,
} from "./market.js";
import { moveToWarehouse, moveToBackpack } from "./storage.js";
import {
  purchaseBackpackUpgrade,
  purchaseTransportUpgrade,
  purchaseWarehouseUpgrade,
  canPrestige,
  triggerPrestige,
  getBackpackProgress,
  getTransportProgress,
  getWarehouseProgress,
} from "./upgrades.js";
import { purchaseInvestment } from "./investments.js";
import {
  travelTo,
  endDay,
  getTravelOptions,
  getTravelContext,
  getTravelPreview,
} from "./travel.js";
import { claimQuestReward, refreshQuestPool } from "./quests.js";
import { clearSave } from "./save.js";
import { showModal } from "./modal.js";
import { initGlobalGestures, attachRowGestures, initSlideGesture } from "./gestures.js";
import { hapticMedium, hapticShort } from "./feedback.js";

const dom = {
  hero: document.getElementById("home-hero"),
  stats: document.getElementById("home-stats"),
  inventory: document.getElementById("inventory-list"),
  log: document.getElementById("event-log"),
  riskLabel: document.getElementById("home-risk"),
  marketList: document.getElementById("market-products"),
  warehouseList: document.getElementById("warehouse-list"),
  warehouseCapacity: document.getElementById("warehouse-capacity"),
  travelLocation: document.getElementById("travel-location"),
  travelFlavor: document.getElementById("travel-flavor"),
  travelStats: document.getElementById("travel-stats"),
  travelOpen: document.getElementById("btn-open-travel"),
  travelCostSummary: document.getElementById("travel-cost-summary"),
  travelLocations: document.getElementById("travel-locations"),
  travelTrack: document.querySelector("#travel-confirm .slide-track"),
  travelThumb: document.getElementById("travel-thumb"),
  questsList: document.getElementById("quests-list"),
  questRewards: document.getElementById("quest-rewards-grid"),
  questRefresh: document.getElementById("btn-quest-refresh"),
  upgradesList: document.getElementById("upgrades-list"),
  investmentsList: document.getElementById("investments-list"),
  upgradePoints: document.getElementById("upgrade-points"),
};

let frameworkApp = null;
let travelSheet = null;
let activeTab = "home";
let renderQueued = false;
let selectedTravelId = null;
const priceCache = new Map();
const productNodes = new Map();
const inventoryNodes = new Map();
const warehouseNodes = new Map();

export function initUI({ app }) {
  frameworkApp = app;
  setupTabNavigation();
  setupButtons();
  setupTravelSheet();
  setupGestures();
  renderAll();
}

export function renderAll() {
  renderHero();
  renderStats();
  renderInventory();
  renderMarket();
  renderWarehouse();
  renderLog();
  renderTravel();
  renderQuests();
  renderUpgrades();
  renderInvestments();
}

export function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderAll();
  });
}

function setupTabNavigation() {
  const links = document.querySelectorAll("#main-tabbar .tab-link");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const tab = link.dataset.tab;
      setActiveTab(tab);
    });
  });
}

function setActiveTab(tab) {
  if (tab === activeTab) return;
  const previous = document.getElementById(`view-${activeTab}`);
  const target = document.getElementById(`view-${tab}`);
  activeTab = tab;
  document
    .querySelectorAll(".view.tab")
    .forEach((view) => view.classList.toggle("tab-active", view === target));
  document
    .querySelectorAll("#main-tabbar .tab-link")
    .forEach((link) => link.classList.toggle("tab-link-active", link.dataset.tab === tab));
  if (frameworkApp) {
    frameworkApp.tab.show(`#view-${tab}`, true);
  }
  if (target) {
    target.classList.add("tab-enter");
    setTimeout(() => target.classList.remove("tab-enter"), 320);
  }
}

function setupButtons() {
  const fabEndDay = document.getElementById("fab-end-day");
  if (fabEndDay) {
    fabEndDay.addEventListener("click", () => {
      if (endDay()) {
        hapticMedium();
        scheduleRender();
      }
    });
  }

  const marketInfo = document.getElementById("btn-market-info");
  if (marketInfo) {
    marketInfo.addEventListener("click", () => {
      showModal(
        "Street Deals",
        "Priserne ændrer sig dagligt. Swipe højre for hurtigt køb og venstre for hurtigt salg.",
        { html: false }
      );
    });
  }

  const openWarehouse = document.getElementById("btn-open-warehouse");
  if (openWarehouse) {
    openWarehouse.addEventListener("click", () => {
      setActiveTab("market");
      requestAnimationFrame(() => {
        document.getElementById("warehouse-section")?.scrollIntoView({
          behavior: "smooth",
        });
      });
    });
  }

  if (dom.travelOpen) {
    dom.travelOpen.addEventListener("click", openTravelSheet);
  }

  if (dom.questRefresh) {
    dom.questRefresh.addEventListener("click", () => {
      refreshQuestPool();
      scheduleRender();
    });
  }
}

function setupTravelSheet() {
  const el = document.getElementById("travel-sheet");
  if (!el || !frameworkApp) return;
  travelSheet = frameworkApp.sheet.create({
    el,
    swipeToClose: true,
    backdrop: true,
    closeByOutsideClick: true,
    on: {
      open: () => renderTravelSheet(),
    },
  });
  initSlideGesture(dom.travelTrack, dom.travelThumb, {
    onConfirm: () => {
      if (!selectedTravelId) return;
      const success = travelTo(selectedTravelId);
      if (success) {
        travelSheet.close();
        scheduleRender();
      } else {
        showModal("Kan ikke rejse", "Tjek om du har nok kontanter og ikke allerede er der.");
      }
    },
  });
}

function setupGestures() {
  const surface = document.getElementById("app");
  initGlobalGestures(surface, {
    onSwipeDown: () => {
      if (endDay()) {
        hapticMedium();
        scheduleRender();
      }
    },
    onSwipeUp: () => {
      openTravelSheet();
    },
  });
}

function openTravelSheet() {
  if (!travelSheet) return;
  ensureTravelSelection();
  travelSheet.open();
  renderTravelSheet();
}

function ensureTravelSelection() {
  if (selectedTravelId && selectedTravelId !== gameState.locationId) return;
  const options = getTravelOptions().filter((opt) => !opt.isCurrent);
  selectedTravelId = options.length ? options[0].id : null;
}

function renderHero() {
  if (!dom.hero) return;
  const location = LOCATIONS.find((loc) => loc.id === gameState.locationId);
  dom.hero.innerHTML = `
    <div class="hero-row">
      <span class="hero-day">Dag ${gameState.day}</span>
      <span class="hero-cash">${formatCash(gameState.money)}</span>
    </div>
    <div class="hero-location">${location?.name ?? "Unknown"}</div>
    <p>${gameState.news || "Hold øje med næste bølge af deals."}</p>
  `;
}

function renderStats() {
  if (!dom.stats) return;
  const statsData = [
    { key: "net-worth", label: "Net Worth", value: formatCash(calculateNetWorth()) },
    {
      key: "capacity",
      label: "Backpack",
      value: `${currentCapacityUsed()}/${currentCapacityMax()}`,
    },
    {
      key: "warehouse",
      label: "Warehouse",
      value: `${warehouseCapacityUsed()}/${currentWarehouseCapacity()}`,
    },
    {
      key: "heat",
      label: "Heat",
      value: `${gameState.risk}%`,
    },
    {
      key: "transport",
      label: "Transport",
      value: getTransportOption()?.name ?? "-",
    },
  ];

  const fragment = document.createDocumentFragment();
  for (const stat of statsData) {
    let card = dom.stats.querySelector(`[data-key="${stat.key}"]`);
    if (!card) {
      card = document.createElement("article");
      card.className = "stat-card";
      card.dataset.key = stat.key;
    }
    card.innerHTML = `<span>${stat.label}</span><strong>${stat.value}</strong>`;
    fragment.appendChild(card);
  }
  dom.stats.replaceChildren(fragment);
  if (dom.riskLabel) {
    dom.riskLabel.textContent = `Heat ${gameState.risk}%`;
  }
}

function renderInventory() {
  if (!dom.inventory) return;
  const fragment = document.createDocumentFragment();
  for (const product of PRODUCTS) {
    const qty = gameState.inventory[product.id] || 0;
    if (!inventoryNodes.has(product.id)) {
      const item = document.createElement("div");
      item.className = "list-item inventory-item";
      item.dataset.id = product.id;
      const button = document.createElement("button");
      button.textContent = "Store";
      button.addEventListener("click", () => {
        if (moveToWarehouse(product.id)) {
          scheduleRender();
        }
      });
      item.appendChild(createProductTitle(product));
      const qtyEl = document.createElement("div");
      qtyEl.className = "list-qty";
      item.appendChild(qtyEl);
      const worthEl = document.createElement("div");
      worthEl.className = "list-worth";
      item.appendChild(worthEl);
      const action = document.createElement("div");
      action.className = "list-action";
      action.appendChild(button);
      item.appendChild(action);
      inventoryNodes.set(product.id, { item, qtyEl, worthEl, button });
    }
    const { item, qtyEl, worthEl, button } = inventoryNodes.get(product.id);
    qtyEl.innerHTML = `<span>Qty</span><strong>${qty}</strong>`;
    const price = getEffectiveSellPrice(product.id) || gameState.currentPrices[product.id] || product.basePrice;
    worthEl.innerHTML = `<span>Value</span><strong>${formatCash(qty * price)}</strong>`;
    button.disabled = qty <= 0 || warehouseCapacityUsed() >= currentWarehouseCapacity();
    fragment.appendChild(item);
  }
  dom.inventory.replaceChildren(fragment);
}

function renderMarket() {
  if (!dom.marketList) return;
  const fragment = document.createDocumentFragment();
  for (const product of PRODUCTS) {
    if (!productNodes.has(product.id)) {
      const card = document.createElement("div");
      card.className = "product-card";
      card.dataset.id = product.id;
      const header = document.createElement("div");
      header.className = "product-header";
      const title = createProductTitle(product);
      const priceEl = document.createElement("div");
      priceEl.className = "product-price";
      header.appendChild(title);
      header.appendChild(priceEl);

      const meta = document.createElement("div");
      meta.className = "product-meta";

      const actions = document.createElement("div");
      actions.className = "product-actions";
      const buyBtn = document.createElement("button");
      buyBtn.textContent = "Buy";
      buyBtn.addEventListener("click", () => {
        if (buyProduct(product.id)) {
          scheduleRender();
        }
      });
      const sellBtn = document.createElement("button");
      sellBtn.textContent = "Sell";
      sellBtn.addEventListener("click", () => {
        if (sellProduct(product.id)) {
          scheduleRender();
        }
      });
      actions.appendChild(buyBtn);
      actions.appendChild(sellBtn);

      card.appendChild(header);
      card.appendChild(meta);
      card.appendChild(actions);
      attachRowGestures(card, {
        onSwipeRight: () => {
          if (buyProduct(product.id)) {
            scheduleRender();
          }
        },
        onSwipeLeft: () => {
          if (sellProduct(product.id)) {
            scheduleRender();
          }
        },
      });
      productNodes.set(product.id, { card, priceEl, meta, buyBtn, sellBtn });
    }
    const owned = gameState.inventory[product.id] || 0;
    const price = gameState.currentPrices[product.id] || product.basePrice;
    const buyPrice = getEffectiveBuyPrice(product.id) || price;
    const sellPrice = getEffectiveSellPrice(product.id) || price;
    const { card, priceEl, meta, buyBtn, sellBtn } = productNodes.get(product.id);
    priceEl.textContent = formatCash(price);
    meta.innerHTML = `
      <span>Buy ${formatCash(buyPrice)}</span>
      <span>Sell ${formatCash(sellPrice)}</span>
      <span>Owned ${owned}</span>
    `;
    buyBtn.disabled = gameState.money < buyPrice || currentCapacityUsed() >= currentCapacityMax();
    sellBtn.disabled = owned <= 0;
    applyPriceChange(card, product.id, price);
    fragment.appendChild(card);
  }
  dom.marketList.replaceChildren(fragment);
}

function renderWarehouse() {
  if (!dom.warehouseList) return;
  const fragment = document.createDocumentFragment();
  for (const product of PRODUCTS) {
    if (!warehouseNodes.has(product.id)) {
      const item = document.createElement("div");
      item.className = "warehouse-card list-item";
      item.dataset.id = product.id;
      const title = createProductTitle(product);
      const qtyEl = document.createElement("div");
      qtyEl.className = "list-qty";
      const worthEl = document.createElement("div");
      worthEl.className = "list-worth";
      const action = document.createElement("div");
      action.className = "list-action";
      const button = document.createElement("button");
      button.textContent = "Take";
      button.addEventListener("click", () => {
        if (moveToBackpack(product.id)) {
          scheduleRender();
        }
      });
      action.appendChild(button);
      item.appendChild(title);
      item.appendChild(qtyEl);
      item.appendChild(worthEl);
      item.appendChild(action);
      warehouseNodes.set(product.id, { item, qtyEl, worthEl, button });
    }
    const stored = gameState.warehouse[product.id] || 0;
    const price = gameState.currentPrices[product.id] || product.basePrice;
    const { item, qtyEl, worthEl, button } = warehouseNodes.get(product.id);
    qtyEl.innerHTML = `<span>Stored</span><strong>${stored}</strong>`;
    worthEl.innerHTML = `<span>Value</span><strong>${formatCash(stored * Math.round(price * 0.9))}</strong>`;
    button.disabled =
      stored <= 0 || currentCapacityUsed() >= currentCapacityMax();
    fragment.appendChild(item);
  }
  dom.warehouseList.replaceChildren(fragment);
  if (dom.warehouseCapacity) {
    dom.warehouseCapacity.textContent = `${warehouseCapacityUsed()}/${currentWarehouseCapacity()}`;
  }
}

function renderLog() {
  if (!dom.log) return;
  const recent = gameState.log.slice(-8).reverse();
  const fragment = document.createDocumentFragment();
  for (const entry of recent) {
    const item = document.createElement("div");
    item.className = "timeline-entry";
    item.innerHTML = `<div><strong>${entry.tag}</strong><span>${entry.text}</span></div>`;
    fragment.appendChild(item);
  }
  dom.log.replaceChildren(fragment);
}

function renderTravel() {
  const context = getTravelContext();
  if (dom.travelLocation) {
    dom.travelLocation.textContent = context.location?.name ?? "?";
  }
  if (dom.travelFlavor) {
    dom.travelFlavor.textContent = context.location?.flavor ?? "";
  }
  if (dom.travelStats) {
    const cards = [
      { label: "Heat", value: `${gameState.risk}%` },
      { label: "Cash", value: formatCash(gameState.money) },
      { label: "Visited", value: `${context.visitedToday.length}` },
      { label: "Transport", value: context.transport?.name ?? "-" },
    ];
    const fragment = document.createDocumentFragment();
    for (const card of cards) {
      const el = document.createElement("div");
      el.className = "travel-stat-card";
      el.innerHTML = `<span>${card.label}</span><strong>${card.value}</strong>`;
      fragment.appendChild(el);
    }
    dom.travelStats.replaceChildren(fragment);
  }
}

function renderTravelSheet() {
  if (!travelSheet) return;
  ensureTravelSelection();
  const options = getTravelOptions();
  const fragment = document.createDocumentFragment();
  for (const option of options) {
    const card = document.createElement("div");
    card.className = "location-card";
    if (option.id === selectedTravelId) {
      card.classList.add("location-selected");
    }
    if (option.isCurrent) {
      card.classList.add("location-current");
    }
    card.innerHTML = `
      <h3>${option.name}</h3>
      <p>${option.flavor}</p>
      <div class="location-meta">
        <span>Travel $${option.travelCost}</span>
        <span>Heat +${option.riskDelta}</span>
        <span>Prices x${option.priceModifier.toFixed(2)}</span>
        <span>Risk x${option.riskModifier.toFixed(2)}</span>
      </div>
    `;
    if (option.isCurrent) {
      const badge = document.createElement("span");
      badge.className = "location-badge";
      badge.textContent = "Current";
      card.appendChild(badge);
    }
    card.addEventListener("click", () => {
      if (option.isCurrent) return;
      selectedTravelId = option.id;
      renderTravelSheet();
      updateTravelSummary();
    });
    fragment.appendChild(card);
  }
  dom.travelLocations.replaceChildren(fragment);
  updateTravelSummary();
}

function updateTravelSummary() {
  if (!dom.travelCostSummary) return;
  if (!selectedTravelId || selectedTravelId === gameState.locationId) {
    dom.travelCostSummary.textContent = "Vælg et distrikt for at se pris";
    return;
  }
  const preview = getTravelPreview(selectedTravelId);
  const afford = gameState.money >= preview.cost;
  dom.travelCostSummary.textContent = `${preview.name}: ${formatCash(preview.cost)} · Heat +${preview.riskDelta}`;
  if (!afford) {
    dom.travelCostSummary.textContent += " · Ikke nok cash";
  }
}

function renderQuests() {
  if (!dom.questsList || !dom.questRewards) return;
  const active = gameState.quests.filter((quest) => !quest.completed && !quest.failed);
  const completed = gameState.quests.filter((quest) => quest.completed && !quest.claimed);
  const fragment = document.createDocumentFragment();
  for (const quest of active) {
    const progressRatio = Math.min(1, quest.progress / quest.target);
    const card = document.createElement("div");
    card.className = "quest-card";
    const subtitle = quest.type === "travel-chain"
      ? `Heat max ${quest.meta.maxRisk}%`
      : quest.type === "profit"
      ? "Daglig netto profit"
      : "Sælg beholdning fra start";
    card.innerHTML = `
      <div class="quest-header">
        <div>
          <div class="quest-title">${quest.title}</div>
          <div class="quest-subtitle">${subtitle}</div>
        </div>
        <span>${quest.progress}/${quest.target}</span>
      </div>
      <div class="quest-progress"><div class="quest-progress-bar" style="width:${progressRatio * 100}%"></div></div>
      <div class="quest-footer">
        <span>${quest.description}</span>
        <span>Reward: ${formatReward(quest.reward)}</span>
      </div>
    `;
    fragment.appendChild(card);
  }
  dom.questsList.replaceChildren(fragment);

  const rewardFragment = document.createDocumentFragment();
  for (const quest of completed) {
    const card = document.createElement("div");
    card.className = "reward-card";
    card.innerHTML = `
      <strong>${quest.title}</strong>
      <span>${formatReward(quest.reward)}</span>
      <button class="primary-btn">Claim</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      if (claimQuestReward(quest.id)) {
        scheduleRender();
      }
    });
    rewardFragment.appendChild(card);
  }
  dom.questRewards.replaceChildren(rewardFragment);
}

function renderUpgrades() {
  if (!dom.upgradesList) return;
  const backpack = getBackpackProgress();
  const transport = getTransportProgress();
  const warehouse = getWarehouseProgress();
  const prestigeReady = canPrestige();

  const sections = [
    {
      id: "backpack",
      title: "Backpack",
      current: backpack.current,
      next: backpack.next,
      action: purchaseBackpackUpgrade,
    },
    {
      id: "transport",
      title: "Transport",
      current: transport.current,
      next: transport.next,
      action: purchaseTransportUpgrade,
    },
    {
      id: "warehouse",
      title: "Warehouse",
      current: warehouse.current,
      next: warehouse.next,
      action: purchaseWarehouseUpgrade,
    },
  ];

  const fragment = document.createDocumentFragment();
  for (const section of sections) {
    const item = document.createElement("div");
    item.className = "accordion-item";
    const toggle = document.createElement("div");
    toggle.className = "accordion-item-toggle";
    toggle.innerHTML = `<span>${section.title}</span><small>${section.current.name}</small>`;
    toggle.addEventListener("click", () => {
      item.classList.toggle("accordion-item-opened");
    });
    const content = document.createElement("div");
    content.className = "accordion-item-content";
    const desc = document.createElement("p");
    desc.textContent = section.next
      ? `Next: ${section.next.name} – $${section.next.cost}`
      : "Max level reached";
    const button = document.createElement("button");
    button.className = "primary-btn";
    button.textContent = section.next ? `Upgrade for $${section.next.cost}` : "Fully upgraded";
    button.disabled = !section.next || gameState.money < section.next.cost;
    button.addEventListener("click", () => {
      if (section.next && section.action()) {
        hapticShort();
        scheduleRender();
      }
    });
    content.appendChild(desc);
    content.appendChild(button);
    item.appendChild(toggle);
    item.appendChild(content);
    fragment.appendChild(item);
  }

  const prestigeItem = document.createElement("div");
  prestigeItem.className = "accordion-item";
  prestigeItem.innerHTML = `
    <div class="accordion-item-toggle">
      <span>Prestige</span>
      <small>${gameState.stats.prestigeCount} unlocks</small>
    </div>
    <div class="accordion-item-content">
      <p>Reset alt for permanente bonusser. Kræver dag ${PRESTIGE_CONFIG.requirementDay} og net worth ${formatCash(PRESTIGE_CONFIG.requirementNetWorth)}.</p>
      <button class="primary-btn" ${prestigeReady ? "" : "disabled"}>Prestige</button>
      <button class="text-link" id="btn-reset-save">Reset Save</button>
    </div>
  `;
  prestigeItem.querySelector(".accordion-item-toggle").addEventListener("click", () => {
    prestigeItem.classList.toggle("accordion-item-opened");
  });
  prestigeItem.querySelector("button.primary-btn").addEventListener("click", () => {
    if (triggerPrestige()) {
      hapticMedium();
      scheduleRender();
    }
  });
  prestigeItem.querySelector("#btn-reset-save").addEventListener("click", () => {
    clearSave();
    scheduleRender();
  });
  fragment.appendChild(prestigeItem);

  dom.upgradesList.replaceChildren(fragment);
  if (dom.upgradePoints) {
    dom.upgradePoints.textContent = `Heat shield: ${gameState.daily.riskShield}`;
  }
}

function renderInvestments() {
  if (!dom.investmentsList) return;
  const fragment = document.createDocumentFragment();
  for (const investment of INVESTMENTS) {
    const record = gameState.investments[investment.id];
    const card = document.createElement("div");
    card.className = "list-item";
    const owned = record?.owned;
    card.innerHTML = `
      <div class="investment-title"><strong>${investment.name}</strong><span>${investment.desc}</span></div>
      <div class="investment-meta">
        ${investment.dailyIncome ? `<span>Daily $${investment.dailyIncome}</span>` : ""}
        ${investment.randomIncome ? `<span>Bonus chance ${Math.round(investment.randomIncome.chance * 100)}%</span>` : ""}
      </div>
      <button class="primary-btn">${owned ? "Owned" : `Buy $${investment.cost}`}</button>
    `;
    const button = card.querySelector("button");
    button.disabled = owned || gameState.money < investment.cost;
    button.addEventListener("click", () => {
      if (!owned && purchaseInvestment(investment.id)) {
        hapticShort();
        scheduleRender();
      }
    });
    fragment.appendChild(card);
  }
  dom.investmentsList.replaceChildren(fragment);
}

function createProductTitle(product) {
  const wrap = document.createElement("div");
  wrap.className = "product-title";
  wrap.innerHTML = `<span>${product.emoji}</span><span>${product.name}</span>`;
  return wrap;
}

function applyPriceChange(card, productId, price) {
  const last = priceCache.get(productId);
  if (last != null) {
    if (price > last) {
      card.dataset.change = "up";
    } else if (price < last) {
      card.dataset.change = "down";
    } else {
      delete card.dataset.change;
    }
  }
  priceCache.set(productId, price);
}

function formatCash(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatReward(reward) {
  if (!reward) return "-";
  if (reward.type === "money") return `$${reward.amount}`;
  if (reward.type === "buff") {
    const label = reward.key === "riskShield" ? "Heat shield" : reward.key;
    return `${reward.amount}× ${label}`;
  }
  return "Reward";
}
