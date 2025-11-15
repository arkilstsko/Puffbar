// ui.js
// Rendering logic for PuffLord. Keeps DOM manipulation scoped and efficient.

import { PRODUCTS, LOCATIONS, INVESTMENTS, ACHIEVEMENTS } from "./config.js";
import {
  gameState,
  currentCapacityUsed,
  currentCapacityMax,
  warehouseCapacityUsed,
  currentWarehouseCapacity,
  getTransportOption,
  resetGameState,
} from "./state.js";
import { buyProduct, sellProduct, getEffectiveBuyPrice, getEffectiveSellPrice } from "./market.js";
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
import { travelTo, endDay } from "./travel.js";
import { ensureDailyQuests } from "./quests.js";
import { generateDailyPrices } from "./prices.js";
import { saveState, clearSave } from "./save.js";
import { evaluateAchievements } from "./achievements.js";

export function renderAll() {
  renderHeader();
  renderMarket();
  renderInventory();
  renderWarehouse();
  renderUpgrades();
  renderInvestments();
  renderQuests();
  renderAchievements();
  renderNews();
  renderLog();
  renderLocations();
}

function renderHeader() {
  setText("stat-day", gameState.day);
  setText("stat-money", formatCash(gameState.money));
  const location = LOCATIONS.find((loc) => loc.id === gameState.locationId);
  setText("stat-location", location?.name ?? "?");
  setText("stat-capacity-used", currentCapacityUsed());
  setText("stat-capacity-max", currentCapacityMax());
  setText("stat-warehouse-used", warehouseCapacityUsed());
  setText("stat-warehouse-max", currentWarehouseCapacity());

  const transport = getTransportOption();
  setText("stat-transport", transport?.name ?? "?");

  const fill = document.getElementById("risk-bar-fill");
  const text = document.getElementById("risk-bar-text");
  if (fill) fill.style.width = `${gameState.risk}%`;
  if (text) text.textContent = `${gameState.risk}%`;

  const prestigeBanner = document.getElementById("prestige-banner");
  if (prestigeBanner) {
    if (canPrestige()) {
      prestigeBanner.textContent = "Prestige klar! Nulstil for permanente bonusser.";
    } else {
      const discount = (gameState.meta.permanentDiscount * 100).toFixed(1);
      prestigeBanner.textContent = `Prestiges: ${gameState.stats.prestigeCount} · Bonus rabat ${discount}%`;
    }
  }
}

function renderMarket() {
  ensureDailyQuests();
  const container = document.getElementById("market-list");
  if (!container) return;
  let html = `
    <div class="table-header">
      <span>Flavor</span>
      <span>Price</span>
      <span>Owned</span>
      <span>Actions</span>
    </div>
  `;
  for (const product of PRODUCTS) {
    const owned = gameState.inventory[product.id] || 0;
    const price = gameState.currentPrices[product.id] || product.basePrice;
    const buyPrice = getEffectiveBuyPrice(product.id) ?? price;
    const sellPrice = getEffectiveSellPrice(product.id) ?? price;
    html += `
      <div class="table-row market-row" data-id="${product.id}">
        <div class="product-name">
          <span class="label">${product.emoji} ${product.name}</span>
          <span class="desc">${product.desc}</span>
        </div>
        <div>
          <div>${formatCash(price)}</div>
          <div class="meta">Buy ${formatCash(buyPrice)} / Sell ${formatCash(sellPrice)}</div>
        </div>
        <div>${owned}</div>
        <div class="btn-group">
          <button class="row-btn buy" data-action="buy" data-id="${product.id}" ${
            gameState.money >= buyPrice && currentCapacityUsed() < currentCapacityMax()
              ? ""
              : "disabled"
          }>Buy</button>
          <button class="row-btn sell" data-action="sell" data-id="${product.id}" ${
            owned > 0 ? "" : "disabled"
          }>Sell</button>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", onMarketActionClick);
  });
  container.querySelectorAll(".market-row").forEach(attachSwipeHandlers);
}

function renderInventory() {
  const container = document.getElementById("inventory-list");
  if (!container) return;
  let html = `
    <div class="table-header">
      <span>Item</span>
      <span>Qty</span>
      <span>Value</span>
      <span>Move</span>
    </div>
  `;
  for (const product of PRODUCTS) {
    const qty = gameState.inventory[product.id] || 0;
    const price = gameState.currentPrices[product.id] || product.basePrice;
    const worth = qty * price;
    html += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${product.emoji} ${product.name}</span>
          <span class="desc">${product.desc}</span>
        </div>
        <div>${qty}</div>
        <div>${formatCash(worth)}</div>
        <div>
          <button class="row-btn" data-move="to-warehouse" data-id="${product.id}" ${
            qty > 0 && warehouseCapacityUsed() < currentWarehouseCapacity() ? "" : "disabled"
          }>Store</button>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
  container.querySelectorAll("button[data-move]").forEach((btn) => {
    btn.addEventListener("click", onMoveClick);
  });
}

function renderWarehouse() {
  const container = document.getElementById("warehouse-list");
  if (!container) return;
  let html = `
    <div class="table-header">
      <span>Item</span>
      <span>Qty</span>
      <span>Est.</span>
      <span>Move</span>
    </div>
  `;
  for (const product of PRODUCTS) {
    const qty = gameState.warehouse[product.id] || 0;
    const price = Math.round((gameState.currentPrices[product.id] || product.basePrice) * 0.9);
    const worth = qty * price;
    html += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${product.emoji} ${product.name}</span>
          <span class="desc">${product.desc}</span>
        </div>
        <div>${qty}</div>
        <div>${formatCash(worth)}</div>
        <div>
          <button class="row-btn" data-move="to-backpack" data-id="${product.id}" ${
            qty > 0 && currentCapacityUsed() < currentCapacityMax() ? "" : "disabled"
          }>Take</button>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
  container.querySelectorAll("button[data-move]").forEach((btn) => {
    btn.addEventListener("click", onMoveClick);
  });
}

function renderUpgrades() {
  const container = document.getElementById("upgrades-list");
  if (!container) return;
  const progress = [
    { label: "Backpack", info: getBackpackProgress(), type: "backpack" },
    { label: "Transport", info: getTransportProgress(), type: "transport" },
    { label: "Warehouse", info: getWarehouseProgress(), type: "warehouse" },
  ];
  container.innerHTML = progress
    .map(({ label, info, type }) => upgradeCard(label, info.current, info.next, type))
    .join("") + prestigeCard();

  container.querySelectorAll("button[data-upgrade]").forEach((btn) => {
    btn.addEventListener("click", onUpgradeClick);
  });
  const prestigeBtn = container.querySelector("button[data-prestige]");
  if (prestigeBtn) {
    prestigeBtn.addEventListener("click", () => {
      if (triggerPrestige()) {
        evaluateAchievements("prestige");
        generateDailyPrices();
        ensureDailyQuests();
        saveState();
        renderAll();
      }
    });
  }
}

function upgradeCard(title, current, next, type) {
  const currentInfo = describeUpgrade(type, current);
  if (!next) {
    return `<div class="list-card"><h3>${title}</h3><div class="meta">${currentInfo}</div><div class="badge success">Maxed</div></div>`;
  }
  const nextInfo = describeUpgrade(type, next);
  return `
    <div class="list-card">
      <h3>${title}</h3>
      <div class="meta">${currentInfo}</div>
      <div class="meta">Next: ${nextInfo}</div>
      <button class="primary-btn" data-upgrade="${type}" ${gameState.money >= next.cost ? "" : "disabled"}>
        Buy for ${formatCash(next.cost)}
      </button>
    </div>
  `;
}

function describeUpgrade(type, data) {
  if (!data) return "-";
  if (type === "backpack") {
    return `${data.name} · ${data.capacity} kapacitet`;
  }
  if (type === "transport") {
    return `${data.name} · rejsepris ${formatCash(data.travelCost)} · risiko ${data.riskDelta}`;
  }
  if (type === "warehouse") {
    return `${data.name} · ${data.capacity} lagerplads`;
  }
  return data.name || "-";
}

function prestigeCard() {
  const can = canPrestige();
  const info = can
    ? "Reset alt gear for permanente rabatter og mindre risiko."
    : "Opnå $60k formue og dag 40 for at prestige.";
  return `
    <div class="list-card">
      <h3>Prestige</h3>
      <div class="meta">${info}</div>
      <button class="ghost-btn" data-prestige="1" ${can ? "" : "disabled"}>Prestige Run</button>
    </div>
  `;
}

function renderInvestments() {
  const container = document.getElementById("investments-list");
  if (!container) return;
  container.innerHTML = INVESTMENTS.map((investment) => {
    const record = gameState.investments[investment.id];
    const owned = record?.owned;
    const status = owned
      ? `<span class="badge success">Owned · ${investment.dailyIncome ? `+${formatCash(investment.dailyIncome)}/day` : "Random"}</span>`
      : `<span class="badge">${formatCash(investment.cost)}</span>`;
    const btn = owned
      ? `<div class="meta">Seneste payout: ${record.lastPayout ? formatCash(record.lastPayout) : "-"}</div>`
      : `<button class="primary-btn" data-invest="${investment.id}" ${
          gameState.money >= investment.cost ? "" : "disabled"
        }>Invest</button>`;
    return `
      <div class="list-card">
        <h3>${investment.name}</h3>
        ${status}
        <div class="meta">${investment.desc}</div>
        ${btn}
      </div>
    `;
  }).join("");
  container.querySelectorAll("button[data-invest]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.invest;
      if (purchaseInvestment(id)) renderAll();
    });
  });
}

function renderQuests() {
  const container = document.getElementById("quests-list");
  if (!container) return;
  if (!gameState.quests.length) {
    container.innerHTML = `<div class="meta">Ingen aktive quests. Kom tilbage i morgen.</div>`;
    return;
  }
  container.innerHTML = gameState.quests
    .map((quest) => {
      const currentProgress = quest.type === "profit" ? Math.max(0, quest.progress) : quest.progress;
      const ratio = quest.target ? Math.min(1, currentProgress / quest.target) : 0;
      const pct = Math.round(ratio * 100);
      const badge = quest.completed
        ? '<span class="badge success">Done</span>'
        : `<span class="badge">${pct}%</span>`;
      return `
        <div class="list-card">
          <h3>${quest.description}</h3>
          ${badge}
          <div class="progress-bar"><span style="width:${pct}%"></span></div>
        </div>
      `;
    })
    .join("");
}

function renderAchievements() {
  const container = document.getElementById("achievements-list");
  if (!container) return;
  container.innerHTML = ACHIEVEMENTS.map((ach) => {
    const status = gameState.achievements[ach.id];
    const unlocked = status?.unlocked;
    const badge = unlocked
      ? `<span class="badge success">Unlocked D${status.unlockedDay}</span>`
      : `<span class="badge">Locked</span>`;
    return `
      <div class="list-card">
        <h3>${ach.name}</h3>
        ${badge}
        <div class="meta">${ach.description}</div>
      </div>
    `;
  }).join("");
}

function renderNews() {
  setText("news-banner", gameState.news || "Hold øje med markedet." );
  setText("rival-banner", gameState.rivalMessage || "");
}

function renderLog() {
  const container = document.getElementById("event-log");
  if (!container) return;
  container.innerHTML = gameState.log
    .slice()
    .reverse()
    .map((entry) => `<div class="log-entry"><strong>D${entry.day}</strong> · ${entry.tag}: ${entry.text}</div>`)
    .join("");
}

function renderLocations() {
  const container = document.getElementById("location-buttons");
  if (!container) return;
  const transport = getTransportOption();
  container.innerHTML = LOCATIONS.map((loc) => {
    const active = loc.id === gameState.locationId ? "active" : "";
    const travelCost = Math.max(2, Math.round((transport.travelCost || 10) * loc.travelCost));
    return `
      <button class="location-btn ${active}" data-loc="${loc.id}">
        <strong>${loc.name}</strong>
        <span class="meta">${loc.flavor}</span>
        <span class="meta">Fee ${formatCash(travelCost)} · Risk x${loc.riskModifier.toFixed(2)}</span>
      </button>
    `;
  }).join("");
  container.querySelectorAll("button.location-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const loc = btn.dataset.loc;
      if (loc && loc !== gameState.locationId) {
        travelTo(loc);
        renderAll();
      }
    });
  });
}

function onMarketActionClick(event) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;
  if (!action || !id) return;
  if (action === "buy") {
    if (buyProduct(id)) renderAll();
  } else if (action === "sell") {
    if (sellProduct(id)) renderAll();
  }
}

function onMoveClick(event) {
  const move = event.currentTarget.dataset.move;
  const id = event.currentTarget.dataset.id;
  if (!move || !id) return;
  if (move === "to-warehouse") {
    if (moveToWarehouse(id)) renderAll();
  } else if (move === "to-backpack") {
    if (moveToBackpack(id)) renderAll();
  }
}

function onUpgradeClick(event) {
  const type = event.currentTarget.dataset.upgrade;
  let success = false;
  if (type === "backpack") success = purchaseBackpackUpgrade();
  if (type === "transport") success = purchaseTransportUpgrade();
  if (type === "warehouse") success = purchaseWarehouseUpgrade();
  if (success) renderAll();
}

function attachSwipeHandlers(row) {
  let startX = 0;
  row.addEventListener("touchstart", (event) => {
    startX = event.touches[0]?.clientX ?? 0;
  });
  row.addEventListener("touchend", (event) => {
    const endX = event.changedTouches[0]?.clientX ?? 0;
    const dx = endX - startX;
    const id = row.dataset.id;
    if (!id) return;
    if (Math.abs(dx) < 50) return;
    if (dx > 0) {
      if (buyProduct(id)) renderAll();
    } else {
      if (sellProduct(id)) renderAll();
    }
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatCash(value) {
  return `$${Number(value || 0).toLocaleString("en-US")}`;
}

export function bindGlobalButtons() {
  const endDayBtn = document.getElementById("btn-end-day");
  if (endDayBtn) {
    endDayBtn.addEventListener("click", () => {
      endDay();
      renderAll();
    });
  }
  const newGameBtn = document.getElementById("btn-new-game");
  if (newGameBtn) {
    newGameBtn.addEventListener("click", () => {
      resetGameState({ keepMeta: true });
      generateDailyPrices();
      ensureDailyQuests();
      saveState();
      renderAll();
    });
  }
  const clearBtn = document.getElementById("btn-clear-save");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearSave();
      generateDailyPrices();
      ensureDailyQuests();
      saveState();
      renderAll();
    });
  }
}
