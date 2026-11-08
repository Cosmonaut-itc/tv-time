import * as THREE from "three";
import type { TituloDeSala } from "../cartelera.ts";
import { crearGanador } from "./ganador.ts";
import { ALTO_MARCO_GANADOR, GANADOR_ANCHO, GANADOR_ALTO } from "./medidas.ts";

/** La ficha posee sus recursos; nunca cambia el lienzo ni la pose de la sala. */
export function crearVistaDeFicha(renderizador: THREE.WebGLRenderer, host: HTMLElement, titulo: TituloDeSala, alLista: (lista: boolean) => void) {
  const escena = new THREE.Scene();
  const grupo = new THREE.Group();
  escena.add(grupo);
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  let destruida = false, cuadro = 0, ultimo = 0, hasta = 0;
  let ganador: ReturnType<typeof crearGanador> | undefined;
  let observador: ResizeObserver | undefined;
  const escuchas = new AbortController();
  const lienzo = renderizador.domElement;

  function pintar(ahora: number) {
    cuadro = 0;
    if (destruida || document.hidden || !ganador) return;
    const t = ahora / 1000;
    ganador.update(t, Math.min(0.05, Math.max(0, t - ultimo)));
    ultimo = t;
    renderizador.render(escena, camara);
    alLista(ganador.laminaLista());
    if (t < hasta) cuadro = requestAnimationFrame(pintar);
  }
  function despertar() {
    if (destruida) return;
    hasta = performance.now() / 1000 + 1;
    if (!cuadro && !document.hidden) cuadro = requestAnimationFrame(pintar);
  }
  function medir() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderizador.setSize(width, height, false);
    camara.aspect = width / height;
    // La lámina ocupa los mismos 158 px del respaldo CSS; el margen lateral
    // admite la profundidad de la moldura cuando llega al tope del gesto.
    const alto = Math.max(ALTO_MARCO_GANADOR, GANADOR_ALTO * height / 237, (GANADOR_ANCHO + 0.3) / camara.aspect);
    camara.position.set(0, 0, alto / (2 * Math.tan(Math.PI / 12)));
    camara.updateProjectionMatrix();
    despertar();
  }
  function destruir() {
    if (destruida) return;
    destruida = true;
    escuchas.abort();
    observador?.disconnect();
    if (cuadro) cancelAnimationFrame(cuadro);
    ganador?.destruir();
    escena.clear();
    renderizador.dispose();
    renderizador.forceContextLoss();
    lienzo.remove();
  }
  try {
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderizador.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderizador.setClearColor(0, 0);
    ganador = crearGanador(grupo, renderizador, despertar);
    ganador.mostrarEnFicha(titulo);
    lienzo.className = "lienzo-ficha";
    lienzo.setAttribute("aria-hidden", "true");
    host.append(lienzo);
    observador = new ResizeObserver(medir);
    observador.observe(host);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(cuadro); cuadro = 0; }
      else despertar();
    }, { signal: escuchas.signal });
    lienzo.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      alLista(false);
      destruir();
    }, { signal: escuchas.signal });
    medir();
    return {
      topes: ganador.topes,
      orientacion: () => ganador!.orientacion(),
      inclinar(x: number, y: number) { if (!destruida) { ganador!.inclinar(x, y); despertar(); } },
      soltar() {
        if (destruida) return;
        // Una mano quieta puede haber dejado dormir el renderizador. El
        // muelle debe contar desde que se suelta, no desde el último cuadro.
        ganador!.update(performance.now() / 1000, 0);
        ganador!.soltar();
        despertar();
      },
      poner(titulo: TituloDeSala) {
        if (destruida) return;
        alLista(false);
        ganador!.mostrarEnFicha(titulo);
        despertar();
      },
      destruir,
    };
  } catch (error) {
    destruir();
    throw error;
  }
}

export function arrancarFicha3D(host: HTMLElement, titulo: TituloDeSala, alLista: (lista: boolean) => void) {
  THREE.ColorManagement.enabled = false;
  const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  return crearVistaDeFicha(renderizador, host, titulo, alLista);
}
