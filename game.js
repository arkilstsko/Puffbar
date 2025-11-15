// game.js
// Entrypoint tying together state, rendering and persistence.

import { resetGameState, gameState } from "./state.js";
import { generateDailyPrices } from "./prices.js";
import { renderAll, bindGlobalButtons } from "./ui.js";
import { initModal, hideModal } from "./modal.js";
import { ensureDailyQuests } from "./quests.js";
import { loadStateFromStorage, saveState } from "./save.js";
import { evaluateAchievements } from "./achievements.js";

function init() {
  initModal();
  bindGlobalButtons();

  const loaded = loadStateFromStorage();
  if (!loaded || !hasValidPrices()) {
    resetGameState({ keepMeta: true });
    generateDailyPrices();
    saveState();
  }

  ensureDailyQuests();
  evaluateAchievements();
  renderAll();
}

function hasValidPrices() {
  return gameState.currentPrices && Object.keys(gameState.currentPrices).length > 0;
}

document.addEventListener("DOMContentLoaded", () => {
  hideModal();
  init();
});
