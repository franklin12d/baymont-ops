// FA-Hotel service worker: push notifications only (no offline cache, so staff always get the latest version).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'FA-Hotel', body: e.data && e.data.text() }; }
  const urgent = !!d.urgent || /^URGENT/.test(d.title || '');
  e.waitUntil(self.registration.showNotification(d.title || 'FA-Hotel', {
    body: d.body || 'New request',
    tag: d.tag || undefined,
    renotify: true,
    requireInteraction: urgent,
    vibrate: urgent ? [200, 90, 200, 90, 400] : [120],
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: self.registration.scope + (d.hash === '#team' ? '#team' : '#orders') },
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
