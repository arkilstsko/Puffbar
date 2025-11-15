// gestures.js
// Lightweight pointer gesture helpers for swipe actions and slide confirmations.

const SWIPE_THRESHOLD = 55;
const SWIPE_TIME = 480;

export function initGlobalGestures(surface, { onSwipeDown, onSwipeUp } = {}) {
  if (!surface) return;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let active = false;

  surface.addEventListener("pointerdown", (event) => {
    active = true;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
  });

  surface.addEventListener("pointerup", (event) => {
    if (!active) return;
    active = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const elapsed = performance.now() - startTime;
    if (elapsed > SWIPE_TIME) return;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
      if (dy > 0 && typeof onSwipeDown === "function") {
        onSwipeDown(event);
      } else if (dy < 0 && typeof onSwipeUp === "function") {
        onSwipeUp(event);
      }
    }
  });

  surface.addEventListener("pointercancel", () => {
    active = false;
  });
}

export function attachRowGestures(element, { onSwipeLeft, onSwipeRight } = {}) {
  if (!element) return;
  let startX = 0;
  let startY = 0;
  let active = false;
  let pointerId = null;

  element.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    active = true;
    startX = event.clientX;
    startY = event.clientY;
    element.setPointerCapture(pointerId);
  });

  element.addEventListener("pointermove", (event) => {
    if (!active || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      active = false;
      element.releasePointerCapture(pointerId);
    }
  });

  element.addEventListener("pointerup", (event) => {
    if (!active || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0 && typeof onSwipeRight === "function") {
        onSwipeRight(event);
      } else if (dx < 0 && typeof onSwipeLeft === "function") {
        onSwipeLeft(event);
      }
    }
    active = false;
    element.releasePointerCapture(pointerId);
  });

  element.addEventListener("pointercancel", (event) => {
    if (event.pointerId === pointerId) {
      active = false;
      element.releasePointerCapture(pointerId);
    }
  });
}

export function initSlideGesture(trackEl, thumbEl, { onConfirm } = {}) {
  if (!trackEl || !thumbEl) return;
  let active = false;
  let startX = 0;
  let pointerId = null;
  let maxOffset = 0;
  let current = 0;

  const resetThumb = () => {
    current = 0;
    requestAnimationFrame(() => {
      thumbEl.style.transition = "transform 280ms ease";
      thumbEl.style.transform = "translateX(0px)";
    });
    setTimeout(() => {
      thumbEl.style.transition = "";
    }, 300);
  };

  thumbEl.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    active = true;
    startX = event.clientX;
    maxOffset = trackEl.clientWidth - thumbEl.clientWidth - 8;
    if (maxOffset < 0) maxOffset = 0;
    thumbEl.setPointerCapture(pointerId);
    thumbEl.style.transition = "";
  });

  thumbEl.addEventListener("pointermove", (event) => {
    if (!active || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    current = Math.max(0, Math.min(maxOffset, dx));
    requestAnimationFrame(() => {
      thumbEl.style.transform = `translateX(${current}px)`;
    });
  });

  const completeSlide = () => {
    requestAnimationFrame(() => {
      thumbEl.style.transition = "transform 160ms ease-out";
      thumbEl.style.transform = `translateX(${maxOffset}px)`;
    });
    if (typeof onConfirm === "function") {
      onConfirm();
    }
    setTimeout(resetThumb, 420);
  };

  thumbEl.addEventListener("pointerup", (event) => {
    if (!active || event.pointerId !== pointerId) return;
    active = false;
    thumbEl.releasePointerCapture(pointerId);
    if (current >= maxOffset * 0.88) {
      completeSlide();
    } else {
      resetThumb();
    }
  });

  thumbEl.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== pointerId) return;
    active = false;
    thumbEl.releasePointerCapture(pointerId);
    resetThumb();
  });
}
