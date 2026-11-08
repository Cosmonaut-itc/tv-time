type TituloValidable<SalaId extends string> = {
  salaId: SalaId;
  visto: boolean;
};

type LugarEnSaga = {
  saga?: string;
  orden?: number;
};

type TituloDeSaga = LugarEnSaga & {
  nombre: string;
  visto: boolean;
};

export function validarTituloDelCatalogo<SalaId extends string>(
  titulo: TituloValidable<SalaId> | null,
  salaId: SalaId,
): asserts titulo is TituloValidable<SalaId> {
  if (!titulo || titulo.salaId !== salaId) {
    throw new Error("El título no pertenece a esta sala.");
  }
}

export type PlanDeDeshacer = {
  titulo: { visto: false } | null;
  posterior: { vistoAntes: false } | null;
};

/**
 * Deshacer devuelve el título a como estaba antes de toda la cadena de
 * registros. Si otra función del título vino después, ésa lo mantiene visto y
 * hereda el «sin ver» que recordaba la que se borra: su propio `vistoAntes:
 * true` era efecto de ésta. Cualquier orden de deshacer acaba igual.
 */
export function planParaDeshacer<SalaId extends string>(
  funcion: { salaId: SalaId; vistoAntes?: boolean } | null,
  salaId: SalaId,
  posterior: { vistoAntes?: boolean } | null,
): PlanDeDeshacer | null {
  if (!funcion) return null;
  if (funcion.salaId !== salaId) {
    throw new Error("La función no pertenece a esta sala.");
  }
  // Las funciones antiguas no recuerdan el estado previo: no lo adivinamos.
  const sinVerAntes = funcion.vistoAntes === false;
  if (posterior) {
    return { titulo: null, posterior: sinVerAntes && posterior.vistoAntes === true ? { vistoAntes: false } : null };
  }
  return { titulo: sinVerAntes ? { visto: false } : null, posterior: null };
}

export function validarTituloParaFuncion<SalaId extends string>(
  titulo: TituloValidable<SalaId> | null,
  salaId: SalaId,
): asserts titulo is TituloValidable<SalaId> {
  validarTituloDelCatalogo(titulo, salaId);
  if (titulo.visto) {
    throw new Error("Ese título ya salió de la cartelera.");
  }
}

/**
 * El ganador de la ruleta sólo puede cerrarse sobre algo que la cartelera de esta noche
 * ofrecía. La pantalla nunca propone otra cosa, pero la mutación es pública:
 * sin esta comprobación un cliente manipulado podría encender `visto` en una
 * saga bloqueada —rompiendo el candado— o en algo vetado hace un rato.
 */
export function validarEnCartelera<TituloId extends string>(
  candidatos: readonly { _id: TituloId }[],
  tituloId: TituloId,
): void {
  if (!candidatos.some(({ _id }) => _id === tituloId)) {
    throw new Error("Ese título no está en la cartelera de esta noche.");
  }
}

export function esPrimeraFuncion(filasLeidas: number): boolean {
  return filasLeidas === 1;
}

export function siguienteDeSaga(
  elegido: LugarEnSaga,
  titulos: readonly TituloDeSaga[],
): string | null {
  if (elegido.saga === undefined || elegido.orden === undefined) return null;

  const siguiente = titulos.find(
    (titulo) =>
      titulo.saga === elegido.saga && titulo.orden === elegido.orden! + 1,
  );

  return siguiente && !siguiente.visto ? siguiente.nombre : null;
}

/** La mitad sin fecha son los vistos que no sostienen ninguna función. */
export function idsYaVistosSinFuncion<TituloId extends string>(
  titulos: readonly { _id: TituloId; visto: boolean }[],
  funciones: readonly { tituloId: TituloId }[],
): TituloId[] {
  const conFuncion = new Set(funciones.map(({ tituloId }) => tituloId));
  return titulos
    .filter((titulo) => titulo.visto && !conFuncion.has(titulo._id))
    .map(({ _id }) => _id);
}
