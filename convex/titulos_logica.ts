type TituloDeSala<SalaId extends string> = { salaId: SalaId };

/** Las dos mutaciones públicas del catálogo parten de esta frontera. */
export function validarTituloDeSala<SalaId extends string>(
  titulo: TituloDeSala<SalaId> | null,
  salaId: SalaId,
): asserts titulo is TituloDeSala<SalaId> {
  if (!titulo || titulo.salaId !== salaId) {
    throw new Error("El título no pertenece a esta sala.");
  }
}
