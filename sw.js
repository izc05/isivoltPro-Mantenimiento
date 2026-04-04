const SW_VERSION = 'ivp-v1';
const SHELL_CACHE = `${SW_VERSION}-shell`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const SHELL_ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './icons/ivp-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys
      .filter(k => ![SHELL_CACHE, RUNTIME_CACHE].includes(k))
      .map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./app.html') || caches.match('./index.html')))
    );
    return;
  }

  if (!isSameOrigin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => {
        if (req.destination === 'document') {
          return caches.match('./app.html').then(r => r || caches.match('./index.html'));
        }
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
