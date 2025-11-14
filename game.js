// game.js
// Entrypoint – binder det hele sammen

import { resetGameState } from "./state.js";
import { generateDailyPrices } from "./prices.js";
import { renderAll } from "./ui.js";
import { hideModal } from "./modal.js";
import { endDay } from "./travel.js";

function startNewGame() {
  resetGameState();
  generateDailyPrices();
  renderAll();
}
function vibrate(ms = 30) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function attachGlobalListeners() {
  const btnEndDay = document.getElementById("btn-end-day");
  const btnNewGame = document.getElementById("btn-new-game");
  const overlay = document.getElementById("modal-overlay");
  const closeBtn = document.getElementById("modal-close");

  if (btnEndDay) {
    btnEndDay.addEventListener("click", () => {
      endDay();
      renderAll();
    });
  }

  if (btnNewGame) {
    btnNewGame.addEventListener("click", () => {
      startNewGame();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) hideModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", hideModal);
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") hideModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-overlay");
  modal.classList.add("hidden"); // HARD FORCE HIDE

  attachGlobalListeners();
  initGameState();
  renderAll();
});
