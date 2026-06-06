// GymTwin AI — Service Worker
// Bump CACHE_VERSION on each deploy to invalidate stale precaches.
const CACHE_VERSION = "v5";
const PRECACHE = `gt-static-${CACHE_VERSION}`;
const RUNTIME_MODELS = `gt-models-${CACHE_VERSION}`;
const RUNTIME_NEXT = `gt-next-${CACHE_VERSION}`;

// Files we always want available offline from the first install.
// Keep this list lean — only things the core UI needs to load.
const PRECACHE_URLS = [
  "/",
  "/cast",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/mediapipe/vision_wasm_internal.js",
  "/mediapipe/vision_wasm_internal.wasm",
  "/mediapipe/vision_wasm_nosimd_internal.js",
  "/mediapipe/vision_wasm_nosimd_internal.wasm",
  "/models/pose_landmarker_lite.task",
];

// ─── Install: seed the precache ───────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) =>
      // Individual try/catch so one bad asset doesn't abort the whole install
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[sw] precache miss: ${url}`, err);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// ─── Activate: purge old caches ───────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  const current = new Set([PRECACHE, RUNTIME_MODELS, RUNTIME_NEXT]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("gt-") && !current.has(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch routing ────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs — let Supabase/API POSTs pass through
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // MediaPipe WASM / task files — cache-first (immutable after first fetch)
  if (path.startsWith("/mediapipe/") || path.startsWith("/models/")) {
    event.respondWith(cacheFirst(request, PRECACHE));
    return;
  }

  // Next.js static chunks — stale-while-revalidate
  if (path.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_NEXT));
    return;
  }

  // 3D models and avatar images — cache-first on demand (large, rarely change)
  if (path.match(/\.(glb|gltf|png|jpg|jpeg|webp|svg)$/i)) {
    event.respondWith(cacheFirst(request, RUNTIME_MODELS));
    return;
  }

  // App shell pages — network-first with offline fallback to cached version
  if (path === "/" || path === "/cast" || path.endsWith(".html")) {
    event.respondWith(networkFirst(request, PRECACHE));
    return;
  }

  // Everything else (API routes, etc.) — network only
});

// ─── Strategy helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    // Only cache successful responses — 401 (auth) / 404 / 5xx must not be stored.
    if (response.ok) cache.put(request, response.clone());
    // If auth-blocked and we have a cached copy, serve it (handles Vercel protection).
    if (response.status === 401 || response.status === 403) {
      const fallback = await cache.match(request);
      if (fallback) return fallback;
    }
    return response;
  } catch {
    return new Response("Offline — resource not cached", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached ?? (await networkPromise) ?? new Response("Offline", { status: 503 });
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(cacheName);
    return (await cache.match(request)) ?? new Response("Offline", { status: 503 });
  }
}
