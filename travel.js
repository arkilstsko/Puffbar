// travel.js
// Rejse mellem bydele + end day

import { gameState, getLocationById, logEvent } from "./state.js";
import { applyEndOfDayCycle } from "./events.js";
import { generateDailyPrices } from "./prices.js";

export function travelTo(locationId) {
  const target = getLocationById(locationId);
  if (!target) return;

  const travelCost = 5;
  if (gameState.money < travelCost) {
    // modal kaldes indirekte via showModal i UI hvis du vil, men her bare direkte info
    // (vi kan godt bruge showModal her, men for nu holder vi det simpelt).
    return;
  }

  const oldLoc = getLocationById(gameState.locationId)?.name || "?";
  gameState.money -= travelCost;
  gameState.locationId = locationId;

  logEvent("Travel", "City", `Du rejser fra ${oldLoc} til ${target.name} og bruger $${travelCost}.`);

  // Rejse tæller som en dag
  applyEndOfDayCycle(true);
  generateDailyPrices();

  logEvent("New day", "Game", "Ny dag efter rejsen – priserne har ændret sig.");
}

export function endDay() {
  applyEndOfDayCycle(false);
  generateDailyPrices();
  logEvent("New day", "Game", "Ny dag – byen ændrer sig.");
}
