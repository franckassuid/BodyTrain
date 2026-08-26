import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker Registration & Seamless Auto-Update Lifecycle
if ("serviceWorker" in navigator) {
  let refreshing = false;

  // When the service worker updates and takes control, auto-reload once to serve the latest version
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 1. If a new service worker is waiting, activate it immediately
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      // 2. Listen for new updates arriving in background
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New update available -> trigger immediate activation
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });

      // 3. Re-check for new updates whenever user returns to the app / opens the PWA
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          checkForUpdate();
        }
      });

      window.addEventListener("focus", checkForUpdate);

      // Periodically check for updates every 10 minutes
      setInterval(checkForUpdate, 10 * 60 * 1000);
    } catch (err) {
      console.warn("[PWA] ServiceWorker registration error: ", err);
    }
  });
}
