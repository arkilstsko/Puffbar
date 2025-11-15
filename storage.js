// storage.js
// Move puffbars between backpack and warehouse.

import {
  gameState,
  currentCapacityUsed,
  currentCapacityMax,
  warehouseCapacityUsed,
  currentWarehouseCapacity,
  getProductById,
} from "./state.js";
import { addLogEntry } from "./state.js";
import { saveState } from "./save.js";

export function moveToWarehouse(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product) return false;
  const owned = gameState.inventory[productId] || 0;
  if (owned <= 0) return false;

  const freeSpace = currentWarehouseCapacity() - warehouseCapacityUsed();
  if (freeSpace <= 0) return false;

  const qty = Math.min(quantity, owned, freeSpace);
  gameState.inventory[productId] = owned - qty;
  gameState.warehouse[productId] = (gameState.warehouse[productId] || 0) + qty;
  addLogEntry("Storage", `Flyttede ${qty}x ${product.name} til lageret.`);
  saveState();
  return true;
}

export function moveToBackpack(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product) return false;
  const stored = gameState.warehouse[productId] || 0;
  if (stored <= 0) return false;

  const freeSpace = currentCapacityMax() - currentCapacityUsed();
  if (freeSpace <= 0) return false;

  const qty = Math.min(quantity, stored, freeSpace);
  gameState.warehouse[productId] = stored - qty;
  gameState.inventory[productId] = (gameState.inventory[productId] || 0) + qty;
  addLogEntry("Storage", `Flyttede ${qty}x ${product.name} til backpack.`);
  saveState();
  return true;
}
