// Offline cache for Stick Empire 3D. The build writes the version and file list in.
const CACHE = 'se3d-11548f2e34';
const FILES = ["./","assets.21414de4d0.json","fonts/barlow-semi-condensed-latin-500-normal.woff2","fonts/barlow-semi-condensed-latin-600-normal.woff2","fonts/fonts.css","fonts/teko-latin-500-normal.woff2","fonts/teko-latin-600-normal.woff2","game.5c665ad21b.js","icons/apple-touch-icon.png","icons/favicon-48.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","manifest.webmanifest","online-config.js","vendor/supabase.46a3cc6618.js","vendor/three.min.js"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('se3d-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache first (everything this build needs is precached), falling back to the network.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./', { cacheName: CACHE }).then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
