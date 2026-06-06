// HotelConnect service worker — deliberately conservative.
//
// Goal: let the app *shell* load when offline and satisfy install criteria.
// It must NEVER interfere with Supabase (REST + realtime websocket live on a
// different origin, so they're skipped) and must never serve stale app code
// (navigations are network-first; only content-hashed /_next/static assets are
// cached, and those are safe because their filenames change every build).

const CACHE = "hotelconnect-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add("/"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only handle our own origin — leave Supabase (and any other host) alone.
  if (url.origin !== self.location.origin) return;

  // Navigations: always try the network first so users get the latest app;
  // fall back to the cached shell only when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/", { ignoreSearch: true }).then((r) => r || Response.error()),
      ),
    );
    return;
  }

  // Hashed build assets: cache-first (safe — filenames are unique per build).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
  }

  // Everything else falls through to the default (network).
});
