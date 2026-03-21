const CACHE_NAME = "civic-alert-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker Active");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
