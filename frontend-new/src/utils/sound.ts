/**
 * Web Audio API Synthesizer & Notification Sound Engine
 * Provides crystal-clear audio chimes for Admin and Customer notifications
 * without external audio asset network failures or autoplay crashes.
 */

// Deduplication set to prevent replaying sound for the same notification message ID
const playedNotificationIds = new Set<string>();

// Track user audio initialization for browser autoplay policy
let audioCtx: AudioContext | null = null;
let hasUserInteracted = false;

/**
 * Initialize Audio Context on first user gesture.
 */
export function initAudioContext() {
  if (!hasUserInteracted) return;
  try {
    const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    if (AudioContextClass) {
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }
  } catch (e) {
    // AudioContext not supported
  }
}

// Auto-attach gesture listeners once on client
if (typeof window !== 'undefined') {
  const unlock = () => {
    hasUserInteracted = true;
    try {
      initAudioContext();
    } catch {}
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

/**
 * Check if sound is enabled in user preferences (default: true).
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem('sakani_sound_enabled');
  return val === null ? true : val === 'true';
}

/**
 * Toggle sound enabled state in localStorage.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sakani_sound_enabled', enabled ? 'true' : 'false');
}

/**
 * Synthesize and play a distinctive chime using Web Audio API.
 */
function playTone(frequencies: number[], duration = 0.15, interval = 0.08, type: OscillatorType = 'sine') {
  if (!isSoundEnabled()) return;

  try {
    initAudioContext();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    frequencies.forEach((freq, idx) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + idx * interval);

      gain.gain.setValueAtTime(0.001, now + idx * interval);
      gain.gain.exponentialRampToValueAtTime(0.2, now + idx * interval + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * interval + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * interval);
      osc.stop(now + idx * interval + duration + 0.05);
    });
  } catch (e) {
    // Ignore audio playback errors gracefully
  }
}

/**
 * Play Admin New Business Notification Alert Sound (3-harmonic ascending chime).
 */
export function playAdminNotificationSound(notificationId?: string) {
  if (notificationId) {
    if (playedNotificationIds.has(notificationId)) return;
    playedNotificationIds.add(notificationId);
  }

  // C6 (1046.5Hz) -> E6 (1318.5Hz) -> G6 (1567.9Hz)
  playTone([1046.5, 1318.5, 1567.9], 0.22, 0.09, 'sine');
}

/**
 * Play Customer Status Update Notification Sound (Soft 2-harmonic chime).
 */
export function playCustomerNotificationSound(notificationId?: string) {
  if (notificationId) {
    if (playedNotificationIds.has(notificationId)) return;
    playedNotificationIds.add(notificationId);
  }

  // E5 (659.25Hz) -> A5 (880.0Hz)
  playTone([659.25, 880.0], 0.25, 0.12, 'sine');
}

/**
 * Universal Notification Sound Player.
 * Tries loading /sounds/notification.mp3 with 0.8 volume,
 * falling back seamlessly to Web Audio API synthesis.
 */
export function playNotificationSound(notificationId?: string, role: 'admin' | 'customer' = 'admin') {
  if (!isSoundEnabled()) return;

  if (notificationId) {
    if (playedNotificationIds.has(notificationId)) return;
    playedNotificationIds.add(notificationId);
  }

  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = role === 'admin' ? 0.85 : 0.65;
    audio.play().catch(() => {
      // Browser autoplay restriction or file loading fallback -> use Web Audio synthesizer
      if (role === 'admin') {
        playAdminNotificationSound();
      } else {
        playCustomerNotificationSound();
      }
    });
  } catch (e) {
    if (role === 'admin') {
      playAdminNotificationSound();
    } else {
      playCustomerNotificationSound();
    }
  }
}

/**
 * Play Soft Success Chime.
 */
export function playSuccessSound() {
  playTone([523.25, 659.25, 783.99, 1046.5], 0.18, 0.07, 'triangle');
}
