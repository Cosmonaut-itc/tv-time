/** Lo que se puede medir de un número ya pintado, en píxeles. */
export type TintaDelNumero = {
  /** Alto de la caja que el conteo centra. */
  alto: number;
  /** Distancia de la línea base al borde de arriba de esa caja. */
  lineaBase: number;
  /** Cuánto sube la tinta del glifo sobre la línea base. */
  tintaArriba: number;
  /** Cuánto baja la tinta del glifo debajo de la línea base. */
  tintaAbajo: number;
};

/**
 * Cuánto hay que correr el número para que su **tinta** quede al centro de su
 * caja — que es lo que el conteo centra contra el aro del proyector.
 *
 * No se puede resolver con métrica declarada: `text-box-edge: cap` recorta a la
 * altura de mayúscula que dice la tipografía, y las cifras de Copperplate no
 * llegan a ella, así que el número seguía cayendo debajo del aro. Aquí se mide
 * el glifo pintado, sea cual sea la tipografía que el aparato haya escogido.
 */
export function ajusteOpticoDelNumero({
  alto,
  lineaBase,
  tintaArriba,
  tintaAbajo,
}: TintaDelNumero): number {
  const centroDeLaTinta = lineaBase - (tintaArriba - tintaAbajo) / 2;
  return alto / 2 - centroDeLaTinta;
}
