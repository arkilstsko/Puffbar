// config.js
// Konfiguration af produkter, lokationer m.m.

export const PRODUCTS = [
  {
    id: "basic-breeze",
    name: "Basic Breeze",
    emoji: "💨",
    basePrice: 15,
    volatility: 0.25,
    desc: "Standard puff, alle 9. klasses favorit."
  },
  {
    id: "ice-blast",
    name: "Ice Blast",
    emoji: "🧊",
    basePrice: 22,
    volatility: 0.35,
    desc: "Iskold mentol, stort hype på TikTok."
  },
  {
    id: "rainbow-rush",
    name: "Rainbow Rush 5000",
    emoji: "🌈",
    basePrice: 35,
    volatility: 0.45,
    desc: "Alt for mange smage i én. Kids elsker den."
  },
  {
    id: "mango-madness",
    name: "Mango Madness",
    emoji: "🥭",
    basePrice: 28,
    volatility: 0.3,
    desc: "Sød mango, god margin i de rige kvarterer."
  },
  {
    id: "berry-blaster",
    name: "Berry Blaster",
    emoji: "🫐",
    basePrice: 26,
    volatility: 0.4,
    desc: "Syrlig bærsmag, populær blandt pigerne."
  },
  {
    id: "cola-crush",
    name: "Cola Crush",
    emoji: "🥤",
    basePrice: 20,
    volatility: 0.3,
    desc: "Klassisk cola – smager af sommer og dårlig beslutning."
  },
  {
    id: "ultra-grape",
    name: "Ultra Grape 9000",
    emoji: "🍇",
    basePrice: 38,
    volatility: 0.55,
    desc: "Ekstrem grape – elsker eller hader. Høj risiko/høj reward."
  },
  {
    id: "banana-burst",
    name: "Banana Burst",
    emoji: "🍌",
    basePrice: 18,
    volatility: 0.2,
    desc: "Billig og stabil – perfekt til bulk deals."
  },
  {
    id: "cosmic-cotton",
    name: "Cosmic Cotton Candy",
    emoji: "🍭",
    basePrice: 30,
    volatility: 0.5,
    desc: "Over-sød. Over-populær. Over-prissat."
  }
];

export const LOCATIONS = [
  {
    id: "downtown",
    name: "Downtown",
    priceModifier: 1.0,
    riskModifier: 1.0,
    flavor: "Balanceret marked – fine priser, moderat risiko."
  },
  {
    id: "mall",
    name: "Skymall",
    priceModifier: 1.2,
    riskModifier: 1.4,
    flavor: "Rige kids med lommepenge – men security er vågen."
  },
  {
    id: "skate-park",
    name: "Skate Park",
    priceModifier: 0.9,
    riskModifier: 0.7,
    flavor: "Billige deals, lavere risiko – men lavere priser."
  },
  {
    id: "docks",
    name: "Neon Docks",
    priceModifier: 0.8,
    riskModifier: 1.6,
    flavor: "Billige bulk-køb, høj risiko for raids."
  }
];

export const MAX_LOG_ENTRIES = 40;
