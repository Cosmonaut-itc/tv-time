import type { ArrastreDeHoja } from "./hoja-inferior.tsx";
import { saturar } from "./tres/logica.ts";

export type CartelDeFicha = {
  topes: { y: number };
  orientacion(): { y: number };
  inclinar(x: number, y: number): void;
  soltar(): void;
};

/** Un solo dueño por gesto; el eje queda fijado al superar el umbral. */
export function escucharGestoDeFicha(host: HTMLElement, hoja: ArrastreDeHoja | null, cartel: () => CartelDeFicha | null) {
  const escuchas = new AbortController();
  let gesto: { id: number; x: number; y: number; t: number; base: number; eje: "cartel" | "hoja" | null } | null = null;
  const terminar = (cancelar: boolean, e?: PointerEvent) => {
    if (!gesto || (e && e.pointerId !== gesto.id)) return;
    const previo = gesto;
    gesto = null;
    if (previo.eje === "hoja") {
      if (cancelar) hoja?.cancelar();
      else hoja?.fin(e!.clientY, e!.timeStamp);
    } else if (previo.eje === "cartel") cartel()?.soltar();
    if (host.hasPointerCapture(previo.id)) host.releasePointerCapture(previo.id);
  };
  host.addEventListener("pointerdown", (e) => {
    if (gesto || !e.isPrimary || e.button !== 0) return;
    gesto = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, base: cartel()?.orientacion().y ?? 0, eje: null };
    host.setPointerCapture(e.pointerId);
  }, { signal: escuchas.signal });
  host.addEventListener("pointermove", (e) => {
    if (!gesto || e.pointerId !== gesto.id) return;
    const dx = e.clientX - gesto.x, dy = e.clientY - gesto.y;
    if (!gesto.eje && Math.hypot(dx, dy) > 6) {
      gesto.eje = Math.abs(dx) > Math.abs(dy) ? "cartel" : "hoja";
      if (gesto.eje === "hoja") hoja?.inicio(gesto.y, gesto.t);
    }
    if (gesto.eje === "hoja") hoja?.mover(e.clientY, e.timeStamp);
    else if (gesto.eje === "cartel") {
      const vista = cartel();
      if (vista) vista.inclinar(0, saturar(dx, vista.topes.y, gesto.base));
    }
    if (gesto.eje) e.preventDefault();
  }, { signal: escuchas.signal });
  host.addEventListener("pointerup", (e) => terminar(false, e), { signal: escuchas.signal });
  for (const nombre of ["pointercancel", "lostpointercapture"] as const) {
    host.addEventListener(nombre, (e) => terminar(true, e), { signal: escuchas.signal });
  }
  return () => { escuchas.abort(); terminar(true); };
}
