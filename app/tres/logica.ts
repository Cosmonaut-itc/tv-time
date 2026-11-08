import type { TituloDeSala } from "../cartelera.ts";

/** Fracción vertical de la banda (0 arriba, 1 abajo), en el plano z. */
export function fraccionAMundo({ fraccion, alto, distancia, z }: {
  fraccion: number; alto: number; distancia: number; z: number;
}): number {
  return (alto / 2) * (distancia - z) / distancia * (1 - 2 * fraccion);
}

/** El techo es el borde aprobado; el margen sólo separa el marco del suelo. */
export function poseDelGanador({ techo, suelo, altoMarco, margen = 0 }: {
  techo: number; suelo: number; altoMarco: number; margen?: number;
}) {
  const inferior = suelo + margen;
  const mitad = altoMarco * 0.80 / 2;
  if (0.62 - mitad >= inferior) {
    return { y: 0.62, escala: 0.80 };
  }
  // En huecos imposibles prima el mínimo de legibilidad sobre el margen.
  const escala = Math.max(0.5, Math.min(0.80, (techo - inferior) / altoMarco));
  return {
    y: techo - altoMarco * escala / 2,
    escala,
  };
}

// Ocho celdas por vuelta; la lógica no carga three ni DOM.
export const CELDAS = 8;

/** Centra la celda elegida sin mover la geometría de la cinta. */
export const desfaseDeCinta = (posicion: number) => (posicion + 0.5) / CELDAS;

/** El centro conserva el brillo; las filas vecinas bajan suavemente a la mitad. */
export function brilloDeCinta(u: number): number {
  const distancia = Math.min(u, 1 - u) * CELDAS;
  const t = Math.max(0, Math.min(1, (distancia - 0.5) / 0.6));
  return 1 - 0.5 * t * t * (3 - 2 * t);
}

export function barajar<T>(lista: readonly T[], azar: () => number = Math.random) {
  const b = [...lista];
  for (let i = b.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Reparte relleno entre tambores; sólo repite dentro de un tambor al agotarlo. */
export function repartirRelleno(
  finalistas: readonly TituloDeSala[],
  candidatos: readonly TituloDeSala[],
  largo: number,
  azar: () => number = Math.random,
): TituloDeSala[][] {
  const disponibles = barajar(
    candidatos.filter((titulo) => !finalistas.some((finalista) => finalista._id === titulo._id)), azar,
  );
  let cursor = 0;
  return finalistas.map(() => {
    const relleno: TituloDeSala[] = [];
    let intentos = 0;
    while (relleno.length < largo && disponibles.length && intentos < disponibles.length) {
      if (cursor >= disponibles.length) cursor = 0;
      const titulo = disponibles[cursor++];
      intentos += 1;
      if (!relleno.some((actual) => actual._id === titulo._id)) {
        relleno.push(titulo);
        intentos = 0;
      }
    }
    while (relleno.length < largo && disponibles.length) relleno.push(disponibles[cursor++ % disponibles.length]);
    return relleno;
  });
}

export function tiras3D(
  finalistas: readonly TituloDeSala[], candidatos: readonly TituloDeSala[], quieto: boolean,
  azar: () => number = Math.random,
) {
  const rellenos = repartirRelleno(finalistas, candidatos, CELDAS - 1, azar);
  return finalistas.map((finalista, indice) => {
    const otros = rellenos[indice].length ? rellenos[indice] : [finalista];
    const destino = quieto ? 0 : Math.floor(azar() * CELDAS);
    let k = 0;
    const celdas = Array.from({ length: CELDAS }, (_, i) =>
      i === destino ? finalista : otros[k++ % otros.length]);
    return { celdas, destino };
  });
}


/** El gesto usa 130 px de recorrido y parte del ángulo que ya tenía el cartel. */
export const saturar = (px: number, tope: number, base: number) => tope * Math.tanh(px / 130
  + Math.atanh(Math.max(-0.999999, Math.min(0.999999, base / tope))));

export function cuadrosPorSegundo({ arrastrando, reloj, altoHasta, fase }: {
  arrastrando: boolean;
  reloj: number;
  altoHasta: number;
  fase: import("./tipos.ts").FaseDeLaSala3D;
}): 60 | 20 {
  return (arrastrando || reloj < altoHasta
    || ['conteo', 'girando', 'finalistas', 'vetando'].includes(fase) ? 60 : 20);
}

/** Relación del ancho del póster (1.28) al marco (1.86), por la escala del tambor. */
export function escalaDeVuelo(escalaTambor = 0.94): number {
  return (1.28 / 1.86) * escalaTambor;
}
