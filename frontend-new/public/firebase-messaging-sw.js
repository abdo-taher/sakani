/**
 * Firebase Messaging Service Worker (Background Push Notifications)
 * Handles incoming push notifications when browser/tab is in the background.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Parse configuration from URL query params if provided, or default configuration
const params = new URL(location).searchParams;
const firebaseConfig = {
  apiKey: params.get('apiKey') || 'AIzaSyDF1aIk-P2iRzvFJ9I4bpD_Hu6SwmG3xbA',
  authDomain: params.get('authDomain') || 'sakani-fa8db.firebaseapp.com',
  projectId: params.get('projectId') || 'sakani-fa8db',
  storageBucket: params.get('storageBucket') || 'sakani-fa8db.firebasestorage.app',
  messagingSenderId: params.get('messagingSenderId') || '341186088920',
  appId: params.get('appId') || '1:341186088920:web:14cf3cd527133fd88a6cad',
};

if (firebase.apps.length === 0) {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'منصة سكني';
      const options = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: payload.notification?.icon || '/favicon.svg',
        badge: '/favicon.svg',
        data: payload.data || {},
        tag: payload.data?.notification_id || payload.data?.type || 'sakani-notification',
        dir: 'rtl',
        lang: 'ar',
      };

      return self.registration.showNotification(title, options);
    });
  } catch (err) {
    // Background init failed
  }
}

// Fallback native push event listener
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.notification?.title || data.data?.title || data.title || 'منصة سكني';
      const options = {
        body: data.notification?.body || data.data?.body || data.body || '',
        icon: data.notification?.icon || '/favicon.svg',
        badge: '/favicon.svg',
        data: data.data || {},
        tag: data.data?.notification_id || data.data?.type || 'sakani-push',
        dir: 'rtl',
        lang: 'ar',
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      // Non-JSON push payload
      event.waitUntil(
        self.registration.showNotification('منصة سكني', {
          body: event.data.text(),
          dir: 'rtl',
          lang: 'ar',
        })
      );
    }
  }
});

// Notification Click -> Focus or Navigate to target route
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.route || event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
