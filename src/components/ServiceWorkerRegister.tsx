"use client";

import { useEffect } from "react";

// Registers the service worker (production only — a dev SW just causes stale
// caches and confusion). Renders nothing. Note: browsers only allow SW
// registration over HTTPS or on localhost, so this is a no-op when testing
// over a plain-http LAN IP; it kicks in on the deployed site.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal; the app works without the SW.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
