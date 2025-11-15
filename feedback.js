// feedback.js
// Helper for optional haptic feedback with semantic presets.

function vibratePattern(pattern) {
  try {
    if (typeof navigator !== "undefined" && navigator?.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    // ignore – haptics are optional.
  }
}

export function hapticShort() {
  vibratePattern([28]);
}

export function hapticMedium() {
  vibratePattern([45, 30, 45]);
}

export function hapticLong() {
  vibratePattern([80, 40, 80]);
}

export function vibrate(duration = 25) {
  vibratePattern([duration]);
}
