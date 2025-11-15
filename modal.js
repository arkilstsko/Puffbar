// modal.js
// Minimal modal system with safe defaults.

const overlayId = "modal-overlay";
const titleId = "modal-title";
const bodyId = "modal-body";
const closeId = "modal-close";

export function initModal() {
  const overlay = document.getElementById(overlayId);
  const closeBtn = document.getElementById(closeId);
  hideModal();
  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) hideModal();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", hideModal);
  }
}

export function showModal(title, body) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  const titleEl = document.getElementById(titleId);
  const bodyEl = document.getElementById(bodyId);
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.textContent = body;
  overlay.classList.remove("modal-hidden");
}

export function hideModal() {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.add("modal-hidden");
}
