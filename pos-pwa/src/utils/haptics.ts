// Tactile haptic feedback utility for mobile browsers
export const haptics = {
  // Light mechanical tap for button clicks (12ms)
  tap: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        /* ignore */
      }
    }
  },

  // Double pulse for confirmed sale
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 50, 70]);
      } catch {
        /* ignore */
      }
    }
  },

  // Warning buzz for unbalance or validation failure
  warning: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {
        /* ignore */
      }
    }
  },
};
