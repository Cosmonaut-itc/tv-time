export const MAX_TITULOS_POR_ALTA = 50;

export type TituloSolicitado = {
  tipo: "pelicula" | "serie";
  nombre: string;
  anio?: number;
  tmdbId?: number;
  posterPath?: string;
  saga?: string;
  orden?: number;
  visto: boolean;
};

export type TituloListoParaInsertar = TituloSolicitado & {
  agregadoPor: string;
  agregado: number;
};

export function claveTmdb(tipo: TituloSolicitado["tipo"], tmdbId: number): string {
  return `${tipo}:${tmdbId}`;
}

function enteroEnRango(valor: number, minimo: number, maximo: number): boolean {
  return Number.isSafeInteger(valor) && valor >= minimo && valor <= maximo;
}

export function claveLugarDeSaga(saga: string, orden: number): string {
  return `${saga.trim()}\u0000${orden}`;
}

export function prepararLoteDeAlta({
  butacas,
  agregadoPor,
  existentesTmdb,
  lugaresExistentes = new Set<string>(),
  lote,
  ahora,
}: {
  butacas: readonly string[];
  agregadoPor: string;
  existentesTmdb: ReadonlySet<string>;
  lugaresExistentes?: ReadonlySet<string>;
  lote: readonly TituloSolicitado[];
  ahora: number;
}): TituloListoParaInsertar[] {
  if (!butacas.includes(agregadoPor)) {
    throw new Error("La autoría debe ser una butaca de esta sala.");
  }
  if (lote.length === 0) throw new Error("El alta no contiene títulos.");
  if (lote.length > MAX_TITULOS_POR_ALTA) {
    throw new Error(`El alta contiene demasiados títulos; el máximo es ${MAX_TITULOS_POR_ALTA}.`);
  }
  if (!Number.isSafeInteger(ahora) || ahora < 0) {
    throw new Error("El instante del alta no es válido.");
  }

  const tmdbDelLote = new Set<string>();
  const lugaresDelLote = new Set<string>();
  return lote.map((titulo, indice) => {
    const nombre = titulo.nombre.trim();
    if (!nombre || nombre.length > 180) {
      throw new Error(`El título ${indice + 1} tiene un nombre inválido.`);
    }
    if (titulo.tipo !== "pelicula" && titulo.tipo !== "serie") {
      throw new Error(`El título ${indice + 1} tiene un tipo inválido.`);
    }
    if (titulo.anio !== undefined && !enteroEnRango(titulo.anio, 1878, 3000)) {
      throw new Error(`El título ${indice + 1} tiene un año inválido.`);
    }
    if (titulo.tmdbId !== undefined) {
      if (!enteroEnRango(titulo.tmdbId, 1, Number.MAX_SAFE_INTEGER)) {
        throw new Error(`El título ${indice + 1} tiene un tmdbId inválido.`);
      }
      const clave = claveTmdb(titulo.tipo, titulo.tmdbId);
      if (existentesTmdb.has(clave)) {
        throw new Error(`${nombre} ya está en el catálogo.`);
      }
      if (tmdbDelLote.has(clave)) {
        throw new Error(`El tmdbId de ${nombre} está repetido en el lote.`);
      }
      tmdbDelLote.add(clave);
    }
    if (
      titulo.posterPath !== undefined &&
      (!titulo.posterPath.startsWith("/") || titulo.posterPath.length > 220)
    ) {
      throw new Error(`El título ${indice + 1} tiene un posterPath inválido.`);
    }

    const saga = titulo.saga?.trim();
    if (titulo.saga !== undefined && (!saga || saga.length > 100)) {
      throw new Error(`El título ${indice + 1} tiene una saga inválida.`);
    }
    if (titulo.orden !== undefined && !enteroEnRango(titulo.orden, 1, 10_000)) {
      throw new Error(`El título ${indice + 1} tiene un orden inválido.`);
    }
    if ((saga === undefined) !== (titulo.orden === undefined)) {
      throw new Error(`El título ${indice + 1} necesita saga y orden juntos.`);
    }
    if (titulo.tipo === "serie" && (saga !== undefined || titulo.orden !== undefined)) {
      throw new Error(`La serie ${nombre} no puede llevar saga ni orden.`);
    }
    if (saga !== undefined && titulo.orden !== undefined) {
      const lugar = claveLugarDeSaga(saga, titulo.orden);
      if (lugaresExistentes.has(lugar)) {
        throw new Error(`${nombre} intentó ocupar un lugar ocupado de la saga.`);
      }
      if (lugaresDelLote.has(lugar)) {
        throw new Error(`${nombre} trae un lugar repetido dentro de la saga.`);
      }
      lugaresDelLote.add(lugar);
    }

    return {
      tipo: titulo.tipo,
      nombre,
      ...(titulo.anio === undefined ? {} : { anio: titulo.anio }),
      ...(titulo.tmdbId === undefined ? {} : { tmdbId: titulo.tmdbId }),
      ...(titulo.posterPath === undefined ? {} : { posterPath: titulo.posterPath }),
      ...(saga === undefined ? {} : { saga }),
      ...(titulo.orden === undefined ? {} : { orden: titulo.orden }),
      agregadoPor,
      visto: titulo.visto,
      agregado: ahora + indice,
    };
  });
}
