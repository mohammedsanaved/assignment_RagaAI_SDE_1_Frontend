import { useCallback, useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  useEffect(() => {
    if (permission === 'granted' && 'serviceWorker' in navigator && VAPID_PUBLIC_KEY) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            setSubscription(sub);
          } else {
            const newSub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            setSubscription(newSub);
          }
        } catch (error) {
          console.error('Failed to subscribe to push notifications:', error);
        }
      });
    }
  }, [permission]);

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.showNotification(title, {
          icon: '/favicon.ico',
          ...options,
        });
      } catch (error) {
        console.error('Failed to show notification via service worker:', error);
      }
    } else {
      // Fallback for environments without Service Worker support
      new Notification(title, options);
    }
  }, []);

  return { permission, subscription, sendNotification };
}
