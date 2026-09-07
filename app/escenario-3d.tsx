"use client";

import { useEffect, useEffectEvent, useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import type { TituloDeSala } from "./cartelera";
import type { FaseDelGiro } from "./giro";
import type { ModoDeFocos, Sala3D } from "./tres/tipos";
import { sincronizarSello, debeMontarTambores, faseDeLaSala3D, puedeArrancar, tamboresQuietos } from "./escenario-3d-logica";

export type MandoDeLaSala3D = {
  girarTambores(base: number, paroJuntos: boolean, corto: boolean): void;
  pedirGiroscopio(): void;
  focos(paso: number, modo: ModoDeFocos): void;
};

type Propiedades = {
  ref?: Ref<MandoDeLaSala3D | null>;
  escenario: RefObject<HTMLElement | null>;
  fase: FaseDelGiro;
  ocupado: boolean;
  finalistas: readonly TituloDeSala[];
  tirasDelGiro: readonly TituloDeSala[][];
  candidatos: readonly TituloDeSala[];
  elegido: number | null;
  ganador: TituloDeSala | null;
  numeroConteo: number;
  selloVisible: boolean;
  onCambio: (activa: boolean) => void;
};

function hayWebGL(): boolean {
  try {
    const prueba = document.createElement("canvas");
    const gl = prueba.getContext("webgl2") || prueba.getContext("webgl");
    const disponible = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return disponible;
  } catch {
    return false;
  }
}

export default function Escenario3D({
  ref, escenario, fase, ocupado, finalistas, tirasDelGiro, candidatos,
  elegido, ganador, numeroConteo, selloVisible, onCambio,
}: Propiedades) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const sala = useRef<Sala3D | null>(null);
  const intentarArranque = useRef<(() => void) | null>(null);
  const montados = useRef<readonly TituloDeSala[] | null>(null);
  const anterior = useRef<{
    fase: FaseDelGiro;
    elegido: number | null;
    ganador: TituloDeSala | null;
    numeroConteo: number;
    selloVisible: boolean;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    girarTambores: (base, paroJuntos, corto) => sala.current?.girarTambores(base, paroJuntos, corto),
    pedirGiroscopio: () => {
      void sala.current?.pedirGiroscopio().catch((error: unknown) => {
        console.warn("El cine · no se pudo activar el giroscopio:", error);
      });
    },
    focos: (paso, modo) => sala.current?.focos(paso, modo),
  }), []);

  // Los eventos de efecto leen el último commit, también si el import tarda
  // un giro entero. No reiniciamos el contexto al cambiar props o callbacks.
  const avisar = useEffectEvent((activa: boolean) => onCambio(activa));
  const arranqueSeguro = useEffectEvent(() => puedeArrancar(fase, ocupado));
  const sincronizar = useEffectEvent(() => {
    const activa = sala.current;
    if (!activa) return;
    const previo = anterior.current;
    const cambioFase = previo?.fase !== fase;
    if (cambioFase) {
      activa.setFase(faseDeLaSala3D(fase));
      activa.telon(fase !== "reposo");
      if (fase === "reposo" || fase === "vuelta vacía" || fase === "función") {
        activa.reposo();
        montados.current = null;
      }
    }
    if (fase === "conteo") {
      if (cambioFase || previo?.numeroConteo !== numeroConteo) activa.conteo(numeroConteo);
    } else if (!previo || previo.fase === "conteo") {
      activa.conteo(null);
    }
    const montar = debeMontarTambores(fase, finalistas, montados.current);
    if (montar) {
      activa.montarTambores(finalistas, candidatos, tamboresQuietos(tirasDelGiro));
      montados.current = finalistas;
    }
    if ((fase === "girando" || fase === "finalistas") &&
        (montar || cambioFase || previo?.elegido !== elegido)) {
      activa.elegido(elegido);
    }
    if (fase === "ganador" && ganador && (cambioFase || previo?.ganador !== ganador)) {
      activa.ganador(ganador);
    }
    sincronizarSello(activa, selloVisible, previo?.selloVisible);
    anterior.current = { fase, elegido, ganador, numeroConteo, selloVisible };
  });

  useEffect(() => {
    const canvas = lienzo.current;
    const banda = escenario.current;
    const tablero = banda?.closest<HTMLElement>(".sala");
    if (!canvas || !banda || !tablero) return;
    const movimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (movimiento.matches || !hayWebGL()) return;

    // Cada montaje posee su import y su instancia. La limpieza de StrictMode
    // invalida el import anterior antes de que pueda tocar el siguiente.
    let cancelado = false;
    let arrancar: typeof import("./tres/sala").arrancarSala3D | null = null;
    let instancia: Sala3D | null = null;

    function apagar() {
      if (cancelado && !instancia) return;
      cancelado = true;
      arrancar = null;
      sala.current = null;
      montados.current = null;
      anterior.current = null;
      tablero!.classList.remove("tresd");
      banda!.classList.remove("tresd");
      const previa = instancia;
      instancia = null;
      try {
        // destruir() fuerza la pérdida del contexto del canvas que React reutiliza: Fast Refresh reconstruye sobre el contexto perdido.
        // En desarrollo el catch lo captura y la sala cae a CSS hasta recargar; en producción no ocurre.
        previa?.destruir();
      } catch (error) {
        console.warn("El cine · no se pudo liberar toda la sala 3D:", error);
      } finally {
        avisar(false);
      }
    }

    function intentar() {
      if (cancelado || instancia || !arrancar || !arranqueSeguro()) return;
      if (movimiento.matches) {
        apagar();
        return;
      }
      try {
        instancia = arrancar({
          lienzo: canvas!, tablero: tablero!, escenario: banda!,
          focos: () => [...tablero!.querySelectorAll<HTMLElement>(".foco")],
          alPerderContexto: apagar,
        });
        // También cubre una pérdida de contexto durante el constructor.
        if (cancelado) {
          apagar();
          return;
        }
        instancia.encender(true);
        if (cancelado) return;
        sala.current = instancia;
        sincronizar();
        if (cancelado) return;
        tablero!.classList.add("tresd");
        banda!.classList.add("tresd");
        avisar(true);
      } catch (error) {
        console.warn("El cine · no arrancó la sala 3D:", error);
        apagar();
      }
    }

    function alCambiarMovimiento(evento: MediaQueryListEvent) {
      if (evento.matches) apagar();
    }
    intentarArranque.current = intentar;
    movimiento.addEventListener("change", alCambiarMovimiento);
    void (async () => {
      try {
        const { arrancarSala3D } = await import("./tres/sala");
        if (cancelado) return;
        arrancar = arrancarSala3D;
        intentar();
      } catch (error) {
        if (cancelado) return;
        console.warn("El cine · no cargó la sala 3D:", error);
        apagar();
      }
    })();
    return () => {
      movimiento.removeEventListener("change", alCambiarMovimiento);
      intentarArranque.current = null;
      apagar();
    };
  }, [escenario]);

  useEffect(() => {
    intentarArranque.current?.();
    sincronizar();
  }, [fase, ocupado, finalistas, tirasDelGiro, candidatos, elegido, ganador, numeroConteo, selloVisible]);

  // onCambio(true) hace que el padre monte la capa en su siguiente commit.
  // Sin dependencias: también mide ese render aunque las props no cambien.
  useEffect(() => {
    if (sala.current && fase === "ganador") sala.current.medir();
  });

  return <canvas ref={lienzo} className="lienzo-3d" aria-hidden="true" />;
}
