const VERSION = "pi-web-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Deliberately do not intercept fetches. Sessions, project files, API responses,
// HTML, and credentials must always come from the network and never be retained
// in a service-worker cache.
self.addEventListener("message", (event) => {
  if (event.data === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: VERSION });
  }
});
