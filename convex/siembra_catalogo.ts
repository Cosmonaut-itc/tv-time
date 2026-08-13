import { CATALOGO_INICIAL, type TituloInicial } from "./catalogo_inicial.ts";

type TituloCatalogable = Pick<TituloInicial, "tipo" | "nombre" | "anio" | "saga" | "orden">;
type TituloSembrado = TituloCatalogable & { agregado: number; agregadoPor?: string };
export type EstadoCatalogo = "vacia" | "parcial" | "completa" | "ajena";

function claveDeTitulo(titulo: TituloCatalogable): string {
  return JSON.stringify([
    titulo.tipo,
    titulo.nombre,
    titulo.anio ?? null,
    titulo.saga ?? null,
    titulo.orden ?? null,
  ]);
}

const INDICE_POR_TITULO = new Map(
  CATALOGO_INICIAL.map((titulo, indice) => [claveDeTitulo(titulo), indice]),
);

export function indiceDeTitulo(titulo: TituloCatalogable): number | undefined {
  return INDICE_POR_TITULO.get(claveDeTitulo(titulo));
}

export function clasificarCatalogo(titulos: readonly TituloCatalogable[]): EstadoCatalogo {
  if (titulos.length === 0) return "vacia";

  const indices = titulos.map(indiceDeTitulo);
  if (indices.some((indice) => indice === undefined)) return "ajena";
  if (new Set(indices).size !== indices.length) return "ajena";
  return titulos.length === CATALOGO_INICIAL.length ? "completa" : "parcial";
}

export function agregadoDelIndice(base: number, indice: number): number {
  return base + indice;
}

export function baseDeAgregados(titulos: readonly TituloSembrado[]): number | undefined {
  const bases = titulos.flatMap((titulo) => {
    const indice = indiceDeTitulo(titulo);
    return indice === undefined ? [] : [titulo.agregado - indice];
  });
  return bases.length > 0 ? Math.min(...bases) : undefined;
}

export function datosDeSiembraVigentes(titulos: readonly TituloSembrado[]): boolean {
  if (clasificarCatalogo(titulos) !== "completa") return false;
  const base = baseDeAgregados(titulos);
  if (base === undefined) return false;

  return titulos.every((titulo) => {
    const indice = indiceDeTitulo(titulo);
    return (
      indice !== undefined &&
      titulo.agregado === agregadoDelIndice(base, indice) &&
      titulo.agregadoPor === undefined
    );
  });
}
