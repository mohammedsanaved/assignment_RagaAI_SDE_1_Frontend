/* eslint-disable no-restricted-globals */
const self = (globalThis as unknown) as any;

self.addEventListener('install', (event: any) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  console.log('Service Worker activating.');
});

self.addEventListener('push', (event: any) => {
  const data = event.data?.json();
  const title = data?.title || 'HealSync Notification';
  const options = {
    body: data?.body || 'New update available.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/')
  );
});
