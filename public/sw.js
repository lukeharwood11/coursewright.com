/* Course Wright PWA — network-first navigations, cache static icons, Activity push. */
const CACHE = "cw-pwa-v2";
const PRECACHE = [
  "/site.webmanifest",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-192x192.png",
  "/favicon-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && PRECACHE.includes(url.pathname)) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Promise.reject())),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === "string" && payload.title ? payload.title : "Course Wright";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "",
    icon: "/favicon-192x192.png",
    badge: "/favicon-192x192.png",
    tag: typeof payload.tag === "string" ? payload.tag : undefined,
    data: { url: typeof payload.url === "string" ? payload.url : "/my" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    event.notification.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/my";
  const url = new URL(target, self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil(openActivity(url.href));
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: "cw-activity-push-resubscribe" });
      }
    }),
  );
});

async function openActivity(href) {
  const windowClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of windowClients) {
    let origin = "";
    try {
      origin = new URL(client.url).origin;
    } catch {
      continue;
    }
    if (origin !== self.location.origin) continue;
    if (typeof client.navigate === "function") {
      try {
        const next = await client.navigate(href);
        if (next && typeof next.focus === "function") return next.focus();
      } catch {
        // Fall through to a fresh window.
      }
    } else {
      client.postMessage({ type: "cw-activity-push", url: href });
      if (typeof client.focus === "function") return client.focus();
    }
  }
  return self.clients.openWindow(href);
}
