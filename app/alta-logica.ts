export const ESPERA_BUSQUEDA_MS = 220;

export type TipoTitulo = "pelicula" | "serie";

export type ColeccionEncontrada = {
  id: number;
  nombre: string;
};

export type TituloEncontrado = {
  id: number;
  tipo: TipoTitulo;
  nombre: string;
  anio?: number;
  fechaEstreno?: string;
  posterPath?: string;
  coleccion?: ColeccionEncontrada;
};

export type TituloParaAlta = {
  tipo: TipoTitulo;
  nombre: string;
  anio?: number;
  tmdbId?: number;
  posterPath?: string;
  saga?: string;
  orden?: number;
  visto: boolean;
};

export function claveTmdb(tipo: TipoTitulo, tmdbId: number): string {
  return `${tipo}:${tmdbId}`;
}

type ParteOrdenable = Pick<TituloEncontrado, "id" | "fechaEstreno">;

/** Una fecha ausente no prueba que el título ya esté disponible. */
export function estaEstrenado(fechaEstreno: string | undefined, hoy: string): boolean {
  return Boolean(
    fechaEstreno &&
    /^\d{4}-\d{2}-\d{2}$/.test(fechaEstreno) &&
    fechaEstreno <= hoy,
  );
}

export function etiquetaDeEstrenoPendiente(fechaEstreno: string | undefined): string {
  return fechaEstreno ? "aún no se estrena" : "sin fecha";
}

export function etiquetaDelBotonDeSaga({
  cantidadDeEstrenadas,
  enCartelera,
  unaEntrada,
}: {
  cantidadDeEstrenadas: number;
  enCartelera: number;
  unaEntrada: boolean;
}): string {
  const cantidad = unaEntrada
    ? "1 entrada"
    : `${cantidadDeEstrenadas} ${cantidadDeEstrenadas === 1 ? "título" : "títulos"}`;
  return `Agregar ${cantidad} · ${enCartelera} en cartelera`;
}

export function hoyEnMexico(ahora = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const valor = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

export function ordenarPartesPorEstreno<T extends ParteOrdenable>(partes: readonly T[]): T[] {
  return [...partes].sort((izquierda, derecha) => {
    const fechaIzquierda = izquierda.fechaEstreno ?? "9999-99-99";
    const fechaDerecha = derecha.fechaEstreno ?? "9999-99-99";
    return fechaIzquierda.localeCompare(fechaDerecha) || izquierda.id - derecha.id;
  });
}

export function prepararAltaDeSaga(
  {
    nombre,
    partes,
    corte,
    unaEntrada,
    ordenInicial = 1,
  }: {
    nombre: string;
    partes: readonly TituloEncontrado[];
    corte: number;
    unaEntrada: boolean;
    ordenInicial?: number;
  },
  hoy: string,
): TituloParaAlta[] {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) throw new Error("La saga necesita un nombre.");

  const estrenadas = ordenarPartesPorEstreno(partes).filter(({ fechaEstreno }) =>
    estaEstrenado(fechaEstreno, hoy),
  );
  if (estrenadas.length === 0) {
    throw new Error("La saga no tiene títulos estrenados para agregar.");
  }

  if (unaEntrada) {
    const primera = estrenadas[0];
    return [{
      tipo: "pelicula",
      nombre: nombreLimpio,
      ...(primera.anio === undefined ? {} : { anio: primera.anio }),
      tmdbId: primera.id,
      ...(primera.posterPath === undefined ? {} : { posterPath: primera.posterPath }),
      visto: false,
    }];
  }

  const vistos = Math.max(0, Math.min(Math.trunc(corte), estrenadas.length));
  return estrenadas.map((parte, indice) => ({
    tipo: "pelicula",
    nombre: parte.nombre,
    ...(parte.anio === undefined ? {} : { anio: parte.anio }),
    tmdbId: parte.id,
    ...(parte.posterPath === undefined ? {} : { posterPath: parte.posterPath }),
    saga: nombreLimpio,
    orden: ordenInicial + indice,
    visto: indice < vistos,
  }));
}

export function sagaExistenteEnColeccion(
  titulos: readonly Pick<TituloParaAlta, "tipo" | "tmdbId" | "saga" | "orden">[],
  partes: readonly TituloEncontrado[],
): string | undefined {
  const idsDeLaColeccion = new Set(
    partes
      .filter(({ tipo }) => tipo === "pelicula")
      .map(({ id }) => id),
  );
  return titulos.find(({ tipo, tmdbId, saga }) =>
    tipo === "pelicula" &&
    tmdbId !== undefined &&
    idsDeLaColeccion.has(tmdbId) &&
    saga
  )?.saga;
}

export function siguienteOrdenDeSaga(
  titulos: readonly { tipo: TipoTitulo; saga?: string; orden?: number }[],
  saga: string,
): number {
  return titulos.reduce(
    (mayor, titulo) =>
      titulo.tipo === "pelicula" && titulo.saga === saga &&
      titulo.orden !== undefined && titulo.orden > mayor
        ? titulo.orden
        : mayor,
    0,
  ) + 1;
}

export function mismaFilaDeBusqueda(
  anterior: TituloEncontrado,
  siguiente: TituloEncontrado,
): boolean {
  return (
    anterior.id === siguiente.id &&
    anterior.tipo === siguiente.tipo &&
    anterior.nombre === siguiente.nombre &&
    anterior.anio === siguiente.anio &&
    anterior.fechaEstreno === siguiente.fechaEstreno &&
    anterior.posterPath === siguiente.posterPath &&
    anterior.coleccion?.id === siguiente.coleccion?.id &&
    anterior.coleccion?.nombre === siguiente.coleccion?.nombre
  );
}

export function mismaParteDeSaga(
  anterior: TituloEncontrado,
  siguiente: TituloEncontrado,
): boolean {
  return mismaFilaDeBusqueda(anterior, siguiente);
}
