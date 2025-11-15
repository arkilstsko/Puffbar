// travel.js
// Handles travelling between locations, sliding confirmations and end-of-day cycle.

import {
  gameState,
  getLocationById,
  adjustRisk,
  recordTravel,
  getTransportOption,
} from "./state.js";
import { LOCATIONS } from "./config.js";
import { ensureDailyQuests, updateQuestProgress } from "./quests.js";
import { advanceDayCycle } from "./events.js";
import { generateDailyPrices } from "./prices.js";
import { addLogEntry } from "./state.js";
import { saveState } from "./save.js";
import { hapticMedium } from "./feedback.js";

const BASE_TRAVEL_COST = 10;

export function getTravelOptions() {
  const transport = getTransportOption();
  return LOCATIONS.map((loc) => {
    const cost = calculateTravelCostFor(loc, transport);
    const riskDelta = Math.max(0, Math.round((transport.riskDelta ?? 3) * loc.riskModifier));
    return {
      id: loc.id,
      name: loc.name,
      flavor: loc.flavor,
      travelCost: cost,
      riskDelta,
      priceModifier: loc.priceModifier,
      riskModifier: loc.riskModifier,
      isCurrent: loc.id === gameState.locationId,
    };
  });
}

export function getTravelContext() {
  const location = getLocationById(gameState.locationId);
  return {
    location,
    risk: gameState.risk,
    money: gameState.money,
    transport: getTransportOption(),
    visitedToday: gameState.daily.travelVisited.slice(),
  };
}

export function travelTo(locationId) {
  const target = getLocationById(locationId);
  if (!target || gameState.locationId === target.id) return false;

  const transport = getTransportOption();
  const travelCost = calculateTravelCostFor(target, transport);
  if (gameState.money < travelCost) return false;

  gameState.money -= travelCost;
  recordTravel(target.id);
  const riskGain = Math.max(0, Math.round((transport.riskDelta ?? 3) * target.riskModifier));
  if (riskGain > 0) adjustRisk(riskGain);

  addLogEntry(
    "Travel",
    `Rejste til ${target.name} og betalte $${travelCost}. Varme steg med ${riskGain}.`
  );
  gameState.locationId = target.id;
  updateQuestProgress("travel", {
    unique: gameState.daily.travelVisited.length,
    riskPeak: gameState.daily.riskPeak,
  });
  hapticMedium();

  advanceDayCycle({ viaTravel: true });
  ensureDailyQuests();
  generateDailyPrices();
  saveState();
  return true;
}

export function endDay() {
  advanceDayCycle({ viaTravel: false });
  ensureDailyQuests();
  generateDailyPrices();
  saveState();
  return true;
}

function calculateTravelCostFor(location, transport) {
  return Math.max(2, Math.round((transport.travelCost || BASE_TRAVEL_COST) * location.travelCost));
}

export function getTravelPreview(locationId) {
  const target = getLocationById(locationId);
  const transport = getTransportOption();
  return {
    id: locationId,
    name: target.name,
    cost: calculateTravelCostFor(target, transport),
    riskDelta: Math.max(0, Math.round((transport.riskDelta ?? 3) * target.riskModifier)),
    flavor: target.flavor,
  };
}
