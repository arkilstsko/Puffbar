// upgrades.js
// Purchasing of backpack, transport and warehouse upgrades plus prestige checks.

import {
  BACKPACK_UPGRADES,
  TRANSPORT_OPTIONS,
  WAREHOUSE_UPGRADES,
  PRESTIGE_CONFIG,
} from "./config.js";
import {
  gameState,
  getNextBackpackUpgrade,
  getNextTransportOption,
  getNextWarehouseUpgrade,
  adjustRisk,
  applyPrestige,
  calculateNetWorth,
} from "./state.js";
import { addLogEntry } from "./state.js";
import { saveState } from "./save.js";

export function purchaseBackpackUpgrade() {
  const upgrade = getNextBackpackUpgrade();
  if (!upgrade) return false;
  if (gameState.money < upgrade.cost) return false;
  gameState.money -= upgrade.cost;
  gameState.backpackLevel += 1;
  addLogEntry("Upgrade", `Backpack opgraderet til ${upgrade.name}. Kapacitet ${upgrade.capacity}.`);
  saveState();
  return true;
}

export function purchaseTransportUpgrade() {
  const next = getNextTransportOption();
  if (!next) return false;
  if (gameState.money < next.cost) return false;
  gameState.money -= next.cost;
  gameState.transportId = next.id;
  adjustRisk(-4);
  addLogEntry("Upgrade", `Transport opgraderet til ${next.name}. Rejser er billigere.`);
  saveState();
  return true;
}

export function purchaseWarehouseUpgrade() {
  const next = getNextWarehouseUpgrade();
  if (!next) return false;
  if (gameState.money < next.cost) return false;
  gameState.money -= next.cost;
  gameState.warehouseLevel += 1;
  addLogEntry("Upgrade", `Lager opgraderet til ${next.name}. Kapacitet ${next.capacity}.`);
  saveState();
  return true;
}

export function canPrestige() {
  const meetsNetWorth = calculateNetWorth() >= PRESTIGE_CONFIG.requirementNetWorth;
  const meetsDay = gameState.day >= PRESTIGE_CONFIG.requirementDay;
  return meetsNetWorth && meetsDay;
}

export function triggerPrestige() {
  if (!canPrestige()) return false;
  applyPrestige();
  saveState();
  return true;
}

export function getBackpackProgress() {
  return {
    current: BACKPACK_UPGRADES[gameState.backpackLevel],
    next: getNextBackpackUpgrade(),
  };
}

export function getTransportProgress() {
  return {
    current: TRANSPORT_OPTIONS.find((opt) => opt.id === gameState.transportId),
    next: getNextTransportOption(),
  };
}

export function getWarehouseProgress() {
  return {
    current: WAREHOUSE_UPGRADES[gameState.warehouseLevel],
    next: getNextWarehouseUpgrade(),
  };
}
