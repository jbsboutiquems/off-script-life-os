/* Off*Script service worker — app-shell precache + offline fallback.
 *
 * What it does:
 *  - Precaches the app shell (index, manifest, icons) so the app opens offline.
 *  - Runtime-caches same-origin static assets (stale-while-revalidate).
 *  - Network-first with cache fallback for same-origin GET /api/* reads, so
 *    last-known data is available when the network drops.
 *  - Navigation fallback to the cached index so deep links / reloads work offline.
 *
 * What it deliberately does NOT do:
 *  - It never caches POST/PUT/PATCH/DELETE. Writes go through the api layer's
 *    mutation outbox (src/services/api.ts), which replays them on reconnect.
 *  - It never caches /api/app-version (UpdateBanner must always read the
 *    live latest version, never a stale cached one).
 *  - It never runs on native (Capacitor) builds — main.tsx skips registration
 *    there, because APK assets are already local.
 *
 * Scope note: the worker is scope-relative (self.registration.scope), so it
 * works whether the app is served from '/' (server-served) or '/off-script-life-os/'
 * (GitHub Pages). Cross-origin API calls (Pages -> Railway) are NOT intercepted
 * — the browser only lets a worker handle its own origin — so the localStorage
 * fallbacks in the api layer remain the offline path for those builds.
 *
 * Shared-device note: cached GET /api/* responses live in this origin's Cache
 * Storage, same trust boundary as the app's localStorage. This app is
 * single-user-per-device by design; do not ship it on a shared kiosk without
 * rethinking both stores.
 */

const CACHE_VERSION = 'offscript-v1';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;

const APP_VERSION_PATH = '/api/app-version';

function scopeUrl(path) {
  const scope = self.registration.scope;
  return new URL(path, scope).toString();
}

const SHELL_URLS = [
  scopeUrl(''),
  scopeUrl('index.html'),
  scopeUrl('manifest.webmanifest'),
  scopeUrl('favicon.ico'),
  scopeUrl('pwa-192x192.png'),
  scopeUrl('pwa-512x512.png'),
  scopeUrl('pwa-maskable-512x512.png'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => {
        // Precache is best-effort: a missing icon must not block install.
        return self.skipWaiting();
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('shell-') || k.startsWith('api-') || k.startsWith('static-'))
            .filter((k) => k !== SHELL_CACHE && k !== API_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  return url.pathname.includes('/api/');
}

function isAppVersionRequest(url) {
  return url.pathname === APP_VERSION_PATH || url.pathname.endsWith(APP_VERSION_PATH);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never cache writes

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // same-origin only

  // /api/app-version: network-only, always live.
  if (isApiRequest(url) && isAppVersionRequest(url)) return;

  // Navigations: network-first, fall back to the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(scopeUrl('index.html'), copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(scopeUrl('index.html'), { ignoreSearch: true })
            .then((res) => res || caches.match(scopeUrl(''), { ignoreSearch: true })),
        ),
    );
    return;
  }

  // API reads: network-first with cache fallback (last-known data offline).
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Same-origin static assets (JS/CSS/images/fonts): stale-while-revalidate.
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
