// market.js
// Køb/salg logik

import { gameState, getProductById, currentCapacityUsed, logEvent } from "./state.js";
import { showModal } from "./modal.js";

export function buyProduct(id) {
  const price = gameState.currentPrices[id];
  if (price == null) return;

  if (gameState.money < price) {
    showModal("Ingen penge", "Du har ikke råd til dette køb.");
    return;
  }

  if (currentCapacityUsed() >= gameState.capacityMax) {
    showModal("Taske fuld", "Din backpack er helt fyldt.");
    return;
  }

  gameState.money -= price;
  gameState.inventory[id] = (gameState.inventory[id] || 0) + 1;
  gameState.risk = Math.min(100, gameState.risk + 1);

  const p = getProductById(id);
  logEvent("Buy", "Market", `Købte 1x ${p.name} for $${price}.`);
}

export function sellProduct(id) {
  const qty = gameState.inventory[id] || 0;
  if (qty <= 0) return;

  const price = gameState.currentPrices[id];
  if (price == null) return;

  gameState.inventory[id] = qty - 1;
  gameState.money += price;
  gameState.risk = Math.max(0, gameState.risk - 1);

  const p = getProductById(id);
  logEvent("Sell", "Market", `Solgte 1x ${p.name} for $${price}.`);
}
