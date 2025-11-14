// events.js
// Daglige events + dag-slut logik (raids, lose conditions)

import { PRODUCTS } from "./config.js";
import {
  gameState,
  estimateInventoryValue,
  logEvent
} from "./state.js";
import { showModal } from "./modal.js";

export function applyDailyEvent() {
  const roll = Math.random();
  let news;

  if (roll < 0.18) {
    // Influencer hype
    const p = randomProduct();
    gameState.currentPrices[p.id] = Math.round(gameState.currentPrices[p.id] * (1.4 + Math.random() * 0.4));
    news = `${p.name} går viralt på TikTok! Priserne stiger voldsomt.`;
  } else if (roll < 0.32) {
    // Politiet strammer
    gameState.risk = Math.min(100, gameState.risk + 8);
    news = "Politiet øger kontrol ved skoler og centre. Varme-niveauet stiger.";
  } else if (roll < 0.46) {
    // Stille dag
    news = "Stilhed i gaderne. Intet særligt sker i dag – men noget ulmer.";
  } else if (roll < 0.6) {
    // Billig import
    const p = randomProduct();
    gameState.currentPrices[p.id] = Math.max(5, Math.round(gameState.currentPrices[p.id] * (0.6 + Math.random() * 0.2)));
    news = `Billig import! ${p.name} kan købes ekstra billigt i dag.`;
  } else if (roll < 0.72) {
    // Skolefest spike
    const p = randomProduct();
    gameState.currentPrices[p.id] = Math.round(
      gameState.currentPrices[p.id] * (1.8 + Math.random() * 0.4)
    );
    news = `Skolefest i nærheden! ${p.name} er HOT og sælges til overpris.`;
  } else if (roll < 0.82) {
    // TikTok ban
    const p = randomProduct();
    gameState.currentPrices[p.id] = Math.max(
      5,
      Math.round(gameState.currentPrices[p.id] * (0.4 + Math.random() * 0.2))
    );
    news = `TikTok fjerner challenge-videoer. Efterspørgslen på ${p.name} falder hårdt.`;
  } else if (roll < 0.9) {
    // Mystery donor
    const boost = 20 + Math.floor(Math.random() * 40);
    gameState.money += boost;
    news = `En ældre fyr i hættetrøje stikker dig $${boost}. “Stay hustlin’.”`;
  } else if (roll < 0.97) {
    // Rival dealer
    const p = randomProduct();
    gameState.currentPrices[p.id] += 10;
    news = `En rival dealer dumper priserne. Du må hæve dine ${p.name} for at følge med.`;
  } else {
    // Flavor ban rumor – alt stiger
    const multiplier = 1.3 + Math.random() * 0.3;
    for (const p of PRODUCTS) {
      gameState.currentPrices[p.id] = Math.round(gameState.currentPrices[p.id] * multiplier);
    }
    news = "Rygter om national smagsforbud – hele markedet går amok.";
  }

  gameState.news = news;
}

export function applyEndOfDayCycle(isTravel = false) {
  const invValue = estimateInventoryValue();
  const riskFactor = gameState.risk / 100;
  const raidChance = 0.05 + riskFactor * 0.35;
  const roll = Math.random();

  if (roll < raidChance && invValue > 0) {
    const lostFraction = 0.3 + Math.random() * 0.4;
    let lostTotal = 0;

    for (const p of PRODUCTS) {
      const current = gameState.inventory[p.id] || 0;
      const lose = Math.floor(current * lostFraction);
      gameState.inventory[p.id] = Math.max(0, current - lose);
      lostTotal += lose;
    }

    const fine = Math.round(invValue * (0.15 + Math.random() * 0.15));
    gameState.money = Math.max(0, gameState.money - fine);

    logEvent(
      "Raid",
      "Police",
      `Politiet konfiskerede ca. ${lostTotal} puffbars og gav dig en bøde på $${fine}.`
    );

    showModal(
      "Kontrol",
      "Politiet lavede en kontrol – du mistede varer og fik en bøde. Måske skal du skrue ned for varmen."
    );

    gameState.risk = Math.max(5, Math.floor(gameState.risk * 0.4));
  }

  gameState.day += 1;
  gameState.risk = Math.max(0, gameState.risk - (isTravel ? 2 : 3));

  checkLoseConditions();
}

export function checkLoseConditions() {
  const invValue = estimateInventoryValue();
  if (gameState.money <= 0 && invValue === 0) {
    showModal(
      "Bankerot",
      "Du er broke og har ingen puffbars. PuffLord-drømmen sluttede her. Start et nyt spil og spil smartere."
    );
  }
}

function randomProduct() {
  return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
}
