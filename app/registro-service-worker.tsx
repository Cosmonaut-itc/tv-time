"use client";

import { useEffect } from "react";

export default function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(
      (error) => {
        console.error("No se pudo registrar el service worker.", error);
      },
    );
  }, []);

  return null;
}
