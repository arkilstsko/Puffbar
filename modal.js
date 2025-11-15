// modal.js
// Bottom-sheet modal implementation using Framework7 sheets.

let sheetInstance = null;

export function initModal(app) {
  const sheetEl = document.getElementById("info-sheet");
  if (!sheetEl || !app) return;
  sheetInstance = app.sheet.create({
    el: sheetEl,
    swipeToClose: true,
    backdrop: true,
    closeByOutsideClick: true,
  });

  const closeBtn = document.getElementById("info-sheet-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      hideModal();
    });
  }
}

export function showModal(title, body, { html = false } = {}) {
  const titleEl = document.getElementById("info-sheet-title");
  const bodyEl = document.getElementById("info-sheet-body");
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) {
    if (html) {
      bodyEl.innerHTML = body;
    } else {
      bodyEl.textContent = body;
    }
  }
  if (sheetInstance) {
    sheetInstance.open();
  }
}

export function hideModal() {
  if (sheetInstance) {
    sheetInstance.close();
  }
}
