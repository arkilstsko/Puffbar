// modal.js
// Simpel modal-håndtering

export function showModal(title, body) {
  const overlay = document.getElementById("modal-overlay");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");

  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.textContent = body;
  overlay.classList.remove("hidden");
}

export function hideModal() {
  const overlay = document.getElementById("modal-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
}
