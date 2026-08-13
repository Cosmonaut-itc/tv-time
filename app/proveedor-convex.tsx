"use client";

import {
  ConvexProvider,
  ConvexReactClient,
  useConvexConnectionState,
} from "convex/react";
import { useEffect, useRef, type ReactNode } from "react";
import {
  decidirLlegadaSala,
  decidirRecargaSala,
} from "./telon-de-entrada-logica";

const urlConvex = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = urlConvex ? new ConvexReactClient(urlConvex) : null;

function marcarLlegadaSala() {
  document.documentElement.dataset.salaLlego = "true";
}

function ControladorTelon() {
  const { hasEverConnected, isWebSocketConnected } =
    useConvexConnectionState();
  const salaYaLlego = useRef(false);
  const recargaYaSolicitada = useRef(false);

  useEffect(() => {
    const salaLlego = decidirLlegadaSala(salaYaLlego.current, {
      hasEverConnected,
      isWebSocketConnected,
    });
    if (!salaLlego) return;

    salaYaLlego.current = true;
    marcarLlegadaSala();
  }, [hasEverConnected, isWebSocketConnected]);

  useEffect(() => {
    const recargarAlVolverLaRed = () => {
      const debeRecargar = decidirRecargaSala({
        navegadorEnLinea: navigator.onLine,
        recargaYaSolicitada: recargaYaSolicitada.current,
        salaYaLlego: salaYaLlego.current,
      });
      if (!debeRecargar) return;

      recargaYaSolicitada.current = true;
      window.location.reload();
    };

    window.addEventListener("online", recargarAlVolverLaRed);
    return () => window.removeEventListener("online", recargarAlVolverLaRed);
  }, []);

  return null;
}

export default function ProveedorConvex({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!convex) marcarLlegadaSala();
  }, []);

  if (!convex) {
    return (
      <main className="sala">
        <section className="entrada" aria-live="polite">
          <p className="estado-entrada">La taquilla no está disponible en este momento.</p>
        </section>
      </main>
    );
  }
  return (
    <ConvexProvider client={convex}>
      <ControladorTelon />
      {children}
    </ConvexProvider>
  );
}
