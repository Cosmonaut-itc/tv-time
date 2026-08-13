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

export function validarTituloParaFuncion<SalaId extends string>(
  titulo: TituloValidable<SalaId> | null,
  salaId: SalaId,
): asserts titulo is TituloValidable<SalaId> {
  if (!titulo || titulo.salaId !== salaId) {
    throw new Error("El título no pertenece a esta sala.");
  }
  if (titulo.visto) {
    throw new Error("Ese título ya salió de la cartelera.");
  }
}

/**
 * «Esta vemos» sólo puede cerrarse sobre algo que la cartelera de esta noche
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
