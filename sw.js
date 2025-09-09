// sw.js — mobile-focused caching for repeat visits on GitHub Pages
const VERSION = 'v1.0.0-restore1-step3';
const PRECACHE = `precache-${VERSION}`;
const RUNTIME  = `runtime-${VERSION}`;
const IMG_CACHE = `images-${VERSION}`;

const PRECACHE_URLS = [
  // CSS/JS
  'css/bootstrap.min.css',
  'css/font-awesome.css',
  'css/owl.carousel.css',
  'css/style.css',
  'css/settings.css',
  'js/jquery-2.1.4.min.js',
  'js/bootstrap.min.js',
  'js/jquery.themepunch.tools.min.js',
  'js/jquery.themepunch.revolution.min.js',
  'js/owl.carousel.js',
  'js/script.js',
  'js/custom.js',
  // small images/icons
  'images/logo.png',
  'images/footer-logo.png',
  'favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => {
        if (![PRECACHE, RUNTIME, IMG_CACHE].includes(k)) return caches.delete(k);
      }))
    ).then(self.clients.claim())
  );
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((res) => {
    if (res && (res.status === 200 || res.type === 'opaque')) {
      cache.put(req, res.clone());
    }
    return res;
  }).catch(() => cached);
  return cached || networkPromise;
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req).catch(() => null);
  if (res && (res.status === 200 || res.type === 'opaque')) {
    cache.put(req, res.clone());
  }
  return res || Response.error();
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (req.destination === 'image') {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }

  if (['style', 'script', 'font'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }
  // Default: pass-through for HTML/documents/posts
});
