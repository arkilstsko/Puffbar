// app.js
// Entry point orchestrating modules, UI and Framework7 integration.

import { resetGameState, gameState } from "./state.js";
import { generateDailyPrices } from "./prices.js";
import { ensureDailyQuests } from "./quests.js";
import { loadStateFromStorage, saveState } from "./save.js";
import { evaluateAchievements } from "./achievements.js";
import { initModal } from "./modal.js";
import { initUI } from "./ui.js";

let frameworkApp = null;

function boot() {
  hydrateState();
  frameworkApp = new window.Framework7({
    el: "#app",
    name: "PuffLord",
    theme: "auto",
  });
  initModal(frameworkApp);
  initUI({ app: frameworkApp });
  setupPersistence();
}

function hydrateState() {
  const loaded = loadStateFromStorage();
  if (!loaded || !hasValidPrices()) {
    resetGameState({ keepMeta: true });
    generateDailyPrices();
    saveState();
  }
  ensureDailyQuests();
  evaluateAchievements();
}

function hasValidPrices() {
  return gameState.currentPrices && Object.keys(gameState.currentPrices).length > 0;
}

function setupPersistence() {
  window.addEventListener("beforeunload", saveState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveState();
    }
  });
}

document.addEventListener("DOMContentLoaded", boot);
