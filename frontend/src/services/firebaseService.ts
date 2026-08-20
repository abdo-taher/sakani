/**
 * Firebase Cloud Messaging (FCM) Web Client Service
 * Handles foreground push messaging, device token registration with backend,
 * and service worker synchronization.
 */

import { apiRequest, getAuthToken } from './apiService';
import { playAdminNotificationSound, playCustomerNotificationSound } from '../utils/sound';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  vapidKey?: string;
}

export interface PushNotificationPayload {
  id?: string;
  type: string;
  title: string;
  body: string;
  route?: string;
  entity_type?: string;
  entity_id?: string;
  created_at?: string;
  data?: Record<string, any>;
}

// Active Firebase Web Configuration provided by user
export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDF1aIk-P2iRzvFJ9I4bpD_Hu6SwmG3xbA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sakani-fa8db.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sakani-fa8db',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sakani-fa8db.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '341186088920',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:341186088920:web:14cf3cd527133fd88a6cad',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-3QWPEBHT1P',
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
};

let messagingInstance: any = null;
let isInitialized = false;
const messageListeners: Array<(payload: PushNotificationPayload) => void> = [];

/**
 * Check if real Firebase environment variables/configuration is active.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.messagingSenderId
  );
}

/**
 * Initialize Firebase App and Messaging SDK dynamically.
 */
export async function initializeFirebase(): Promise<any> {
  if (isInitialized) return messagingInstance;
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  if (!isFirebaseConfigured()) {
    console.info('Firebase Messaging: [AWAITING FIREBASE CONFIGURATION] - Set VITE_FIREBASE_* variables in .env');
    isInitialized = true;
    return null;
  }

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging');

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser.');
      isInitialized = true;
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
    messagingInstance = getMessaging(app);

    // Initialize Analytics safely if supported and measurementId is present
    try {
      if (FIREBASE_CONFIG.measurementId && typeof window !== 'undefined') {
        const { isSupported: isAnalyticsSupported, getAnalytics } = await import('firebase/analytics');
        const analyticsSupported = await isAnalyticsSupported().catch(() => false);
        if (analyticsSupported) {
          try {
            getAnalytics(app);
          } catch {}
        }
      }
    } catch {}

    // Register foreground message listener
    onMessage(messagingInstance, (payload: any) => {
      const parsed: PushNotificationPayload = {
        id: payload.messageId || payload.data?.notification_id || `fcm-${Date.now()}`,
        type: payload.data?.type || 'general',
        title: payload.notification?.title || payload.data?.title || 'إشعار جديد',
        body: payload.notification?.body || payload.data?.body || '',
        route: payload.data?.route || payload.notification?.click_action || '/',
        entity_type: payload.data?.entity_type,
        entity_id: payload.data?.entity_id,
        created_at: new Date().toISOString(),
        data: payload.data,
      };

      // Play sound based on target audience
      if (parsed.type.includes('admin') || parsed.route?.startsWith('/admin')) {
        playAdminNotificationSound(parsed.id);
      } else {
        playCustomerNotificationSound(parsed.id);
      }

      // Notify all registered UI listeners
      messageListeners.forEach((listener) => {
        try {
          listener(parsed);
        } catch (e) {}
      });
    });

    // Register Service Worker for background push
    if ('serviceWorker' in navigator) {
      const swUrl = `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}&projectId=${encodeURIComponent(FIREBASE_CONFIG.projectId)}&messagingSenderId=${encodeURIComponent(FIREBASE_CONFIG.messagingSenderId)}&appId=${encodeURIComponent(FIREBASE_CONFIG.appId)}`;
      navigator.serviceWorker.register(swUrl).catch(() => {});
    }

    isInitialized = true;
    return messagingInstance;
  } catch (err) {
    console.warn('Firebase Messaging init error:', err);
    isInitialized = true;
    return null;
  }
}

/**
 * Request Notification Permission and return FCM Registration Token.
 */
export async function requestNotificationPermission(
  role: 'admin' | 'customer' = 'customer',
  phone?: string
): Promise<{ granted: boolean; token?: string; error?: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, error: 'المتصفح الحالي لا يدعم خدمة الإشعارات' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { granted: false, error: 'تم رفض إذن الإشعارات من قبل المستخدم' };
    }

    const messaging = await initializeFirebase();
    if (!messaging) {
      // Mock / Offline token generation for preview
      const localToken = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await registerTokenWithBackend(localToken, role, phone);
      return { granted: true, token: localToken };
    }

    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_CONFIG.vapidKey || undefined,
    });

    if (token) {
      await registerTokenWithBackend(token, role, phone);
      return { granted: true, token };
    }

    return { granted: true, error: 'لم يتمكن من استخراج رمز الجهاز' };
  } catch (err: any) {
    return { granted: false, error: err.message || 'حدث خطأ أثناء طلب الإذن' };
  }
}

/**
 * Register FCM device token with Laravel backend database.
 */
export async function registerTokenWithBackend(
  token: string,
  role: 'admin' | 'customer' = 'customer',
  phone?: string
): Promise<boolean> {
  try {
    if (role === 'admin') {
      const authToken = getAuthToken();
      if (!authToken) {
        return false;
      }
      await apiRequest('/admin/device-tokens', {
        method: 'POST',
        body: JSON.stringify({ token, device_type: 'web' }),
      });
    } else {
      await apiRequest('/device-tokens', {
        method: 'POST',
        body: JSON.stringify({ token, phone, device_type: 'web' }),
      });
    }
    return true;
  } catch (err) {
    // Graceful offline fallback
    return false;
  }
}

/**
 * Unregister FCM device token from Laravel backend.
 */
export async function unregisterTokenFromBackend(token: string): Promise<void> {
  try {
    await apiRequest('/device-tokens', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  } catch (err) {}
}

/**
 * Subscribe to foreground push notifications.
 */
export function onPushNotification(callback: (payload: PushNotificationPayload) => void): () => void {
  messageListeners.push(callback);
  return () => {
    const idx = messageListeners.indexOf(callback);
    if (idx !== -1) messageListeners.splice(idx, 1);
  };
}

/**
 * Trigger an in-app simulated notification (useful for testing or instant client events).
 */
export function triggerLocalNotification(payload: PushNotificationPayload): void {
  if (payload.type.includes('admin') || payload.route?.startsWith('/admin')) {
    playAdminNotificationSound(payload.id);
  } else {
    playCustomerNotificationSound(payload.id);
  }

  messageListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {}
  });
}
