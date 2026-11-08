import { derivarCartelera, tieneAnteriorSinVer, type TituloDeSala } from "./cartelera.ts";

/** La elección manual conserva las reglas de la cartelera salvo su filtro. */
export function finalistasDeRuleta(
  ids: readonly string[],
  titulos: readonly TituloDeSala[],
  vetados: ReadonlySet<string>,
): TituloDeSala[] {
  const disponibles = new Map(derivarCartelera(titulos, { filtro: "loQueSea", vetados })
    .candidatos.map((titulo) => [titulo._id, titulo]));
  return [...new Set(ids)].flatMap((id) => {
    const titulo = disponibles.get(id);
    return titulo ? [titulo] : [];
  }).slice(0, 3);
}

export function podarRuleta(
  ids: readonly string[],
  titulos: readonly TituloDeSala[],
  vetados: ReadonlySet<string>,
): string[] {
  return finalistasDeRuleta(ids, titulos, vetados).map(({ _id }) => _id);
}

export function razonSinRuleta(
  titulo: TituloDeSala,
  titulos: readonly TituloDeSala[],
  vetados: ReadonlySet<string>,
  marcadas: readonly string[],
): string | null {
  if (titulo.visto) return "Ya la vieron.";
  const anterior = titulos.filter((otro) =>
    otro._id !== titulo._id && tieneAnteriorSinVer(titulo, [otro, titulo]),
  ).sort((a, b) => a.orden! - b.orden! ||
    (a.agregado ?? Infinity) - (b.agregado ?? Infinity) || a._id.localeCompare(b._id))[0];
  if (anterior) return `Primero va «${anterior.nombre}».`;
  if (vetados.has(titulo._id)) return "La vetaron esta noche.";
  const vigentes = podarRuleta(marcadas, titulos, vetados);
  if (!vigentes.includes(titulo._id) && vigentes.length >= 3) return "La ruleta ya tiene tres.";
  return null;
}
