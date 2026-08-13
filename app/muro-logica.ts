import { tieneAnteriorSinVer, type TituloDeSala } from "./cartelera.ts";

export type FiltroDelMuro = "todo" | "sinVer" | "vistas";

export type PilaDelMuro = {
  tipo: "pila";
  saga: string;
  titulos: readonly TituloDeSala[];
  visibles: readonly TituloVisibleDelMuro[];
  cara: TituloDeSala;
  vistas: number;
};

export type TituloVisibleDelMuro = {
  titulo: TituloDeSala;
  bloqueada: boolean;
};

export type TituloSueltoDelMuro = {
  tipo: "titulo";
  titulo: TituloDeSala;
  bloqueada: boolean;
};

export type CeldaDelMuro = PilaDelMuro | TituloSueltoDelMuro;

type OpcionesDelMuro = { filtro: FiltroDelMuro; busqueda: string };

function compararPorSaga(izquierda: TituloDeSala, derecha: TituloDeSala): number {
  const ordenIzquierdo = izquierda.orden ?? Number.POSITIVE_INFINITY;
  const ordenDerecho = derecha.orden ?? Number.POSITIVE_INFINITY;
  if (ordenIzquierdo !== ordenDerecho) return ordenIzquierdo - ordenDerecho;

  const agregadoIzquierdo = izquierda.agregado ?? Number.POSITIVE_INFINITY;
  const agregadoDerecho = derecha.agregado ?? Number.POSITIVE_INFINITY;
  if (agregadoIzquierdo !== agregadoDerecho) return agregadoIzquierdo - agregadoDerecho;
  return izquierda._id.localeCompare(derecha._id);
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function coincide(titulo: TituloDeSala, { filtro, busqueda }: OpcionesDelMuro): boolean {
  if (filtro === "sinVer" && titulo.visto) return false;
  if (filtro === "vistas" && !titulo.visto) return false;
  if (!busqueda.trim()) return true;

  const consulta = normalizar(busqueda.trim());
  return normalizar(titulo.nombre).includes(consulta) ||
    (titulo.saga !== undefined && normalizar(titulo.saga).includes(consulta));
}

export function mismaFichaDelMuro(
  anterior: TituloDeSala,
  siguiente: TituloDeSala,
): boolean {
  return (
    anterior._id === siguiente._id &&
    anterior.tipo === siguiente.tipo &&
    anterior.nombre === siguiente.nombre &&
    anterior.anio === siguiente.anio &&
    anterior.tmdbId === siguiente.tmdbId &&
    anterior.posterPath === siguiente.posterPath &&
    anterior.saga === siguiente.saga &&
    anterior.orden === siguiente.orden &&
    anterior.agregadoPor === siguiente.agregadoPor &&
    anterior.visto === siguiente.visto &&
    anterior.agregado === siguiente.agregado
  );
}

export function mismaCeldaDeTitulo(
  anterior: TituloVisibleDelMuro,
  siguiente: TituloVisibleDelMuro,
): boolean {
  return (
    anterior.bloqueada === siguiente.bloqueada &&
    mismaFichaDelMuro(anterior.titulo, siguiente.titulo)
  );
}

export function mismaCeldaDePila(
  anterior: PilaDelMuro,
  siguiente: PilaDelMuro,
): boolean {
  return (
    anterior.saga === siguiente.saga &&
    anterior.vistas === siguiente.vistas &&
    anterior.titulos.length === siguiente.titulos.length &&
    mismaFichaDelMuro(anterior.cara, siguiente.cara)
  );
}

function pilaDe(
  saga: string,
  titulos: readonly TituloDeSala[],
  visibles: readonly TituloVisibleDelMuro[],
): PilaDelMuro {
  const vistas = titulos.filter(({ visto }) => visto).length;
  return {
    tipo: "pila",
    saga,
    titulos,
    visibles,
    cara: titulos.find(({ visto }) => !visto) ?? titulos[titulos.length - 1],
    vistas,
  };
}

/** Agrupa las 38 fichas y deriva el estado que cada celda presenta. */
export function derivarMuro(
  titulos: readonly TituloDeSala[],
  opciones: OpcionesDelMuro,
) {
  const cuentas = {
    todo: titulos.length,
    sinVer: titulos.filter(({ visto }) => !visto).length,
    vistas: titulos.filter(({ visto }) => visto).length,
  } as const;
  const porSaga = new Map<string, TituloDeSala[]>();
  const sueltas: TituloDeSala[] = [];

  for (const titulo of titulos) {
    if (titulo.saga === undefined) sueltas.push(titulo);
    else {
      const grupo = porSaga.get(titulo.saga) ?? [];
      grupo.push(titulo);
      porSaga.set(titulo.saga, grupo);
    }
  }

  const pilas = [...porSaga.entries()]
    .map(([saga, grupo]) => {
      const ordenados = [...grupo].sort(compararPorSaga);
      return {
        saga,
        titulos: ordenados,
        visibles: ordenados
          .filter((titulo) => coincide(titulo, opciones))
          .map((titulo) => ({
            titulo,
            bloqueada: tieneAnteriorSinVer(titulo, titulos),
          })),
      };
    })
    .filter(({ visibles }) => visibles.length > 0)
    .sort((izquierda, derecha) => {
      const altaIzquierda = izquierda.titulos[0].agregado ?? Number.POSITIVE_INFINITY;
      const altaDerecha = derecha.titulos[0].agregado ?? Number.POSITIVE_INFINITY;
      return altaIzquierda - altaDerecha || izquierda.saga.localeCompare(derecha.saga);
    })
    .map(({ saga, titulos: agrupados, visibles }) => pilaDe(saga, agrupados, visibles));

  const sueltasVisibles = sueltas
    .filter((titulo) => coincide(titulo, opciones))
    .sort((izquierda, derecha) => {
      const altaIzquierda = izquierda.agregado ?? Number.NEGATIVE_INFINITY;
      const altaDerecha = derecha.agregado ?? Number.NEGATIVE_INFINITY;
      return altaDerecha - altaIzquierda || izquierda._id.localeCompare(derecha._id);
    })
    .map((titulo) => ({
      tipo: "titulo" as const,
      titulo,
      bloqueada: tieneAnteriorSinVer(titulo, titulos),
    }));

  return { cuentas, celdas: [...pilas, ...sueltasVisibles] } as const;
}
