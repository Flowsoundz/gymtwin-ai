"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Check for a waiting SW (new version installed but not yet active).
        // Claim it immediately so stale JS/models don't linger across tabs.
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Reload once the new SW takes control so the page runs fresh JS.
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });

        // Poll for updates every 60s — catches deploys without needing a full page close.
        const interval = setInterval(() => reg.update(), 60_000);
        return () => clearInterval(interval);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[sw] registration failed:", err);
        }
      });
  }, []);

  return null;
}
