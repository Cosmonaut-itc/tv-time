/** Caben ~22 mayúsculas por renglón en el póster dibujado de 300×450. */
const POR_RENGLON = 22;
const RENGLONES = 2;

/**
 * Parte el nombre en dos renglones antes de dibujarlo. Cortar a ciegas dejaba
 * títulos mochos —«CÓMO ENTRENAR A TU DRAGÓ»—; aquí se corta por palabra y, si
 * aun así no cabe, se admite con puntos suspensivos.
 */
export function renglonesDeTitulo(nombre: string): string[] {
  const palabras = nombre.toUpperCase().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [];

  const renglones: string[] = [];
  for (const palabra of palabras) {
    const ultimo = renglones[renglones.length - 1];
    if (ultimo !== undefined && `${ultimo} ${palabra}`.length <= POR_RENGLON) {
      renglones[renglones.length - 1] = `${ultimo} ${palabra}`;
      continue;
    }
    if (renglones.length === RENGLONES) {
      renglones[RENGLONES - 1] = recortar(`${ultimo} ${palabra}`);
      return renglones;
    }
    renglones.push(palabra.length <= POR_RENGLON ? palabra : recortar(palabra));
  }
  return renglones;
}

function recortar(texto: string): string {
  return texto.length <= POR_RENGLON
    ? texto
    : `${texto.slice(0, POR_RENGLON - 1).trimEnd()}…`;
}
