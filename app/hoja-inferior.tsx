"use client";

import { type ReactNode, type RefObject, useEffect, useRef } from "react";

// El muro de pósters (017) la sube para tocar un título; el cajón del alta
// (018) baja su gemela para meterlos. Esta pieza no implementa esos usos aún.
//
// A quién vuelve el foco al cerrar se declara, no se adivina: en iOS Safari un
// botón no queda enfocado al tocarlo, así que `document.activeElement` no sirve
// de rastro y espiar el documento entero para averiguarlo cuesta un listener
// vivo en cada toque de la app. Quien la abre sabe de dónde vino.
export default function HojaInferior({
  abierta,
  etiqueta,
  devolverFocoA,
  onCerrar,
  children,
}: {
  abierta: boolean;
  etiqueta: string;
  devolverFocoA: RefObject<HTMLElement | null>;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const hoja = useRef<HTMLElement>(null);
  const estabaAbierta = useRef(false);

  useEffect(() => {
    if (abierta && !estabaAbierta.current) hoja.current?.focus();
    else if (!abierta && estabaAbierta.current) devolverFocoA.current?.focus();
    estabaAbierta.current = abierta;
  }, [abierta, devolverFocoA]);

  useEffect(() => {
    if (!abierta) return;
    function controlarTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onCerrar();
        return;
      }
      if (evento.key !== "Tab" || !hoja.current) return;

      const enfocables = Array.from(
        hoja.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (enfocables.length === 0) {
        evento.preventDefault();
        hoja.current.focus();
        return;
      }

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const foco = document.activeElement;
      if (
        (evento.shiftKey && (foco === primero || !hoja.current.contains(foco))) ||
        (!evento.shiftKey && (foco === ultimo || !hoja.current.contains(foco)))
      ) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primero).focus();
      }
    }
    document.addEventListener("keydown", controlarTeclado);
    return () => document.removeEventListener("keydown", controlarTeclado);
  }, [abierta, onCerrar]);

  return (
    <>
      <div
        className={`velo${abierta ? " on" : ""}`}
        aria-hidden="true"
        onClick={onCerrar}
      />
      <section
        ref={hoja}
        className={`hoja${abierta ? " abierta" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={etiqueta}
        aria-hidden={!abierta}
        inert={!abierta}
        tabIndex={-1}
      >
        <div className="asa" aria-hidden="true" />
        {children}
      </section>
    </>
  );
}
