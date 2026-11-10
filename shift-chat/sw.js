// FrankShift service worker: push notifications only (no offline cache, so staff always get the latest version).
// The phone plays its own notification sound; FrankShift's in-app tones play while the app is open.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// The app saves the language the person picked, so alerts come in that language.
async function lang(){
  try { const r = await (await caches.open('fs-pref')).match('fs-lang'); const v = r ? (await r.text()).trim() : ''; if (v === 'es' || v === 'en') return v; } catch {}
  return /^es\b/i.test((self.navigator && self.navigator.language) || '') ? 'es' : 'en';
}
// Each kind feels different in the pocket: order = two short taps, urgent = fast long buzzing, alarm = three long buzzes.
const VIBE = { order: [150, 100, 150], urgent: [300, 100, 300, 100, 300, 100, 300, 100, 700], alarm: [900, 250, 900, 250, 1200],
  mention: [80, 60, 80], start: [80, 60, 160], done: [60, 50, 60, 50, 220], test: [200, 100, 200] };

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'FrankShift', body: e.data && e.data.text() }; }
  const urgent = !!d.urgent || /URGENT/.test(d.title || '');
  e.waitUntil(lang().then(l => {
    const es = l === 'es';
    const title = (es && d.title_es) || d.title || 'FrankShift';
    const body = (es && d.body_es) || d.body || (es ? 'Nuevo pedido' : 'New request');
    return self.registration.showNotification(title, {
      body,
      tag: d.tag || undefined,
      renotify: true,
      silent: false,
      requireInteraction: urgent,
      vibrate: VIBE[d.kind === 'alarm' ? 'alarm' : urgent ? 'urgent' : d.kind] || [200, 100, 200],
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      timestamp: Date.now(),
      data: { url: self.registration.scope + (d.hash === '#team' || d.hash === '#passon' ? d.hash : '#orders') },
    });
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
