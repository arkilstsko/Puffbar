// market.js
// Buying and selling logic, including inventory capacity, transport perks and haptics.

import { gameState, currentCapacityUsed, currentCapacityMax, getTransportOption, useRiskShield } from "./state.js";
import { getProductById, addLogEntry, adjustRisk, recordMoneyEarned, recordMoneySpent } from "./state.js";
import { updateQuestProgress } from "./quests.js";
import { evaluateAchievements } from "./achievements.js";
import { saveState } from "./save.js";
import { vibrate } from "./feedback.js";

export function buyProduct(id, quantity = 1) {
  const product = getProductById(id);
  if (!product) return false;
  const price = getEffectiveBuyPrice(id);
  if (price == null) return false;

  const capacityFree = currentCapacityMax() - currentCapacityUsed();
  if (capacityFree <= 0) return false;
  const qty = Math.min(quantity, capacityFree);
  const totalCost = price * qty;

  if (gameState.money < totalCost) return false;

  gameState.money -= totalCost;
  recordMoneySpent(totalCost);
  gameState.inventory[id] = (gameState.inventory[id] || 0) + qty;

  adjustRisk(1);
  vibrate(20);
  addLogEntry("Buy", `Købte ${qty}x ${product.name} for $${totalCost}.`);
  updateQuestProgress("buy", { productId: id, quantity: qty });
  evaluateAchievements("inventory");
  saveState();
  return true;
}

export function sellProduct(id, quantity = 1) {
  const product = getProductById(id);
  if (!product) return false;
  const owned = gameState.inventory[id] || 0;
  if (owned <= 0) return false;

  const price = getEffectiveSellPrice(id);
  if (price == null) return false;
  const qty = Math.min(quantity, owned);
  const total = price * qty;

  gameState.inventory[id] = owned - qty;
  gameState.money += total;
  recordMoneyEarned(total);

  if (!useRiskShield()) {
    adjustRisk(-1);
  }
  vibrate(18);
  addLogEntry("Sell", `Solgte ${qty}x ${product.name} for $${total}.`);
  updateQuestProgress("sell", { productId: id, quantity: qty });
  updateQuestProgress("profit", { value: gameState.daily.profit });
  evaluateAchievements("money");
  saveState();
  return true;
}

export function getEffectiveBuyPrice(id) {
  const base = gameState.currentPrices[id];
  if (base == null) return null;
  const transport = getTransportOption();
  const discount = (transport?.buyDiscount || 0) + (gameState.meta.permanentDiscount || 0);
  const factor = Math.max(0.75, 1 - discount);
  return Math.max(1, Math.round(base * factor));
}

export function getEffectiveSellPrice(id) {
  const base = gameState.currentPrices[id];
  if (base == null) return null;
  const transport = getTransportOption();
  const bonus = (transport?.sellBonus || 0) + (gameState.meta.permanentDiscount || 0);
  const factor = 1 + bonus;
  return Math.max(1, Math.round(base * factor));
}
