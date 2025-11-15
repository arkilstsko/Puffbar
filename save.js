// save.js
// LocalStorage persistence helpers.

import { SAVE_VERSION } from "./config.js";
import { getSerializableState, hydrateGameState, resetGameState } from "./state.js";

const SAVE_KEY = "pufflord-save";

export function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION) {
      // Old saves get reset but we still honour achievements/meta if possible
      hydrateGameState(parsed || {});
      persistState();
      return true;
    }
    hydrateGameState(parsed);
    return true;
  } catch (err) {
    console.warn("Failed to load PuffLord save", err);
    return false;
  }
}

export function persistState() {
  try {
    const payload = JSON.stringify(getSerializableState());
    localStorage.setItem(SAVE_KEY, payload);
  } catch (err) {
    console.warn("Failed to persist PuffLord save", err);
  }
}

export function saveState() {
  persistState();
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn("Failed to clear PuffLord save", err);
  }
  resetGameState({ keepMeta: true });
  persistState();
}
