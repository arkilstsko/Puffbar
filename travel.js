// travel.js
// Handles travelling between locations and ending the day cycle.

import {
  gameState,
  getLocationById,
  adjustRisk,
  recordTravel,
  getTransportOption,
} from "./state.js";
import { ensureDailyQuests, updateQuestProgress } from "./quests.js";
import { advanceDayCycle } from "./events.js";
import { generateDailyPrices } from "./prices.js";
import { addLogEntry } from "./state.js";
import { saveState } from "./save.js";

const BASE_TRAVEL_COST = 10;

export function travelTo(locationId) {
  const target = getLocationById(locationId);
  if (!target) return false;
  if (gameState.locationId === target.id) return false;

  const transport = getTransportOption();
  const travelCost = Math.max(2, Math.round((transport.travelCost || BASE_TRAVEL_COST) * target.travelCost));
  if (gameState.money < travelCost) return false;

  gameState.money -= travelCost;
  recordTravel(target.id);
  updateQuestProgress("travel", { unique: gameState.daily.travelVisited.length });

  const riskGain = Math.max(0, Math.round((transport.riskDelta ?? 3) * target.riskModifier));
  if (riskGain > 0) adjustRisk(riskGain);

  addLogEntry(
    "Travel",
    `Rejste til ${target.name} og betalte $${travelCost}. Varme steg med ${riskGain}.`
  );
  gameState.locationId = target.id;

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
