// Shift Chat service worker: push notifications only (no offline cache, so staff always get the latest version).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'Shift Chat', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Shift Chat', {
    body: d.body || 'New request',
    tag: d.tag || undefined,
    renotify: true,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: self.registration.scope + '#orders' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.registration.scope)) { c.focus(); c.postMessage('refresh'); return; } }
    return self.clients.openWindow(url);
  }));
});
