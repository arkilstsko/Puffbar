// state.js
// Central gameState + helper-funktioner

import { PRODUCTS, LOCATIONS, MAX_LOG_ENTRIES } from "./config.js";

export const gameState = {
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

export function resetGameState() {
  gameState.day = 1;
  gameState.money = 300;
  gameState.locationId = "downtown";
  gameState.risk = 10;
  gameState.capacityMax = 60;

  gameState.inventory = {};
  PRODUCTS.forEach(p => (gameState.inventory[p.id] = 0));

  gameState.log = [];
  gameState.news = "Velkommen til PuffLord. Køb billigt, sælg dyrt. Undgå raids.";
}

export function getLocationById(id) {
  return LOCATIONS.find(l => l.id === id);
}

export function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

export function currentCapacityUsed() {
  return Object.values(gameState.inventory).reduce((a, b) => a + b, 0);
}

export function estimateInventoryValue() {
  let total = 0;
  for (const p of PRODUCTS) {
    const qty = gameState.inventory[p.id] || 0;
    const price = gameState.currentPrices[p.id] || p.basePrice;
    total += qty * price;
  }
  return total;
}

export function logEvent(tag, source, text) {
  gameState.log.push({ day: gameState.day, tag, source, text });
  if (gameState.log.length > MAX_LOG_ENTRIES) {
    gameState.log.shift();
  }
}
