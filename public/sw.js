// BodyTrain Progressive Web App Service Worker with Complete 100% Offline Support
const CACHE_VERSION = "bodytrain-v3.0";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const MEDIA_CACHE = `${CACHE_VERSION}-media`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// 1. Core Application Shell Assets
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/badge-monochrome.png",
];

// 2. Pre-rendered Studio Audio Cues for Offline Voice Coach
const AUDIO_CUES = [
  "/audio/cues/male/prep.mp3",
  "/audio/cues/male/start.mp3",
  "/audio/cues/male/halfway.mp3",
  "/audio/cues/male/rest.mp3",
  "/audio/cues/male/countdown_5.mp3",
  "/audio/cues/male/countdown_4.mp3",
  "/audio/cues/male/countdown_3.mp3",
  "/audio/cues/male/countdown_2.mp3",
  "/audio/cues/male/countdown_1.mp3",
  "/audio/cues/male/complete.mp3",
  "/audio/cues/female/prep.mp3",
  "/audio/cues/female/start.mp3",
  "/audio/cues/female/halfway.mp3",
  "/audio/cues/female/rest.mp3",
  "/audio/cues/female/countdown_5.mp3",
  "/audio/cues/female/countdown_4.mp3",
  "/audio/cues/female/countdown_3.mp3",
  "/audio/cues/female/countdown_2.mp3",
  "/audio/cues/female/countdown_1.mp3",
  "/audio/cues/female/complete.mp3",
];

// 3. All 87 Curated Exercise GIF Animations
const ANIMATION_ASSETS = [
  "/animations/abduction-de-hanche-sur-le-cote.gif",
  "/animations/balancement-de-jambe-avant-arriere.gif",
  "/animations/balancement-de-jambe-lateral.gif",
  "/animations/balancement-lateral-debout.gif",
  "/animations/bascule-du-bassin-allongee.gif",
  "/animations/bascule-du-bassin-debout.gif",
  "/animations/bon-matin-au-poids-du-corps.gif",
  "/animations/bras-jambe-opposes-quadrupedie.gif",
  "/animations/cercles-de-bras.gif",
  "/animations/cercles-de-cheville-assis.gif",
  "/animations/cercles-des-epaules.gif",
  "/animations/chat-vache-assis.gif",
  "/animations/chat-vache.gif",
  "/animations/chenille.gif",
  "/animations/coordination-bras-jambe-croisee.gif",
  "/animations/coordination-croisee-debout.gif",
  "/animations/coquillage-sur-le-cote.gif",
  "/animations/coup-de-pied-arriere-quadrupedie.gif",
  "/animations/crunch-court.gif",
  "/animations/dead-bug.gif",
  "/animations/deroule-vertebral-debout.gif",
  "/animations/enchainement-mobilite-debout.gif",
  "/animations/equilibre-en-tandem.gif",
  "/animations/equilibre-sur-un-pied.gif",
  "/animations/equilibre-touches-pied-etoile.gif",
  "/animations/essorage-du-tronc.gif",
  "/animations/etirement-de-l-epaule.gif",
  "/animations/etirement-des-flechisseurs-debout.gif",
  "/animations/etirement-des-mollets-au-mur.gif",
  "/animations/etirement-des-trapezes-assis.gif",
  "/animations/etirement-du-grand-dorsal-au-mur.gif",
  "/animations/etirement-du-quadriceps-debout.gif",
  "/animations/etirement-vers-le-haut.gif",
  "/animations/extension-dorsale-au-sol.gif",
  "/animations/fente-arriere-alternee.gif",
  "/animations/fente-laterale.gif",
  "/animations/fente-statique.gif",
  "/animations/flexion-extension-de-cheville-assis.gif",
  "/animations/flexion-extension-genou-debout.gif",
  "/animations/gainage-avant-bras.gif",
  "/animations/gainage-genoux-au-sol.gif",
  "/animations/gainage-lateral-genoux-flechis.gif",
  "/animations/gainage-monte-descente.gif",
  "/animations/glissement-bras-contre-mur.gif",
  "/animations/glissement-de-talon-allonge.gif",
  "/animations/inclinaison-laterale-debout.gif",
  "/animations/inclinaison-laterale-du-cou.gif",
  "/animations/ischio-jambiers-allonge.gif",
  "/animations/jumping-jacks-sans-saut.gif",
  "/animations/jumping-jacks.gif",
  "/animations/marche-sur-place.gif",
  "/animations/marche-talon-pointe.gif",
  "/animations/mini-flexions-de-genoux.gif",
  "/animations/mobilite-cervicale-avant-arriere.gif",
  "/animations/mobilite-complete-des-poignets.gif",
  "/animations/mobilite-des-omoplates.gif",
  "/animations/montagnards.gif",
  "/animations/montees-de-genoux-controlees.gif",
  "/animations/montees-sur-pointes.gif",
  "/animations/ouverture-de-hanche-en-appui.gif",
  "/animations/ouverture-dynamique-de-la-poitrine.gif",
  "/animations/pas-lateraux-sur-place.gif",
  "/animations/pompes-classiques.gif",
  "/animations/pompes-contre-un-mur.gif",
  "/animations/pompes-genoux-au-sol.gif",
  "/animations/pompes-scapulaires-genoux-au-sol.gif",
  "/animations/pont-fessier.gif",
  "/animations/position-90-90-assis.gif",
  "/animations/posture-de-l-enfant.gif",
  "/animations/pression-des-paumes.gif",
  "/animations/ramene-de-genoux-allonge.gif",
  "/animations/respiration-4-6.gif",
  "/animations/respiration-diaphragmatique-allongee.gif",
  "/animations/respiration-diaphragmatique-assise.gif",
  "/animations/retractions-scapulaires-au-sol.gif",
  "/animations/reveil-articulaire-debout.gif",
  "/animations/rotation-du-cou.gif",
  "/animations/rotation-thoracique-allongee.gif",
  "/animations/soupir-physiologique.gif",
  "/animations/squat-au-poids-du-corps.gif",
  "/animations/squat-maintenu.gif",
  "/animations/squat-partiel.gif",
  "/animations/squat-saute.gif",
  "/animations/superman-au-sol.gif",
  "/animations/talons-fesses.gif",
  "/animations/tape-epaules-en-gainage.gif",
  "/animations/tapotements-corps-debout.gif",
];

// Helper: Safely add resources to cache individually so one 404 doesn't block the rest
async function safeCacheAddAll(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-cache" });
        if (response && response.ok) {
          await cache.put(url, response);
        }
      } catch (err) {
        console.warn(`[PWA SW] Pre-cache skipped for ${url}:`, err);
      }
    })
  );
}

// 1. Install Event: Precache App Shell, Audio Cues & 87 Animations
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // 1. Core app shell first
      await safeCacheAddAll(STATIC_CACHE, APP_SHELL);
      // 2. Audio cues & 87 animations
      await safeCacheAddAll(MEDIA_CACHE, [...AUDIO_CUES, ...ANIMATION_ASSETS]);
    })()
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old versions & take control of clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, MEDIA_CACHE, DYNAMIC_CACHE].includes(key)) {
            console.log("[PWA SW] Removing legacy cache:", key);
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// 3. Message Event: Instant skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Multi-tiered smart caching
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // A) API Requests: Network-Only or Network-First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // B) Navigation & HTML requests: Network-First with cached SPA fallback
  if (request.mode === "navigate" || url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // Offline navigation: Return cached SPA index.html
          const cachedIndex = await caches.match("/index.html");
          if (cachedIndex) return cachedIndex;

          const cachedRoot = await caches.match("/");
          if (cachedRoot) return cachedRoot;

          const offlineFallback = await caches.match("/offline.html");
          if (offlineFallback) return offlineFallback;

          return new Response("Application hors-ligne", {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  // C) Media & Animations & Audio: Cache-First with Dynamic Cache Fallback
  if (
    url.pathname.startsWith("/animations/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/exercises/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      (async () => {
        const cached =
          (await caches.match(request)) ||
          (await caches.match(url.pathname));

        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(MEDIA_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response(null, { status: 404, statusText: "Media Offline Unavailable" });
        }
      })()
    );
    return;
  }

  // D) Static Bundles (JS/CSS in /assets/) & Other Static Files: Stale-While-Revalidate
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const fetchPromise = (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return null;
        }
      })();

      return cached || (await fetchPromise);
    })()
  );
});

// 5. Web Push Notification Event
self.addEventListener("push", (event) => {
  let data = {
    title: "BodyTrain • Séance matinale",
    body: "C’est l’heure de votre réveil en mouvement de 7 minutes !",
    url: "/",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-monochrome.png",
    data: { url: data.url || "/" },
    tag: "morning-reminder",
    renotify: true,
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 6. Notification Click Event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
