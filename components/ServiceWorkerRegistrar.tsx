"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[sw] registration failed:", err);
        }
      });
  }, []);

  return null;
}
