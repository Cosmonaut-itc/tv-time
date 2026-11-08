"use client";

import { createContext, type ReactNode, type RefObject, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { debeCerrarHoja, resistirArrastre } from "./hoja-inferior-logica";

export type ArrastreDeHoja = {
  inicio: (clientY: number, timeStamp: number) => void;
  mover: (clientY: number, timeStamp: number) => void;
  fin: (clientY: number, timeStamp: number) => void;
  cancelar: () => void;
  activo: () => boolean;
};
const ContextoArrastre = createContext<ArrastreDeHoja | null>(null);

// Un hijo que decide su propio eje usa este contrato y marca su región con
// data-arrastre-hoja para que el cuerpo no reclame el mismo toque.
export function useArrastreDeHoja() {
  return useContext(ContextoArrastre);
}

// A quién vuelve el foco al cerrar se declara, no se adivina: en iOS Safari un
// botón no queda enfocado al tocarlo, así que `document.activeElement` no sirve
// de rastro y espiar el documento entero para averiguarlo cuesta un listener
// vivo en cada toque de la app. Quien la abre sabe de dónde vino.
export default function HojaInferior({
  abierta,
  etiqueta,
  devolverFocoA,
  enfocarAlAbrir,
  className,
  onCerrar,
  children,
  cabecera,
}: {
  abierta: boolean;
  etiqueta: string;
  devolverFocoA: RefObject<HTMLElement | null>;
  enfocarAlAbrir?: RefObject<HTMLElement | null>;
  className?: string;
  onCerrar: () => void;
  children: ReactNode;
  cabecera?: ReactNode;
}) {
  // El padre puede vaciar sus datos al cerrar; la salida conserva la última
  // composición abierta hasta que la hoja ya no sea visible.
  const [contenido, setContenido] = useState<{ children: ReactNode; cabecera: ReactNode } | null>(
    abierta ? { children, cabecera } : null,
  );
  if (abierta && (!contenido || contenido.children !== children || contenido.cabecera !== cabecera)) {
    setContenido({ children, cabecera });
  }
  const tieneContenido = contenido !== null;
  const hoja = useRef<HTMLElement>(null);
  const estabaAbierta = useRef(false);
  const velo = useRef<HTMLDivElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  const gesto = useRef<{ y0: number; dy: number; muestras: [number, number][] } | null>(null);
  const alto = useRef(1);
  const arrastre = useMemo<ArrastreDeHoja>(() => {
    const pintar = (y: number) => {
      if (hoja.current) hoja.current.style.transform = `translateY(${y}px)`;
      if (velo.current) velo.current.style.opacity = String(Math.max(0, 1 - Math.max(0, y) / alto.current));
    };
    const volver = () => {
      gesto.current = null;
      if (hoja.current) hoja.current.style.transition = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "none" : "transform 480ms cubic-bezier(.2,1.5,.4,1)";
      if (velo.current) velo.current.style.transition = "opacity 300ms ease";
      pintar(0);
    };
    const mover = (y: number, t: number) => {
      if (!gesto.current) return;
      gesto.current.dy = resistirArrastre(y - gesto.current.y0);
      gesto.current.muestras.push([t, y]);
      while (gesto.current.muestras.length > 2 && t - gesto.current.muestras[0][0] > 90) gesto.current.muestras.shift();
      pintar(gesto.current.dy);
    };
    return {
      inicio(y, t) {
        if (!abierta || gesto.current) return;
        alto.current = Math.max(1, (hoja.current?.getBoundingClientRect().height ?? 48) - 48);
        gesto.current = { y0: y, dy: 0, muestras: [[t, y]] };
        if (hoja.current) hoja.current.style.transition = "none";
        if (velo.current) velo.current.style.transition = "none";
      },
      mover,
      fin(y, t) {
        if (!gesto.current) return;
        mover(y, t);
        const [t0, y0] = gesto.current.muestras[0];
        const velocidad = t > t0 ? (y - y0) / (t - t0) : 0;
        if (debeCerrarHoja(gesto.current.dy, alto.current, velocidad)) {
          gesto.current = null;
          onCerrar();
        } else volver();
      },
      cancelar: volver,
      activo: () => gesto.current !== null,
    };
  }, [abierta, onCerrar]);

  useLayoutEffect(() => {
    gesto.current = null;
    const elemento = hoja.current;
    if (!elemento) return;
    elemento.style.removeProperty("transition");
    // Confirma la posición arrastrada antes de quitar el transform inline:
    // el destino del CSS debe partir de ahí, sin pasar por la posición abierta.
    if (!abierta) elemento.getBoundingClientRect();
    elemento.style.removeProperty("transform");
    velo.current?.style.removeProperty("opacity");
    velo.current?.style.removeProperty("transition");
    if (abierta) {
      if (cuerpo.current) cuerpo.current.scrollTop = 0;
      return;
    }
    if (!tieneContenido) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setContenido(null);
      return;
    }
    const estilo = getComputedStyle(elemento);
    const duraciones = estilo.transitionDuration.split(",").map((valor) => parseFloat(valor) * (valor.trim().endsWith("ms") ? 1 : 1000));
    const demoras = estilo.transitionDelay.split(",").map((valor) => parseFloat(valor) * (valor.trim().endsWith("ms") ? 1 : 1000));
    const duracion = Math.max(0, ...estilo.transitionProperty.split(",").map((propiedad, i) =>
      ["transform", "all"].includes(propiedad.trim()) ? duraciones[i % duraciones.length] + demoras[i % demoras.length] : 0,
    ));
    const terminar = (evento: TransitionEvent) => {
      if (evento.target === elemento && evento.propertyName === "transform") setContenido(null);
    };
    elemento.addEventListener("transitionend", terminar);
    // Una transición interrumpida o una pestaña en segundo plano puede no
    // entregar transitionend; el respaldo también libera sus componentes.
    const respaldo = window.setTimeout(() => setContenido(null), duracion + 50);
    return () => {
      elemento.removeEventListener("transitionend", terminar);
      window.clearTimeout(respaldo);
    };
  }, [abierta, tieneContenido]);

  useEffect(() => {
    const elemento = cuerpo.current;
    if (!abierta || !elemento) return;
    let toque: { x: number; y: number; t: number; arriba: boolean; modo: "hoja" | "nativo" | null } | null = null;
    function empezar(e: TouchEvent) {
      if (e.touches.length !== 1 || (e.target as Element).closest("[data-arrastre-hoja]")) {
        if (toque?.modo === "hoja") arrastre.cancelar();
        toque = null;
        return;
      }
      const p = e.touches[0];
      toque = { x: p.clientX, y: p.clientY, t: e.timeStamp, arriba: elemento!.scrollTop <= 0, modo: null };
    }
    function mover(e: TouchEvent) {
      if (!toque || e.touches.length !== 1) return;
      const p = e.touches[0], dx = p.clientX - toque.x, dy = p.clientY - toque.y;
      if (!toque.modo && Math.hypot(dx, dy) > 6) {
        toque.modo = toque.arriba && dy > 0 && Math.abs(dy) > Math.abs(dx) ? "hoja" : "nativo";
        if (toque.modo === "hoja") arrastre.inicio(toque.y, toque.t);
      }
      if (toque.modo === "hoja") {
        e.preventDefault();
        arrastre.mover(p.clientY, e.timeStamp);
      }
    }
    function terminar(e: TouchEvent) {
      if (toque?.modo === "hoja") arrastre.fin(e.changedTouches[0].clientY, e.timeStamp);
      toque = null;
    }
    function cancelar() {
      if (toque?.modo === "hoja") arrastre.cancelar();
      toque = null;
    }
    elemento.addEventListener("touchstart", empezar, { passive: true });
    elemento.addEventListener("touchmove", mover, { passive: false });
    elemento.addEventListener("touchend", terminar);
    elemento.addEventListener("touchcancel", cancelar);
    return () => {
      elemento.removeEventListener("touchstart", empezar);
      elemento.removeEventListener("touchmove", mover);
      elemento.removeEventListener("touchend", terminar);
      elemento.removeEventListener("touchcancel", cancelar);
    };
  }, [abierta, arrastre]);

  useEffect(() => {
    if (abierta && !estabaAbierta.current) {
      (enfocarAlAbrir?.current ?? hoja.current)?.focus();
    }
    else if (!abierta && estabaAbierta.current) devolverFocoA.current?.focus();
    estabaAbierta.current = abierta;
  }, [abierta, devolverFocoA, enfocarAlAbrir]);

  useEffect(() => {
    if (!abierta) return;
    function controlarTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        onCerrar();
        return;
      }
      if (evento.key !== "Tab" || !hoja.current) return;

      const enfocables = Array.from(
        hoja.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((elemento) => !elemento.closest("[hidden]"));
      if (enfocables.length === 0) {
        evento.preventDefault();
        hoja.current.focus();
        return;
      }

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const foco = document.activeElement;
      const focoEnFrontera =
        foco === hoja.current || !hoja.current.contains(foco);
      if (
        (evento.shiftKey && (foco === primero || focoEnFrontera)) ||
        (!evento.shiftKey && (foco === ultimo || focoEnFrontera))
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
        ref={velo}
        className={`velo${abierta ? " on" : ""}`}
        aria-hidden="true"
        onClick={onCerrar}
      />
      <section
        ref={hoja}
        className={`hoja${className ? ` ${className}` : ""}${abierta ? " abierta" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={etiqueta}
        aria-hidden={!abierta}
        inert={!abierta}
        tabIndex={-1}
      >
        <ContextoArrastre.Provider value={arrastre}>
          <div className="cabecera-hoja"
            onPointerDown={(e) => {
              if (!e.isPrimary || e.button !== 0 || (e.target as Element).closest("button, input, a, select, textarea")) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              arrastre.inicio(e.clientY, e.timeStamp);
            }}
            onPointerMove={(e) => arrastre.mover(e.clientY, e.timeStamp)}
            onPointerUp={(e) => arrastre.fin(e.clientY, e.timeStamp)}
            onPointerCancel={() => arrastre.cancelar()}
            onLostPointerCapture={() => { if (arrastre.activo()) arrastre.cancelar(); }}
          >
            <div className="asa" aria-hidden="true" />
            {abierta ? cabecera : contenido?.cabecera}
            <button className="btn-cerrar" type="button" aria-label={`Cerrar: ${etiqueta}`} onClick={onCerrar}>✕</button>
          </div>
          <div className="cuerpo-hoja" ref={cuerpo}>{abierta ? children : contenido?.children}</div>
        </ContextoArrastre.Provider>
      </section>
    </>
  );
}
