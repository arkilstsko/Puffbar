// config.js
// Central definitions for PuffLord products, locations, upgrades and meta systems.
// The data here is intentionally declarative so the rest of the codebase can stay lean.

export const PRODUCTS = [
  {
    id: "basic-breeze",
    name: "Basic Breeze",
    emoji: "💨",
    basePrice: 16,
    volatility: 0.22,
    rarity: "common",
    desc: "Standard puff – stabil, nem at sælge",
  },
  {
    id: "ice-blast",
    name: "Ice Blast",
    emoji: "🧊",
    basePrice: 24,
    volatility: 0.33,
    rarity: "popular",
    desc: "Mentol-kick. Efterspurgt ved eksamensfester.",
  },
  {
    id: "rainbow-rush",
    name: "Rainbow Rush 5000",
    emoji: "🌈",
    basePrice: 36,
    volatility: 0.44,
    rarity: "rare",
    desc: "Alt for mange smage i én. Kids elsker den.",
  },
  {
    id: "mango-madness",
    name: "Mango Madness",
    emoji: "🥭",
    basePrice: 30,
    volatility: 0.31,
    rarity: "popular",
    desc: "Sød mango – premium i de rige kvarterer.",
  },
  {
    id: "berry-blaster",
    name: "Berry Blaster",
    emoji: "🫐",
    basePrice: 27,
    volatility: 0.42,
    rarity: "common",
    desc: "Syrlig favorit med pæn margin.",
  },
  {
    id: "cola-crush",
    name: "Cola Crush",
    emoji: "🥤",
    basePrice: 21,
    volatility: 0.29,
    rarity: "common",
    desc: "Smager af sommer og dårlig indflydelse.",
  },
  {
    id: "ultra-grape",
    name: "Ultra Grape 9000",
    emoji: "🍇",
    basePrice: 42,
    volatility: 0.56,
    rarity: "epic",
    desc: "Ekstrem grape – høj risiko / høj reward.",
  },
  {
    id: "banana-burst",
    name: "Banana Burst",
    emoji: "🍌",
    basePrice: 19,
    volatility: 0.21,
    rarity: "common",
    desc: "Billig bulk-varer, perfekt til newbies.",
  },
  {
    id: "cosmic-cotton",
    name: "Cosmic Cotton",
    emoji: "🍭",
    basePrice: 33,
    volatility: 0.48,
    rarity: "rare",
    desc: "Over-sød, over-populær, over-prissat.",
  },
];

export const LOCATIONS = [
  {
    id: "downtown",
    name: "Downtown",
    priceModifier: 1,
    riskModifier: 1,
    travelCost: 0.9,
    flavor: "Balanceret marked – moderat risiko.",
  },
  {
    id: "mall",
    name: "Skymall",
    priceModifier: 1.18,
    riskModifier: 1.35,
    travelCost: 1.1,
    flavor: "Rige kids og security cams overalt.",
  },
  {
    id: "skate-park",
    name: "Skate Park",
    priceModifier: 0.92,
    riskModifier: 0.75,
    travelCost: 0.7,
    flavor: "Lavere priser, chill crowd, lav varme.",
  },
  {
    id: "docks",
    name: "Neon Docks",
    priceModifier: 0.8,
    riskModifier: 1.6,
    travelCost: 1.3,
    flavor: "Bulk-import, men politiet lurer.",
  },
  {
    id: "arcade",
    name: "Pixel Arcade",
    priceModifier: 1.05,
    riskModifier: 0.9,
    travelCost: 0.95,
    flavor: "Gamers med kontanter – elsker limited editions.",
  },
];

export const MAX_LOG_ENTRIES = 80;

export const BACKPACK_UPGRADES = [
  { level: 0, name: "School Backpack", capacity: 60, cost: 0, desc: "Start setup." },
  { level: 1, name: "Sneaky Duffel", capacity: 100, cost: 750, desc: "Mere plads i baglokalet." },
  { level: 2, name: "Locker Cache", capacity: 150, cost: 2000, desc: "Få hjælp af skolens vicevært." },
  { level: 3, name: "Rolling Crate", capacity: 220, cost: 5000, desc: "Hjul gør underværker." },
  { level: 4, name: "Secret Vault", capacity: 300, cost: 12000, desc: "Skjult rum under sengen." },
];

export const TRANSPORT_OPTIONS = [
  {
    id: "foot",
    name: "Sneaker Express",
    cost: 0,
    travelCost: 9,
    riskDelta: 4,
    buyDiscount: 0,
    sellBonus: 0,
    desc: "Gåtur. Billigt men lidt sketchy.",
  },
  {
    id: "bike",
    name: "BMX Bike",
    cost: 650,
    travelCost: 7,
    riskDelta: 3,
    buyDiscount: 0.02,
    sellBonus: 0.01,
    desc: "Hurtig levering, lidt mindre risiko.",
  },
  {
    id: "scooter",
    name: "Electric Scooter",
    cost: 1500,
    travelCost: 6,
    riskDelta: 2,
    buyDiscount: 0.03,
    sellBonus: 0.02,
    desc: "Glider forbi lærerne – bedre deals.",
  },
  {
    id: "car",
    name: "Used Hatchback",
    cost: 4200,
    travelCost: 5,
    riskDelta: 1,
    buyDiscount: 0.04,
    sellBonus: 0.03,
    desc: "Kan handle i flere bydele uden opsigt.",
  },
  {
    id: "van",
    name: "Stealth Van",
    cost: 9000,
    travelCost: 4,
    riskDelta: 0,
    buyDiscount: 0.05,
    sellBonus: 0.04,
    desc: "Professionel operations base. Minimal varme.",
  },
];

export const WAREHOUSE_UPGRADES = [
  { level: 0, name: "Ingen lager", capacity: 0, cost: 0, desc: "Alt i rygsækken." },
  { level: 1, name: "Vens Locker", capacity: 80, cost: 500, desc: "En ven lader dig låne et skab." },
  { level: 2, name: "Mini Warehouse", capacity: 150, cost: 1800, desc: "Diskret lagerplads bag kiosken." },
  { level: 3, name: "Underground Bunker", capacity: 240, cost: 4200, desc: "Skjult stash med plads til alt." },
];

export const INVESTMENTS = [
  {
    id: "kiosk-share",
    name: "Corner Kiosk Share",
    cost: 850,
    desc: "Fast cut fra kiosksalget.",
    dailyIncome: 55,
  },
  {
    id: "e-brand",
    name: "Indie E-cig Brand",
    cost: 1600,
    desc: "Tilfældige payout når kampagner rammer.",
    randomIncome: { chance: 0.32, min: 120, max: 260 },
  },
  {
    id: "snack-vendor",
    name: "Snack Vendor",
    cost: 450,
    desc: "Lille stabil sidehustle.",
    dailyIncome: 25,
  },
];

export const RIVAL_NAMES = [
  "Neon Niko",
  "Mallory the Mall Queen",
  "Sk8r Kai",
  "Dockside Daria",
  "Arcade Axel",
];

export const QUEST_TEMPLATES = {
  sell: {
    minTarget: 4,
    maxTarget: 9,
    reward: { type: "money", min: 120, max: 260 },
  },
  profit: {
    targets: [300, 500, 800],
    reward: { type: "buff", key: "riskShield", amount: 6 },
  },
  travel: {
    targets: [3, 4],
    reward: { type: "money", min: 150, max: 220 },
  },
};

export const ACHIEVEMENTS = [
  {
    id: "wealth-1",
    name: "Pocket Millionaire",
    description: "Have $10.000 samlet formue.",
    condition: { type: "netWorth", value: 10000 },
    reward: { type: "discount", amount: 0.01 },
  },
  {
    id: "day-25",
    name: "Weekend Warrior",
    description: "Overlev dag 25.",
    condition: { type: "day", value: 25 },
  },
  {
    id: "raid-10",
    name: "Raid Survivor",
    description: "Overlev 10 raids.",
    condition: { type: "raids", value: 10 },
  },
  {
    id: "collector",
    name: "Flavor Collector",
    description: "Hav mindst 5 af hver puffbar på én gang.",
    condition: { type: "inventoryFull", amount: 5 },
  },
  {
    id: "prestige-1",
    name: "Prestige Initiate",
    description: "Prestige én gang.",
    condition: { type: "prestige", value: 1 },
    reward: { type: "riskReduction", amount: 2 },
  },
];

export const PRESTIGE_CONFIG = {
  requirementNetWorth: 60000,
  requirementDay: 40,
  baseBonusCash: 800,
  riskReductionPerPrestige: 2,
  discountPerPrestige: 0.01,
};

export const PRICE_FLOOR = 5;

export const SAVE_VERSION = 3;
