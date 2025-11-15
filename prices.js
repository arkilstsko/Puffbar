// prices.js
// Responsible for generating the daily market prices based on volatility, location
// modifiers, rival influence and any temporary market modifiers stored on state.

import { PRODUCTS, LOCATIONS, PRICE_FLOOR } from "./config.js";
import { gameState } from "./state.js";

const volatilityCache = new Map();

function volatilityRoll(volatility) {
  if (!volatilityCache.has(volatility)) {
    const min = Math.max(0.4, 1 - volatility);
    const max = 1 + volatility * 1.3;
    volatilityCache.set(volatility, { min, max });
  }
  const { min, max } = volatilityCache.get(volatility);
  return min + Math.random() * (max - min);
}

export function generateDailyPrices() {
  const location = LOCATIONS.find((loc) => loc.id === gameState.locationId) || LOCATIONS[0];
  const basePrices = {};

  for (const product of PRODUCTS) {
    const randomFactor = volatilityRoll(product.volatility);
    const price = Math.max(
      PRICE_FLOOR,
      Math.round(product.basePrice * randomFactor * location.priceModifier)
    );
    basePrices[product.id] = price;
  }

  const modified = applyMarketModifiers(basePrices);
  gameState.currentPrices = modified;
  return modified;
}

function applyMarketModifiers(basePrices) {
  const modifiers = Array.isArray(gameState.marketModifiers) ? gameState.marketModifiers : [];
  const prices = { ...basePrices };
  for (const mod of modifiers) {
    if (!mod || !mod.productId || !prices[mod.productId]) continue;
    const multiplier = mod.multiplier ?? 1;
    const offset = mod.offset ?? 0;
    const newPrice = Math.max(PRICE_FLOOR, Math.round(prices[mod.productId] * multiplier + offset));
    prices[mod.productId] = newPrice;
  }
  return prices;
}
