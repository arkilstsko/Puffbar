// state.js
// Centralised game state container + helper accessors. No DOM logic in this file.

import {
  PRODUCTS,
  LOCATIONS,
  BACKPACK_UPGRADES,
  TRANSPORT_OPTIONS,
  WAREHOUSE_UPGRADES,
  INVESTMENTS,
  ACHIEVEMENTS,
  PRESTIGE_CONFIG,
  MAX_LOG_ENTRIES,
  SAVE_VERSION,
} from "./config.js";

const PRODUCT_IDS = PRODUCTS.map((p) => p.id);

function createInventoryMap() {
  const map = {};
  for (const id of PRODUCT_IDS) {
    map[id] = 0;
  }
  return map;
}

function createAchievementState() {
  const acc = {};
  for (const def of ACHIEVEMENTS) {
    acc[def.id] = {
      unlocked: false,
      unlockedDay: null,
      rewardClaimed: false,
    };
  }
  return acc;
}

function defaultDailyState() {
  return {
    profit: 0,
    soldToday: {},
    boughtToday: {},
    travelVisited: [],
    riskShield: 0,
  };
}

export const gameState = {
  version: SAVE_VERSION,
  day: 1,
  money: 400,
  locationId: LOCATIONS[0].id,
  risk: 8,
  backpackLevel: 0,
  transportId: TRANSPORT_OPTIONS[0].id,
  warehouseLevel: 0,
  inventory: createInventoryMap(),
  warehouse: createInventoryMap(),
  currentPrices: {},
  log: [],
  news: "",
  quests: [],
  achievements: createAchievementState(),
  investments: {},
  stats: {
    totalEarned: 0,
    totalSpent: 0,
    raidsSurvived: 0,
    prestigeCount: 0,
    lifetimeNetProfit: 0,
    totalTravels: 0,
  },
  meta: {
    permanentRiskDrop: 0,
    permanentDiscount: 0,
  },
  marketModifiers: [],
  rivalMessage: "",
  daily: defaultDailyState(),
};

export function hydrateGameState(saved) {
  if (!saved || typeof saved !== "object") return;

  const safe = (key, fallback) =>
    Object.prototype.hasOwnProperty.call(saved, key) ? saved[key] : fallback;

  gameState.day = Number(safe("day", 1)) || 1;
  gameState.money = Math.max(0, Number(safe("money", 400)) || 0);
  gameState.locationId = safe("locationId", LOCATIONS[0].id);
  gameState.risk = clampRisk(Number(safe("risk", 5)) || 0);
  gameState.backpackLevel = clampIndex(
    Number(safe("backpackLevel", 0)) || 0,
    BACKPACK_UPGRADES.length
  );
  gameState.transportId = safe("transportId", TRANSPORT_OPTIONS[0].id);
  gameState.warehouseLevel = clampIndex(
    Number(safe("warehouseLevel", 0)) || 0,
    WAREHOUSE_UPGRADES.length
  );

  gameState.inventory = mergeInventoryMap(saved.inventory, createInventoryMap());
  gameState.warehouse = mergeInventoryMap(saved.warehouse, createInventoryMap());
  gameState.currentPrices = saved.currentPrices || {};
  gameState.log = Array.isArray(saved.log) ? saved.log.slice(-MAX_LOG_ENTRIES) : [];
  gameState.news = safe("news", "");
  gameState.quests = Array.isArray(saved.quests) ? saved.quests : [];

  const achievements = createAchievementState();
  if (saved.achievements) {
    for (const [id, value] of Object.entries(saved.achievements)) {
      if (!achievements[id]) continue;
      achievements[id] = {
        unlocked: !!value.unlocked,
        unlockedDay: value.unlockedDay ?? null,
        rewardClaimed: !!value.rewardClaimed,
      };
    }
  }
  gameState.achievements = achievements;

  const invState = {};
  if (saved.investments) {
    for (const [id, record] of Object.entries(saved.investments)) {
      invState[id] = {
        owned: !!record.owned,
        daysOwned: Number(record.daysOwned || 0),
        lastPayout: record.lastPayout ?? null,
      };
    }
  }
  gameState.investments = invState;

  const stats = {
    totalEarned: 0,
    totalSpent: 0,
    raidsSurvived: 0,
    prestigeCount: 0,
    lifetimeNetProfit: 0,
    totalTravels: 0,
  };
  if (saved.stats) {
    for (const key of Object.keys(stats)) {
      stats[key] = Number(saved.stats[key] || 0);
    }
  }
  gameState.stats = stats;

  const metaDefaults = {
    permanentRiskDrop: 0,
    permanentDiscount: 0,
  };
  if (saved.meta) {
    for (const key of Object.keys(metaDefaults)) {
      metaDefaults[key] = Number(saved.meta[key] || 0);
    }
  }
  gameState.meta = metaDefaults;

  gameState.marketModifiers = Array.isArray(saved.marketModifiers)
    ? saved.marketModifiers
    : [];
  gameState.rivalMessage = safe("rivalMessage", "");
  gameState.daily = saved.daily ? { ...defaultDailyState(), ...saved.daily } : defaultDailyState();
}

export function getSerializableState() {
  return {
    version: SAVE_VERSION,
    day: gameState.day,
    money: gameState.money,
    locationId: gameState.locationId,
    risk: gameState.risk,
    backpackLevel: gameState.backpackLevel,
    transportId: gameState.transportId,
    warehouseLevel: gameState.warehouseLevel,
    inventory: gameState.inventory,
    warehouse: gameState.warehouse,
    currentPrices: gameState.currentPrices,
    log: gameState.log,
    news: gameState.news,
    quests: gameState.quests,
    achievements: gameState.achievements,
    investments: gameState.investments,
    stats: gameState.stats,
    meta: gameState.meta,
    marketModifiers: gameState.marketModifiers,
    rivalMessage: gameState.rivalMessage,
    daily: gameState.daily,
  };
}

export function resetGameState({ keepMeta = true } = {}) {
  const preservedAchievements = keepMeta ? { ...gameState.achievements } : createAchievementState();
  const preservedMeta = keepMeta ? { ...gameState.meta } : { permanentRiskDrop: 0, permanentDiscount: 0 };
  const prestigeCount = keepMeta ? gameState.stats.prestigeCount : 0;

  Object.assign(gameState, {
    version: SAVE_VERSION,
    day: 1,
    money: 400 + prestigeCount * 150,
    locationId: LOCATIONS[0].id,
    risk: 8,
    backpackLevel: 0,
    transportId: TRANSPORT_OPTIONS[0].id,
    warehouseLevel: 0,
    inventory: createInventoryMap(),
    warehouse: createInventoryMap(),
    currentPrices: {},
    log: [],
    news: "Velkommen tilbage til PuffLord. Køb billigt, sælg dyrt.",
    quests: [],
    achievements: preservedAchievements,
    investments: {},
    stats: {
      totalEarned: 0,
      totalSpent: 0,
      raidsSurvived: 0,
      prestigeCount,
      lifetimeNetProfit: 0,
      totalTravels: 0,
    },
    meta: preservedMeta,
    marketModifiers: [],
    rivalMessage: "",
    daily: defaultDailyState(),
  });
}

export function applyPrestige() {
  gameState.stats.prestigeCount += 1;
  const newCount = gameState.stats.prestigeCount;
  gameState.meta.permanentRiskDrop =
    (gameState.meta.permanentRiskDrop || 0) + PRESTIGE_CONFIG.riskReductionPerPrestige;
  gameState.meta.permanentDiscount =
    (gameState.meta.permanentDiscount || 0) + PRESTIGE_CONFIG.discountPerPrestige;

  resetGameState({ keepMeta: true });
  gameState.money = PRESTIGE_CONFIG.baseBonusCash + newCount * 200;
  addLogEntry("Prestige", `Du prestigede! Startbonus øget til $${gameState.money}.`);
}

export function getLocationById(id) {
  return LOCATIONS.find((loc) => loc.id === id) || LOCATIONS[0];
}

export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function getBackpackUpgrade(level = gameState.backpackLevel) {
  return BACKPACK_UPGRADES[Math.min(level, BACKPACK_UPGRADES.length - 1)];
}

export function getNextBackpackUpgrade() {
  return BACKPACK_UPGRADES[gameState.backpackLevel + 1] || null;
}

export function getTransportOption(id = gameState.transportId) {
  return TRANSPORT_OPTIONS.find((opt) => opt.id === id) || TRANSPORT_OPTIONS[0];
}

export function getNextTransportOption() {
  const index = TRANSPORT_OPTIONS.findIndex((opt) => opt.id === gameState.transportId);
  return TRANSPORT_OPTIONS[index + 1] || null;
}

export function getWarehouseUpgrade(level = gameState.warehouseLevel) {
  return WAREHOUSE_UPGRADES[Math.min(level, WAREHOUSE_UPGRADES.length - 1)];
}

export function getNextWarehouseUpgrade() {
  return WAREHOUSE_UPGRADES[gameState.warehouseLevel + 1] || null;
}

export function getInvestmentConfig(id) {
  return INVESTMENTS.find((inv) => inv.id === id) || null;
}

export function currentCapacityUsed() {
  return PRODUCT_IDS.reduce((total, id) => total + (gameState.inventory[id] || 0), 0);
}

export function warehouseCapacityUsed() {
  return PRODUCT_IDS.reduce((total, id) => total + (gameState.warehouse[id] || 0), 0);
}

export function currentCapacityMax() {
  return getBackpackUpgrade().capacity;
}

export function currentWarehouseCapacity() {
  return getWarehouseUpgrade().capacity;
}

export function estimateInventoryValue(includeWarehouse = true) {
  let total = 0;
  for (const p of PRODUCTS) {
    const price = gameState.currentPrices[p.id] || p.basePrice;
    const qtyBag = gameState.inventory[p.id] || 0;
    total += qtyBag * price;
    if (includeWarehouse) {
      const qtyWarehouse = gameState.warehouse[p.id] || 0;
      total += qtyWarehouse * Math.round(price * 0.9);
    }
  }
  return Math.max(0, Math.round(total));
}

export function calculateNetWorth() {
  return gameState.money + estimateInventoryValue(true);
}

export function addLogEntry(tag, text) {
  gameState.log.push({ day: gameState.day, tag, text });
  if (gameState.log.length > MAX_LOG_ENTRIES) {
    gameState.log.shift();
  }
}

export function adjustRisk(delta) {
  const adjusted = delta - (gameState.meta.permanentRiskDrop || 0);
  gameState.risk = clampRisk(gameState.risk + adjusted);
}

export function recordMoneyEarned(amount) {
  gameState.stats.totalEarned += amount;
  gameState.stats.lifetimeNetProfit += amount;
  gameState.daily.profit += amount;
}

export function recordMoneySpent(amount) {
  gameState.stats.totalSpent += amount;
  gameState.daily.profit -= amount;
}

export function recordTravel(locationId) {
  if (!gameState.daily.travelVisited.includes(locationId)) {
    gameState.daily.travelVisited.push(locationId);
  }
  gameState.stats.totalTravels += 1;
}

export function recordRaidSurvived() {
  gameState.stats.raidsSurvived += 1;
}

export function recordQuestBuff(key, amount) {
  if (key === "riskShield") {
    gameState.daily.riskShield += amount;
  }
}

export function useRiskShield() {
  if (gameState.daily.riskShield > 0) {
    gameState.daily.riskShield -= 1;
    return true;
  }
  return false;
}

export function resetDailyTrackers() {
  gameState.daily = defaultDailyState();
}

function mergeInventoryMap(candidate, fallback) {
  const output = { ...fallback };
  if (!candidate) return output;
  for (const id of PRODUCT_IDS) {
    const value = Number(candidate[id] || 0);
    output[id] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }
  return output;
}

function clampIndex(value, maxLength) {
  return Math.max(0, Math.min(maxLength - 1, value));
}

function clampRisk(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
