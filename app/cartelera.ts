export type FiltroCartelera = "pelicula" | "serie" | "loQueSea";

export type TituloDeSala = {
  _id: string;
  tipo: "pelicula" | "serie";
  nombre: string;
  anio?: number;
  tmdbId?: number;
  posterPath?: string;
  saga?: string;
  orden?: number;
  agregadoPor?: string;
  visto: boolean;
  agregado?: number;
};

export type CuentasDeCartelera = Record<FiltroCartelera, number>;
export type AnuncioDeCartelera = "esta noche, duelo" | "no había de otra" | null;

type OpcionesDeCartelera = {
  filtro: FiltroCartelera;
  vetados: ReadonlySet<string>;
};

function compararLugarEnSaga(
  izquierda: TituloDeSala,
  derecha: TituloDeSala,
): number {
  if (izquierda.orden! < derecha.orden!) return -1;
  if (izquierda.orden! > derecha.orden!) return 1;

  const agregadoIzquierdo = izquierda.agregado ?? Number.POSITIVE_INFINITY;
  const agregadoDerecho = derecha.agregado ?? Number.POSITIVE_INFINITY;
  if (agregadoIzquierdo < agregadoDerecho) return -1;
  if (agregadoIzquierdo > agregadoDerecho) return 1;

  if (izquierda._id < derecha._id) return -1;
  if (izquierda._id > derecha._id) return 1;
  return 0;
}

function tieneAnteriorSinVer(
  titulo: TituloDeSala,
  titulos: readonly TituloDeSala[],
): boolean {
  if (
    titulo.tipo !== "pelicula" ||
    titulo.saga === undefined ||
    titulo.orden === undefined
  ) {
    return false;
  }
  return titulos.some(
    (anterior) =>
      anterior.tipo === "pelicula" &&
      anterior.saga === titulo.saga &&
      anterior.orden !== undefined &&
      !anterior.visto &&
      compararLugarEnSaga(anterior, titulo) < 0,
  );
}

function anuncioDe(candidatos: number): AnuncioDeCartelera {
  if (candidatos === 2) return "esta noche, duelo";
  if (candidatos === 1) return "no había de otra";
  return null;
}

/**
 * Deriva el recorte de la sala sin persistirlo.
 *
 * Los vetos ya forman parte de la interfaz aunque todavía lleguen vacíos. Las
 * cuentas respetan el 35/3/38 fijado por el ticket 009: cuentan títulos no
 * vistos ni vetados. Los candidatos aplican además el candado de saga. El
 * primer acto sólo puede saltarse cuando hay función: cero candidatos no
 * saltan ningún acto.
 */
export function derivarCartelera(
  titulos: readonly TituloDeSala[],
  { filtro, vetados }: OpcionesDeCartelera,
) {
  const disponibles = titulos.filter(
    (titulo) => !titulo.visto && !vetados.has(titulo._id),
  );
  const cuentas: CuentasDeCartelera = {
    pelicula: disponibles.filter(({ tipo }) => tipo === "pelicula").length,
    serie: disponibles.filter(({ tipo }) => tipo === "serie").length,
    loQueSea: disponibles.length,
  };
  const sinCandado = disponibles.filter(
    (titulo) => !tieneAnteriorSinVer(titulo, titulos),
  );
  const candidatos =
    filtro === "loQueSea"
      ? sinCandado
      : sinCandado.filter(({ tipo }) => tipo === filtro);

  return {
    candidatos,
    cuentas,
    anuncio: anuncioDe(candidatos.length),
    saltaPrimerActo: candidatos.length > 0 && candidatos.length <= 3,
  } as const;
}
