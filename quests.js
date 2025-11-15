// quests.js
// Daily quest generation and progress tracking.

import { PRODUCTS, QUEST_TEMPLATES } from "./config.js";
import { gameState, recordQuestBuff, recordMoneyEarned } from "./state.js";
import { addLogEntry } from "./state.js";
import { saveState } from "./save.js";

let questCounter = 0;

export function ensureDailyQuests() {
  // Remove quests older than today
  const today = gameState.day;
  gameState.quests = (gameState.quests || []).filter((q) => q.day === today);

  if (gameState.quests.length >= 3) return;

  const needed = 3 - gameState.quests.length;
  for (let i = 0; i < needed; i++) {
    const quest = createRandomQuest(today);
    gameState.quests.push(quest);
    addLogEntry("Quest", `Ny quest: ${quest.description}`);
  }
  saveState();
}

export function expireOldQuests() {
  const today = gameState.day;
  const remaining = [];
  for (const quest of gameState.quests) {
    if (quest.completed) {
      remaining.push(quest);
    } else if (quest.day === today) {
      // keep until day end
      remaining.push(quest);
    } else {
      addLogEntry("Quest", `Quest mislykkedes: ${quest.description}`);
    }
  }
  gameState.quests = remaining;
}

export function updateQuestProgress(action, payload = {}) {
  let changed = false;
  for (const quest of gameState.quests) {
    if (quest.completed) continue;

    if (quest.type === "sell" && action === "sell" && payload.productId === quest.productId) {
      quest.progress += payload.quantity || 1;
      changed = true;
    }

    if (quest.type === "profit" && action === "profit") {
      quest.progress = payload.value || 0;
      changed = true;
    }

    if (quest.type === "travel" && action === "travel") {
      quest.progress = payload.unique || quest.progress;
      changed = true;
    }

    if (quest.progress >= quest.target) {
      quest.completed = true;
      grantQuestReward(quest);
      addLogEntry("Quest", `Fuldført: ${quest.description}`);
    }
  }
  if (changed) saveState();
}

function createRandomQuest(day) {
  const roll = Math.random();
  questCounter += 1;
  if (roll < 0.4) {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const target = randomInt(QUEST_TEMPLATES.sell.minTarget, QUEST_TEMPLATES.sell.maxTarget);
    const reward = randomInt(QUEST_TEMPLATES.sell.reward.min, QUEST_TEMPLATES.sell.reward.max);
    return {
      id: `sell-${product.id}-${questCounter}`,
      type: "sell",
      productId: product.id,
      target,
      progress: 0,
      reward,
      rewardType: "money",
      description: `Sælg ${target}x ${product.name} i dag (belønning $${reward})`,
      day,
      completed: false,
    };
  }

  if (roll < 0.7) {
    const targets = QUEST_TEMPLATES.travel.targets;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const reward = randomInt(QUEST_TEMPLATES.travel.reward.min, QUEST_TEMPLATES.travel.reward.max);
    return {
      id: `travel-${questCounter}`,
      type: "travel",
      target,
      progress: 0,
      reward,
      rewardType: "money",
      description: `Besøg ${target} steder på én dag (belønning $${reward})`,
      day,
      completed: false,
    };
  }

  const profitTargets = QUEST_TEMPLATES.profit.targets;
  const target = profitTargets[Math.floor(Math.random() * profitTargets.length)];
  const buff = QUEST_TEMPLATES.profit.reward;
  return {
    id: `profit-${questCounter}`,
    type: "profit",
    target,
    progress: 0,
    rewardType: "buff",
    reward,
    description: `Tjen $${target} profit på én dag (belønning: ${buff.amount}x varme-skjold)`,
    day,
    completed: false,
  };
}

function grantQuestReward(quest) {
  if (quest.rewardType === "money") {
    gameState.money += quest.reward;
    recordMoneyEarned(quest.reward);
  } else if (quest.rewardType === "buff") {
    recordQuestBuff(quest.reward.key, quest.reward.amount);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
