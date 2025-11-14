// ui.js
// Alt der tegner UI'et + knap-handlere til marked og lokationer

import { PRODUCTS, LOCATIONS } from "./config.js";
import { gameState, getLocationById } from "./state.js";
import { buyProduct, sellProduct } from "./market.js";
import { travelTo } from "./travel.js";

export function renderHeader() {
  document.getElementById("stat-day").textContent = gameState.day;
  document.getElementById("stat-money").textContent = `$${gameState.money}`;
  document.getElementById("stat-location").textContent =
    getLocationById(gameState.locationId)?.name ?? "?";
  document.getElementById("stat-capacity-used").textContent = currentCapacityUsedSafe();
  document.getElementById("stat-capacity-max").textContent = gameState.capacityMax;

  const riskFill = document.getElementById("risk-bar-fill");
  const riskText = document.getElementById("risk-bar-text");
  if (riskFill) riskFill.style.width = `${gameState.risk}%`;
  if (riskText) riskText.textContent = `${gameState.risk}%`;
}

function currentCapacityUsedSafe() {
  return Object.values(gameState.inventory || {}).reduce((a, b) => a + b, 0);
}

export function renderInventory() {
  const el = document.getElementById("inventory-list");
  if (!el) return;

  let html = `
    <div class="table-header">
      <span>Item</span><span>Qty</span><span>Avg</span><span>Value</span>
    </div>
  `;

  for (const p of PRODUCTS) {
    const qty = gameState.inventory[p.id] || 0;
    const price = gameState.currentPrices[p.id] || p.basePrice;
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
  }

  el.innerHTML = html;
}

export function renderMarket() {
  const el = document.getElementById("market-list");
  if (!el) return;

  let html = `
    <div class="table-header">
      <span>Flavor</span><span>Price</span><span>Owned</span><span>Actions</span>
    </div>
  `;

  const capacityUsed = currentCapacityUsedSafe();

  for (const p of PRODUCTS) {
    const qty = gameState.inventory[p.id] || 0;
    const price = gameState.currentPrices[p.id] || p.basePrice;
    const canBuy = gameState.money >= price && capacityUsed < gameState.capacityMax;

    html += `
      <div class="table-row">
        <div class="product-name">
          <span class="label">${p.emoji} ${p.name}</span>
          <span class="desc">${p.desc}</span>
        </div>
        <div>$${price}</div>
        <div>${qty}</div>
        <div class="btn-group">
          <button class="row-btn buy-btn" data-id="${p.id}" data-action="buy" ${
      canBuy ? "" : "disabled"
    }>Buy</button>
          <button class="row-btn sell-btn" data-id="${p.id}" data-action="sell" ${
      qty > 0 ? "" : "disabled"
    }>Sell</button>
        </div>
      </div>
    `;
  }

  el.innerHTML = html;

  el.querySelectorAll("button.row-btn").forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener("click", onMarketButtonClick);
  });
}

function onMarketButtonClick(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (!id || !action) return;

  if (action === "buy") buyProduct(id);
  else sellProduct(id);

  renderAll();
}

export function renderLog() {
  const el = document.getElementById("event-log");
  if (!el) return;

  el.innerHTML = gameState.log
    .slice()
    .reverse()
    .map(
      l => `<div class="log-entry"><span class="time">D${l.day}</span> ${l.text}</div>`
    )
    .join("");
}

export function renderNews() {
  const el = document.getElementById("news-banner");
  if (!el) return;
  el.textContent = gameState.news || "";
}

export function renderLocations() {
  const el = document.getElementById("location-buttons");
  if (!el) return;

  el.innerHTML = LOCATIONS.map(loc => {
    const active = loc.id === gameState.locationId ? "active" : "";
    return `
      <button class="location-btn ${active}" data-loc="${loc.id}">
        <strong>${loc.name}</strong>
        <span class="meta">${loc.flavor}</span>
      </button>
    `;
  }).join("");

  el.querySelectorAll("button.location-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const locId = btn.dataset.loc;
      if (locId && locId !== gameState.locationId) {
        travelTo(locId);
        renderAll();
      }
    });
  });
}

export function renderAll() {
  renderHeader();
  renderInventory();
  renderMarket();
  renderNews();
  renderLog();
  renderLocations();
}
