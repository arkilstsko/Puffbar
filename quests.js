// quests.js
// Daily quest generation and anti-cheese progress tracking.

import { gameState, recordQuestBuff, recordMoneyEarned } from "./state.js";
import { addLogEntry } from "./state.js";
import { saveState } from "./save.js";
import { hapticMedium } from "./feedback.js";

const DAILY_QUEST_COUNT = 3;
let questCounter = 0;

const QUEST_BUILDERS = [
  buildSellOwnedQuest,
  buildProfitQuest,
  buildTravelQuest,
  buildNoRaidQuest,
];

export function ensureDailyQuests() {
  if (!Array.isArray(gameState.quests)) {
    gameState.quests = [];
  }

  const today = gameState.day;
  const activeQuests = gameState.quests.filter(
    (quest) => quest.completed || !quest.expires || quest.expires >= today
  );
  gameState.quests = activeQuests;

  const missing = Math.max(0, DAILY_QUEST_COUNT - activeQuests.length);
  const pickedTypes = new Set(activeQuests.map((q) => q.type));

  for (let i = 0; i < missing; i++) {
    const quest = createQuest(today, pickedTypes);
    pickedTypes.add(quest.type);
    gameState.quests.push(quest);
    addLogEntry("Quest", `Ny quest: ${quest.title}`);
  }
  saveState();
}

export function expireOldQuests() {
  const today = gameState.day;
  gameState.quests = gameState.quests.filter((quest) => {
    if (quest.completed || quest.claimed) return true;
    if (quest.type === "no-raid") return true;
    return quest.expires >= today;
  });
}

export function refreshQuestPool() {
  const today = gameState.day;
  const preserved = gameState.quests.filter((quest) => quest.completed && !quest.claimed);
  gameState.quests = preserved;
  ensureDailyQuests();
  saveState();
}

export function updateQuestProgress(event, payload = {}) {
  let updated = false;
  for (const quest of gameState.quests) {
    if (quest.failed || quest.claimed || quest.completed) continue;
    switch (quest.type) {
      case "sell-owned":
        updated = handleSellOwnedQuest(quest, event, payload) || updated;
        break;
      case "profit":
        updated = handleProfitQuest(quest, event, payload) || updated;
        break;
      case "travel-chain":
        updated = handleTravelQuest(quest, event, payload) || updated;
        break;
      case "no-raid":
        updated = handleNoRaidQuest(quest, event, payload) || updated;
        break;
      default:
        break;
    }
  }
  if (updated) {
    saveState();
  }
}

export function claimQuestReward(id) {
  const quest = gameState.quests.find((q) => q.id === id);
  if (!quest || !quest.completed || quest.claimed) return false;

  if (quest.reward?.type === "money") {
    gameState.money += quest.reward.amount;
    recordMoneyEarned(quest.reward.amount);
  }
  if (quest.reward?.type === "buff") {
    recordQuestBuff(quest.reward.key, quest.reward.amount);
  }

  quest.claimed = true;
  quest.claimedDay = gameState.day;
  addLogEntry("Quest", `Belønning indløst: ${quest.title}`);
  hapticMedium();
  saveState();
  return true;
}

function handleSellOwnedQuest(quest, event, payload) {
  if (event === "sell") {
    const baseline = payload.baseline || 0;
    if (baseline > 0) {
      quest.progress += baseline;
    }
    quest.meta.totalSold = (quest.meta.totalSold || 0) + (payload.quantity || 0);
    checkQuestCompletion(quest);
    return true;
  }
  if (event === "day-end" && !quest.completed) {
    quest.failed = quest.progress < quest.target;
    if (quest.failed) {
      addLogEntry("Quest", `Quest fejlede: ${quest.title}`);
    }
    return quest.failed;
  }
  return false;
}

function handleProfitQuest(quest, event, payload) {
  if (event === "profit") {
    const profit = Math.max(0, payload.profit || 0);
    quest.progress = Math.max(quest.progress, profit);
    checkQuestCompletion(quest);
    return true;
  }
  if (event === "day-end" && !quest.completed) {
    quest.failed = quest.progress < quest.target;
    return quest.failed;
  }
  return false;
}

function handleTravelQuest(quest, event, payload) {
  if (event === "travel") {
    quest.meta.visited = payload.unique || quest.meta.visited;
    quest.meta.riskPeak = Math.max(quest.meta.riskPeak, payload.riskPeak || 0);
    quest.progress = quest.meta.visited;
    if (quest.meta.riskPeak > quest.meta.maxRisk) {
      quest.failed = true;
      quest.meta.failedReason = "Heat limit exceeded";
      return true;
    }
    checkQuestCompletion(quest);
    return true;
  }
  if (event === "day-end" && !quest.completed) {
    quest.meta.riskPeak = Math.max(quest.meta.riskPeak, payload.riskPeak || 0);
    if (quest.meta.riskPeak > quest.meta.maxRisk || quest.progress < quest.target) {
      quest.failed = true;
      quest.meta.failedReason = quest.meta.riskPeak > quest.meta.maxRisk
        ? "Heat limit exceeded"
        : "Not enough districts";
      addLogEntry("Quest", `Quest fejlede: ${quest.title}`);
      return true;
    }
  }
  return false;
}

function handleNoRaidQuest(quest, event, payload) {
  if (event === "raid") {
    quest.progress = 0;
    return true;
  }
  if (event === "day-end") {
    quest.progress = payload.noRaidStreak || quest.progress;
    checkQuestCompletion(quest);
    return true;
  }
  return false;
}

function checkQuestCompletion(quest) {
  if (quest.completed || quest.failed) return;
  if (quest.progress >= quest.target) {
    quest.completed = true;
    quest.ready = true;
    quest.completedDay = gameState.day;
    addLogEntry("Quest", `Quest fuldført: ${quest.title}`);
    hapticMedium();
  }
}

function createQuest(day, usedTypes) {
  const shuffled = [...QUEST_BUILDERS].sort(() => Math.random() - 0.5);
  for (const builder of shuffled) {
    const quest = builder(day);
    if (!usedTypes.has(quest.type)) {
      return quest;
    }
  }
  return shuffled[0](day);
}

function buildSellOwnedQuest(day) {
  const target = randomRange(4, 8);
  const reward = randomRange(120, 220);
  questCounter += 1;
  return {
    id: `sell-owned-${questCounter}`,
    type: "sell-owned",
    title: `Sell ${target} stored puffbars`,
    description: `Sælg ${target} puffbars du ejede fra daggry.`,
    target,
    progress: 0,
    reward: { type: "money", amount: reward },
    completed: false,
    claimed: false,
    failed: false,
    dayIssued: day,
    expires: day,
    meta: {
      totalSold: 0,
    },
  };
}

function buildProfitQuest(day) {
  const target = randomRange(180, 320);
  questCounter += 1;
  return {
    id: `profit-${questCounter}`,
    type: "profit",
    title: `Profit $${target}`,
    description: `Skab $${target} netto profit i dag.`,
    target,
    progress: 0,
    reward: { type: "buff", key: "riskShield", amount: 2 },
    completed: false,
    claimed: false,
    failed: false,
    dayIssued: day,
    expires: day,
    meta: {},
  };
}

function buildTravelQuest(day) {
  const target = randomRange(2, 4);
  questCounter += 1;
  return {
    id: `travel-${questCounter}`,
    type: "travel-chain",
    title: `Travel ${target} districts`,
    description: `Rejs til ${target} forskellige distrikter uden at varmen overstiger 30%.`,
    target,
    progress: 0,
    reward: { type: "money", amount: randomRange(140, 220) },
    completed: false,
    claimed: false,
    failed: false,
    dayIssued: day,
    expires: day,
    meta: {
      maxRisk: 30,
      visited: 0,
      riskPeak: 0,
    },
  };
}

function buildNoRaidQuest(day) {
  const target = 3;
  questCounter += 1;
  return {
    id: `no-raid-${questCounter}`,
    type: "no-raid",
    title: `Stay hidden ${target} days`,
    description: `Undgå raids i ${target} sammenhængende dage.`,
    target,
    progress: gameState.stats.noRaidStreak || 0,
    reward: { type: "money", amount: 260 },
    completed: false,
    claimed: false,
    failed: false,
    dayIssued: day,
    expires: day + 3,
    meta: {},
  };
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
