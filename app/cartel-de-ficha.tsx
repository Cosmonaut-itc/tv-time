"use client";

import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import type { TituloDeSala } from "./cartelera";
import { useArrastreDeHoja } from "./hoja-inferior";
import { escucharGestoDeFicha } from "./gesto-ficha";

export default function CartelDeFicha({ titulo, children }: { titulo: TituloDeSala; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const vista = useRef<ReturnType<typeof import("./tres/ficha").arrancarFicha3D> | null>(null);
  const hoja = useArrastreDeHoja();
  const tituloActual = useEffectEvent(() => titulo);

  useEffect(() => {
    const elemento = host.current;
    if (!elemento) return;
    return escucharGestoDeFicha(elemento, hoja, () => vista.current);
  }, [hoja]);

  useEffect(() => {
    const elemento = host.current;
    if (!elemento) return;
    const movimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelado = false;
    const revelar = (lista: boolean) => elemento.classList.toggle("con-3d", lista);
    const apagar = () => {
      cancelado = true;
      revelar(false);
      vista.current?.destruir();
      vista.current = null;
    };
    const cambiar = () => { if (movimiento.matches) apagar(); };
    movimiento.addEventListener("change", cambiar);
    if (!movimiento.matches) {
      void import("./tres/ficha").then(({ arrancarFicha3D }) => {
        if (cancelado) return;
        try { vista.current = arrancarFicha3D(elemento, tituloActual(), revelar); }
        catch { apagar(); } // El respaldo ya está dibujado, sin un estado de error extra.
      }).catch(apagar);
    }
    return () => { movimiento.removeEventListener("change", cambiar); apagar(); };
  }, []);

  useEffect(() => { vista.current?.poner(titulo); }, [titulo]);

  return <div ref={host} className="ficha-3d" data-arrastre-hoja="">{children}</div>;
}
