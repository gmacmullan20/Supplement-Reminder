const CACHE = ‘supp-v3’;
const ASSETS = [’./’, ‘./index.html’, ‘./manifest.json’];

self.addEventListener(‘install’, e => {
e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
self.skipWaiting();
});

self.addEventListener(‘activate’, e => {
// Delete any old caches so updates load immediately
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
).then(() => clients.claim())
);
});

self.addEventListener(‘fetch’, e => {
// Network-first: always try to get the latest version, fall back to cache
e.respondWith(
fetch(e.request)
.then(response => {
const copy = response.clone();
caches.open(CACHE).then(c => c.put(e.request, copy));
return response;
})
.catch(() => caches.match(e.request))
);
});

// Store scheduled notifications so we can use showNotification at the right time
const scheduled = {};

self.addEventListener(‘message’, e => {
if (e.data?.type === ‘SCHEDULE’) {
const { id, name, dose, ms } = e.data;

```
// Clear any existing timer for this supplement
if (scheduled[id]) {
  clearTimeout(scheduled[id]);
  delete scheduled[id];
}

// Only schedule if under 12 hours away (SW won't survive longer sleeps on iOS)
if (ms > 0 && ms <= 12 * 60 * 60 * 1000) {
  scheduled[id] = setTimeout(() => {
    self.registration.showNotification(`Time for ${name}`, {
      body: dose ? `Take your ${dose} dose now.` : 'Time to take your supplement.',
      icon: './icon.png',
      tag: `supp-${id}`,
      renotify: true,
      vibrate: [200, 100, 200],
    });
    delete scheduled[id];
  }, ms);
}
```

}
});

self.addEventListener(‘notificationclick’, e => {
e.notification.close();
e.waitUntil(clients.matchAll({ type: ‘window’ }).then(cs => {
if (cs.length) return cs[0].focus();
return clients.openWindow(’./’);
}));
});
