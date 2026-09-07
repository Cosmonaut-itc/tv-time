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
const CELDAS = 8;

export function barajar<T>(lista: readonly T[], azar: () => number = Math.random) {
  const b = [...lista];
  for (let i = b.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function tira3D(finalista: TituloDeSala, candidatos: readonly TituloDeSala[], quieto: boolean, azar: () => number = Math.random) {
    const otros = barajar(candidatos.filter((t) => t._id !== finalista._id), azar).slice(0, CELDAS - 1);
    if (!otros.length) otros.push(finalista);
    const destino = quieto ? 0 : Math.floor(azar() * CELDAS);
    const celdas = [];
    let k = 0;
    for (let i = 0; i < CELDAS; i += 1) {
      if (i === destino) celdas.push(finalista);
      else { celdas.push(otros[k % otros.length]); k += 1; }
    }
    return { celdas, destino };
  }


const ZONA_MUERTA = 0.10;
export function fuera(v: number, rango: number) {
    const n = Math.max(-1, Math.min(1, v / rango));
    const m = Math.abs(n);
    if (m <= ZONA_MUERTA) return 0;
    return (n < 0 ? -1 : 1) * (m - ZONA_MUERTA) / (1 - ZONA_MUERTA);
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
