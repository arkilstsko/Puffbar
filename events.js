// events.js
// Contains end-of-day cycle handling, raids, rival flavour and news events.

import { PRODUCTS, RIVAL_NAMES } from "./config.js";
import {
  gameState,
  estimateInventoryValue,
  adjustRisk,
  addLogEntry,
  resetDailyTrackers,
  recordRaidSurvived,
} from "./state.js";
import { processInvestmentsDaily } from "./investments.js";
import { expireOldQuests, updateQuestProgress } from "./quests.js";
import { evaluateAchievements } from "./achievements.js";
import { showModal } from "./modal.js";
import { saveState } from "./save.js";

export function advanceDayCycle({ viaTravel = false } = {}) {
  const profitToday = gameState.daily.profit;
  const uniqueVisits = gameState.daily.travelVisited.length;

  expireOldQuests();
  processInvestmentsDaily();

  gameState.marketModifiers = [];
  gameState.news = "Stilhed i gaderne. Hold øje med muligheder.";

  handleRaidChance();
  handleNpcFlavor();
  handleRivalEvent();

  gameState.day += 1;
  const riskDrop = viaTravel ? 2 : 3;
  adjustRisk(-riskDrop);
  resetDailyTrackers();

  updateQuestProgress("profit", { value: profitToday });
  updateQuestProgress("travel", { unique: uniqueVisits });

  evaluateAchievements("day");
  saveState();
}

function handleRaidChance() {
  const inventoryValue = estimateInventoryValue();
  const riskFactor = gameState.risk / 100;
  const valueFactor = Math.min(0.35, inventoryValue / 6000);
  const raidChance = 0.08 + riskFactor * 0.5 + valueFactor;

  if (Math.random() < raidChance && inventoryValue > 0) {
    const lossFraction = 0.25 + Math.random() * 0.35;
    let lostItems = 0;
    for (const product of PRODUCTS) {
      const owned = gameState.inventory[product.id] || 0;
      if (owned <= 0) continue;
      const confiscated = Math.floor(owned * lossFraction);
      gameState.inventory[product.id] = Math.max(0, owned - confiscated);
      lostItems += confiscated;
    }

    const fine = Math.round(inventoryValue * (0.12 + Math.random() * 0.2));
    gameState.money = Math.max(0, gameState.money - fine);
    recordRaidSurvived();
    adjustRisk(-10);

    const message = `Politiet lavede en raid! Mistede ca. ${lostItems} varer og fik en bøde på $${fine}.`;
    addLogEntry("Raid", message);
    showModal("Raid", message);
    evaluateAchievements("raid");
  }
}

function handleNpcFlavor() {
  const roll = Math.random();
  let text = "";
  if (roll < 0.2) {
    text = "En lærer konfiskerede en puffbar i klasselokalet. Eleverne er ekstra nervøse.";
    adjustRisk(2);
  } else if (roll < 0.35) {
    const product = randomProduct();
    text = `En skater kid tipper dig: ${product.name} sælger godt i morgen.`;
    gameState.marketModifiers.push({ productId: product.id, multiplier: 1.15 });
  } else if (roll < 0.5) {
    const cash = 30 + Math.floor(Math.random() * 70);
    gameState.money += cash;
    text = `En rig kid vil være cool og køber giftcards. Du tjener $${cash}.`;
  } else if (roll < 0.65) {
    const riskDrop = 4 + Math.floor(Math.random() * 4);
    adjustRisk(-riskDrop);
    text = `Din tante er bekymret og giver dig tips – du reducerer varme med ${riskDrop}.`;
  }
  if (text) {
    addLogEntry("NPC", text);
    gameState.news = text;
  }
}

function handleRivalEvent() {
  const rival = RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)];
  const product = randomProduct();
  const spike = Math.random() < 0.5;
  const modifier = spike ? 1.35 : 0.7;
  gameState.marketModifiers.push({ productId: product.id, multiplier: modifier });
  const verb = spike ? "pumper" : "dumpede";
  const message = `${rival} ${verb} ${product.name}. Priserne svinger voldsomt.`;
  gameState.rivalMessage = message;
  addLogEntry("Rival", message);
  gameState.news = message;
}

function randomProduct() {
  return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
}
