// feedback.js
// Helper for optional haptic feedback without throwing if not supported.

export function vibrate(duration = 25) {
  try {
    if (navigator?.vibrate) {
      navigator.vibrate(duration);
    }
  } catch (err) {
    // Fail silently – haptics are optional.
  }
}
