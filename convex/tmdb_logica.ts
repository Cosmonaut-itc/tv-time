type ColeccionCruda = { id?: unknown; name?: unknown };

export type ResultadoCrudo = {
  id?: unknown;
  media_type?: unknown;
  title?: unknown;
  name?: unknown;
  release_date?: unknown;
  first_air_date?: unknown;
  poster_path?: unknown;
};

export type ParteCruda = {
  id?: unknown;
  title?: unknown;
  release_date?: unknown;
  poster_path?: unknown;
};

function enteroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0;
}

function fecha(valor: unknown): string | undefined {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? valor
    : undefined;
}

function poster(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.startsWith("/") && valor.length <= 220
    ? valor
    : undefined;
}

function anioDe(fechaEstreno: string | undefined): number | undefined {
  if (!fechaEstreno) return undefined;
  const anio = Number(fechaEstreno.slice(0, 4));
  return Number.isSafeInteger(anio) ? anio : undefined;
}

function mapearColeccion(coleccion: ColeccionCruda | null | undefined) {
  if (!coleccion || !enteroPositivo(coleccion.id) || typeof coleccion.name !== "string") {
    return undefined;
  }
  const nombre = coleccion.name.trim();
  return nombre ? { id: coleccion.id, nombre } : undefined;
}

export function mapearResultadoDeBusqueda(
  resultado: ResultadoCrudo,
  coleccionCruda?: ColeccionCruda | null,
) {
  if (!enteroPositivo(resultado.id)) return null;
  const esPelicula = resultado.media_type === "movie";
  const esSerie = resultado.media_type === "tv";
  if (!esPelicula && !esSerie) return null;

  const titulo = esPelicula ? resultado.title : resultado.name;
  if (typeof titulo !== "string" || !titulo.trim()) return null;
  const nombre = titulo.trim();
  const fechaEstreno = fecha(esPelicula ? resultado.release_date : resultado.first_air_date);
  const anio = anioDe(fechaEstreno);
  const posterPath = poster(resultado.poster_path);
  const coleccion = esPelicula ? mapearColeccion(coleccionCruda) : undefined;

  return {
    id: resultado.id,
    tipo: esPelicula ? "pelicula" as const : "serie" as const,
    nombre,
    ...(anio === undefined ? {} : { anio }),
    ...(fechaEstreno === undefined ? {} : { fechaEstreno }),
    ...(posterPath === undefined ? {} : { posterPath }),
    ...(coleccion === undefined ? {} : { coleccion }),
  };
}

export function mapearParteDeColeccion(
  parte: ParteCruda,
  coleccion: { id: number; nombre: string },
) {
  if (!enteroPositivo(parte.id) || typeof parte.title !== "string" || !parte.title.trim()) {
    return null;
  }
  const fechaEstreno = fecha(parte.release_date);
  const anio = anioDe(fechaEstreno);
  const posterPath = poster(parte.poster_path);
  return {
    id: parte.id,
    tipo: "pelicula" as const,
    nombre: parte.title.trim(),
    ...(anio === undefined ? {} : { anio }),
    ...(fechaEstreno === undefined ? {} : { fechaEstreno }),
    ...(posterPath === undefined ? {} : { posterPath }),
    coleccion,
  };
}

