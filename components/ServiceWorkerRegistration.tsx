"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("Service worker registration failed", error);
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
