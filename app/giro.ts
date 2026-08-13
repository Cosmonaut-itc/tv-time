import type {
  CuentasDeCartelera,
  FiltroCartelera,
  TituloDeSala,
} from "./cartelera.ts";

export const RITMOS = {
  rapido: 1200,
  normal: 2100,
  dramatico: 3400,
} as const;

export type RitmoDeSala = keyof typeof RITMOS;

export function elegirIndiceGanador(
  cantidad: number,
  azar: () => number = Math.random,
): number {
  return Math.floor(azar() * cantidad);
}

type GiroEnVuelo = {
  finalistas: readonly { _id: string }[];
  vetadosAlIniciar: ReadonlySet<string>;
};

export type CambioDelGiro = "sigue vivo" | "reiniciar" | "no pasa nada";

export function decidirCambioDelGiro(
  giro: GiroEnVuelo | null,
  vetadosNuevos: ReadonlySet<string>,
): CambioDelGiro {
  if (!giro) return "no pasa nada";

  const agregados = [...vetadosNuevos].filter(
    (tituloId) => !giro.vetadosAlIniciar.has(tituloId),
  );
  if (agregados.length === 0) return "no pasa nada";
  return giro.finalistas.some(({ _id }) => agregados.includes(_id))
    ? "reiniciar"
    : "sigue vivo";
}

export function elegirFinalistas<T>(
  candidatos: readonly T[],
  saltaPrimerActo: boolean,
  azar: () => number = Math.random,
): T[] {
  if (saltaPrimerActo) return [...candidatos];

  const baraja = [...candidatos];
  for (let indice = baraja.length - 1; indice > 0; indice -= 1) {
    const intercambio = Math.floor(azar() * (indice + 1));
    [baraja[indice], baraja[intercambio]] = [
      baraja[intercambio],
      baraja[indice],
    ];
  }
  return baraja.slice(0, 3);
}

export function prepararGiro<T>(
  candidatos: readonly T[],
  saltaPrimerActo: boolean,
  azar: () => number = Math.random,
) {
  return {
    finalistas: elegirFinalistas(candidatos, saltaPrimerActo, azar),
    primerActo: candidatos.length > 0 && !saltaPrimerActo,
  } as const;
}

function plural(cantidad: number, singular: string, varios: string): string {
  return cantidad === 1 ? singular : varios;
}

export function mensajeDeVueltaVacia(
  titulos: readonly TituloDeSala[],
  filtro: FiltroCartelera,
  cuentas: CuentasDeCartelera,
  vetados: ReadonlySet<string>,
): string {
  const delFiltro = titulos.filter(
    ({ tipo }) => filtro === "loQueSea" || tipo === filtro,
  );
  const vistas = delFiltro.filter(({ visto }) => visto).length;
  const vetadas = delFiltro.filter(
    (titulo) => !titulo.visto && vetados.has(titulo._id),
  ).length;
  const sustantivo =
    filtro === "serie"
      ? "serie"
      : filtro === "pelicula"
        ? "película"
        : "título";
  const sustantivoPlural =
    filtro === "serie"
      ? "series"
      : filtro === "pelicula"
        ? "películas"
        : "títulos";
  const vista = filtro === "loQueSea" ? "visto" : "vista";
  const vistasPlural = filtro === "loQueSea" ? "vistos" : "vistas";
  const vetada = filtro === "loQueSea" ? "vetado" : "vetada";
  const vetadasPlural = filtro === "loQueSea" ? "vetados" : "vetadas";
  let causa: string;
  if (vistas > 0 && vetadas > 0) {
    causa = `${vistas} ${plural(vistas, sustantivo, sustantivoPlural)} ${plural(vistas, vista, vistasPlural)} y ${vetadas} ${plural(vetadas, vetada, vetadasPlural)} esta noche`;
  } else if (vetadas > 0) {
    causa = `${vetadas} ${plural(vetadas, sustantivo, sustantivoPlural)} ${plural(vetadas, vetada, vetadasPlural)} esta noche`;
  } else {
    const total = delFiltro.length;
    const agotadas =
      total === 1
        ? filtro === "loQueSea"
          ? "el título"
          : `la ${sustantivo}`
        : `${filtro === "loQueSea" ? "los" : "las"} ${total} ${sustantivoPlural}`;
    causa = `ya vieron ${agotadas}`;
  }

  if (filtro === "serie") {
    return `${causa} — hay ${cuentas.pelicula} ${plural(cuentas.pelicula, "película", "películas")}`;
  }
  if (filtro === "pelicula") {
    return `${causa} — hay ${cuentas.serie} ${plural(cuentas.serie, "serie", "series")}`;
  }
  return causa;
}
