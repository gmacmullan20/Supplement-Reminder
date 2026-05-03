const CACHE = 'supp-v1';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE') {
    const { id, name, dose, ms } = e.data;
    setTimeout(() => {
      self.registration.showNotification(`Time for ${name}`, {
        body: dose ? `Take your ${dose} dose now.` : 'Time to take your supplement.',
        icon: './icon.png',
        tag: `supp-${id}`,
        renotify: true,
        vibrate: [200, 100, 200],
      });
    }, ms);
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(cs => {
    if (cs.length) return cs[0].focus();
    return clients.openWindow('./');
  }));
});
