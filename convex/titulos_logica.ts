type TituloDeSala<SalaId extends string> = { salaId: SalaId };

/** Las mutaciones públicas del catálogo parten de esta frontera. */
export function validarTituloDeSala<SalaId extends string>(
  titulo: TituloDeSala<SalaId> | null,
  salaId: SalaId,
): asserts titulo is TituloDeSala<SalaId> {
  if (!titulo || titulo.salaId !== salaId) {
    throw new Error("El título no pertenece a esta sala.");
  }
}

export type CalificacionDeButaca = { butaca: string; estrellas: number };

export function calificarTitulo({
  visto, butacas, calificaciones = [], butaca, estrellas,
}: {
  visto: boolean;
  butacas: readonly string[];
  calificaciones?: readonly CalificacionDeButaca[];
  butaca: string;
  estrellas: number;
}): CalificacionDeButaca[] {
  if (!visto) throw new Error("Sólo se pueden calificar títulos vistos.");
  if (!butacas.includes(butaca)) throw new Error("La butaca no pertenece a esta sala.");
  if (!Number.isInteger(estrellas) || estrellas < 0 || estrellas > 5) {
    throw new Error("La calificación debe ser un entero de 0 a 5.");
  }
  const otras = calificaciones.filter((voz) => voz.butaca !== butaca);
  return estrellas === 0 ? otras : [...otras, { butaca, estrellas }];
}
