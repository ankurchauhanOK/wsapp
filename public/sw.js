const CACHE_NAME = "kiranax-admin-v1";
const STATIC_ASSETS = [
  "/",
  "/store",
  "/store/categories",
  "/store/cart",
  "/admin/dashboard",
  "/admin/inventory",
  "/admin/products",
  "/admin/orders",
  "/admin/scanner/billing",
  "/admin/scanner/inventory",
  "/admin/alerts",
  "/admin/settings",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
];

// Install: cache core admin shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for static, network-first for API
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (except Supabase images which we cache lightly)
  if (url.origin !== self.location.origin && !url.hostname.includes("supabase.co")) {
    return;
  }

  // API routes: network first, then queue for later if offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API GETs lightly
          if (request.method === "GET" && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ error: "Offline", offline: true }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          });
        })
    );
    return;
  }

  // Static assets / pages: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      // Return cached immediately if available, else wait for network
      return cached || networkFetch;
    })
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "New notification",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192-maskable.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || "/admin/dashboard",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title || "Kiranax Admin", options));
  }
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const url = event.notification.data?.url || "/admin/dashboard";
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
