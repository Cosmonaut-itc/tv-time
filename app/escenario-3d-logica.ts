import type { FaseDelGiro } from "./giro.ts";
import type { Sala3D, FaseDeLaSala3D } from "./tres/tipos.ts";

export function faseDeLaSala3D(fase: FaseDelGiro): FaseDeLaSala3D {
  if (fase === "función") return "funcion";
  if (fase === "vuelta vacía") return "reposo";
  return fase;
}

export function puedeArrancar(fase: FaseDelGiro, ocupado: boolean): boolean {
  return !ocupado && (fase === "reposo" || fase === "ganador" || fase === "función");
}

export function tamboresQuietos(tiras: readonly (readonly unknown[])[]): boolean {
  return tiras.every((tira) => tira.length === 1);
}

/** La máquina crea un array de finalistas por giro, incluso si repite títulos. */
export function debeMontarTambores(
  fase: FaseDelGiro,
  finalistas: readonly unknown[],
  montados: readonly unknown[] | null,
): boolean {
  return (fase === "girando" || fase === "finalistas") && finalistas !== montados;
}

/** Envía también el apagado inmediato durante el veto. */
export function sincronizarSello(sala: Pick<Sala3D, "sello">, visible: boolean, anterior: boolean | undefined): void {
  if (visible !== anterior) sala.sello(visible);
}
