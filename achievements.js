// achievements.js
// Handles achievement unlocking and persistent rewards.

import { ACHIEVEMENTS } from "./config.js";
import { gameState, calculateNetWorth } from "./state.js";
import { saveState } from "./save.js";
import { addLogEntry } from "./state.js";

export function evaluateAchievements(trigger = "generic") {
  for (const achievement of ACHIEVEMENTS) {
    const status = gameState.achievements[achievement.id];
    if (!status || status.unlocked) continue;

    if (checkCondition(achievement.condition, trigger)) {
      status.unlocked = true;
      status.unlockedDay = gameState.day;
      addLogEntry("Achievement", `Unlocked: ${achievement.name}`);
      applyAchievementReward(achievement.reward);
    }
  }
  saveState();
}

function checkCondition(condition, trigger) {
  if (!condition) return false;
  switch (condition.type) {
    case "netWorth":
      return calculateNetWorth() >= condition.value;
    case "day":
      return gameState.day >= condition.value;
    case "raids":
      return gameState.stats.raidsSurvived >= condition.value;
    case "inventoryFull":
      return Object.values(gameState.inventory).every((qty) => qty >= (condition.amount || 0));
    case "prestige":
      return gameState.stats.prestigeCount >= condition.value;
    default:
      return false;
  }
}

function applyAchievementReward(reward) {
  if (!reward) return;
  if (reward.type === "discount") {
    gameState.meta.permanentDiscount = (gameState.meta.permanentDiscount || 0) + reward.amount;
  } else if (reward.type === "riskReduction") {
    gameState.meta.permanentRiskDrop = (gameState.meta.permanentRiskDrop || 0) + reward.amount;
  }
}
