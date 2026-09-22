/**
 * Bare-minimum PWA: register the service worker in production builds only.
 * Vite HMR must not compete with a worker on localhost.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").then(() => {
      // The shell listens for this so it can subscribe after the worker exists.
      window.dispatchEvent(new Event("cw-service-worker"));
    }).catch(() => {
      // Installability still works from the manifest; a failed worker is not fatal.
    });
  });
}
