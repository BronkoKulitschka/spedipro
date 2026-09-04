/**
 * Anmeldung des Service Workers.
 *
 * Der Worker übernimmt nie ungefragt. Steht eine neue Fassung bereit,
 * meldet sich die App und der Spieler entscheidet — sonst könnte mitten
 * in einer Tourenplanung die Seite neu laden.
 */
import { useEffect, useState } from "preact/hooks";
import { Button } from "./win95";

/** Wird von Vite aus der package.json gesetzt. */
declare const __APP_VERSION__: string;

export const APP_VERSION =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";

export function useServiceWorker() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost")
      return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    const url = `${import.meta.env.BASE_URL}sw.js?v=${APP_VERSION}`;

    navigator.serviceWorker
      .register(url, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        if (reg.waiting) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            // "installed" mit vorhandenem Controller heißt: Update wartet.
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(next);
            }
          });
        });
      })
      .catch(() => {
        // Ohne Service Worker läuft die App normal weiter, nur ohne Offline.
      });

    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
  }, []);

  return {
    updateAvailable: waiting !== null,
    applyUpdate: () => waiting?.postMessage("uebernehmen"),
    dismiss: () => setWaiting(null),
  };
}

export function UpdateBar({
  onApply,
  onDismiss,
}: {
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div class="update-bar raised">
      <span class="spread">Eine neue Fassung von SpediPro 95 ist bereit.</span>
      <Button onClick={onApply}>Jetzt laden</Button>
      <Button onClick={onDismiss}>Später</Button>
    </div>
  );
}
