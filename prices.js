// prices.js
// Prisberegninger per dag og lokation

import { PRODUCTS } from "./config.js";
import { gameState, getLocationById } from "./state.js";
import { applyDailyEvent } from "./events.js";

export function generateDailyPrices() {
  const loc = getLocationById(gameState.locationId);
  const locMod = loc ? loc.priceModifier : 1;

  const prices = {};
  for (const p of PRODUCTS) {
    const rand = 1 + (Math.random() * 2 - 1) * p.volatility;
    let price = Math.round(p.basePrice * rand * locMod);
    price = Math.max(5, price);
    prices[p.id] = price;
  }

  gameState.currentPrices = prices;
  applyDailyEvent();
}
