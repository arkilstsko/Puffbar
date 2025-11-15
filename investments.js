// investments.js
// Purchase and daily processing of passive income sources.

import { INVESTMENTS } from "./config.js";
import { gameState, recordMoneyEarned, recordMoneySpent } from "./state.js";
import { addLogEntry } from "./state.js";
import { saveState } from "./save.js";

export function purchaseInvestment(id) {
  const config = INVESTMENTS.find((inv) => inv.id === id);
  if (!config) return false;
  const owned = gameState.investments[id]?.owned;
  if (owned) return false;
  if (gameState.money < config.cost) return false;

  gameState.money -= config.cost;
  recordMoneySpent(config.cost);
  gameState.investments[id] = { owned: true, daysOwned: 0, lastPayout: null };
  addLogEntry("Investment", `Du købte ${config.name}. Passiv indkomst unlocked.`);
  saveState();
  return true;
}

export function processInvestmentsDaily() {
  for (const config of INVESTMENTS) {
    const record = gameState.investments[config.id];
    if (!record || !record.owned) continue;

    record.daysOwned += 1;

    if (config.dailyIncome) {
      gameState.money += config.dailyIncome;
      recordMoneyEarned(config.dailyIncome);
      record.lastPayout = config.dailyIncome;
      addLogEntry(
        "Investment",
        `${config.name} gav dig $${config.dailyIncome} i daglig indtægt.`
      );
    }

    if (config.randomIncome) {
      if (Math.random() < config.randomIncome.chance) {
        const payout = randomInt(config.randomIncome.min, config.randomIncome.max);
        gameState.money += payout;
        recordMoneyEarned(payout);
        record.lastPayout = payout;
        addLogEntry(
          "Investment",
          `${config.name} udbetalte en bonus på $${payout}.`
        );
      }
    }
  }
  saveState();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
