// Service worker: gør appen hurtig og brugbar offline.
// - App-skallen (index.html) serveres straks fra cache og opdateres i baggrunden.
//   Det er vigtigt på Renders gratis plan, hvor serveren kan bruge op til et
//   minut på at vågne – appen åbner alligevel med det samme.
// - /assets/* (filer med hash i navnet) caches permanent.
// - /api/* går altid direkte til netværket.

const CACHE = 'lavhistamin-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  // Navigation: cache først, opdater i baggrunden
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match('/index.html');
        const network = fetch(e.request)
          .then((res) => {
            if (res.ok) cache.put('/index.html', res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Øvrige filer: cache først, ellers net (og gem)
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          if (res.ok && (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }),
    ),
  );
});
