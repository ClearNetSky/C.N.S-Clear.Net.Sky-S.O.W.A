// ============================================================
// sw.js — service worker for Clear Net Sky / S.O.W.A
// Network-first with cache fallback: pages always load fresh
// when online, and the last seen version keeps working offline.
// ============================================================

const CACHE = 'cns-v0.3.0';

// Resolved against the worker's scope, so this works both on
// GitHub Pages project paths and on a local server.
const CORE = [
    'index.html',
    '404.html',
    'css/main.css',
    'css/themes.css',
    'css/animations.css',
    'css/particles.css',
    'css/flags.css',
    'js/main.js',
    'js/language.js',
    'js/sounds.js',
    'js/particles.js',
    'js/animations.js',
    'js/news-system.js',
    'images/favicon.svg',
    'images/flags/us.svg',
    'images/flags/ru.svg',
    'data/threats.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(CORE.map(p => new URL(p, self.registration.scope).href)))
            .catch(() => { /* partial precache is fine */ })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // let CDNs pass through

    event.respondWith(
        fetch(req)
            .then(res => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(cache => cache.put(req, copy));
                }
                return res;
            })
            .catch(() =>
                caches.match(req).then(hit =>
                    hit || (req.mode === 'navigate'
                        ? caches.match(new URL('index.html', self.registration.scope).href)
                        : Response.error())
                )
            )
    );
});
