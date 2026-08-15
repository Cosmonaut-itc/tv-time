/**
 * Los pósters de TMDB se sirven directo desde `image.tmdb.org`, sin pasar por
 * la optimización de imágenes de Next — la zona gris que dejó
 * [Pósters y streaming en México](../.wayfinder/tickets/002-posters-y-streaming-en-mexico.md).
 */
const BASE_TMDB = "https://image.tmdb.org/t/p";

export type AnchoDePoster = "w185" | "w342";

export function urlDePoster(posterPath: string, ancho: AnchoDePoster): string {
  return `${BASE_TMDB}/${ancho}${posterPath}`;
}

const yaPedidos = new Set<string>();

/**
 * Deja los pósters en la caché del navegador **antes** de que el carrete los
 * pida. [El giro, de verdad](../.wayfinder/tickets/015-el-giro-de-verdad.md) los
 * sacó del carrete porque en una red lenta el giro paraba sobre huecos; con la
 * cartelera calentada de antemano el carrete monta desde caché y el póster
 * dibujado sólo aparece cuando de verdad no hay foto.
 */
export function calentarPosters(
  posterPaths: readonly string[],
  ancho: AnchoDePoster,
): void {
  if (typeof window === "undefined") return;
  for (const posterPath of posterPaths) {
    const url = urlDePoster(posterPath, ancho);
    if (yaPedidos.has(url)) continue;
    yaPedidos.add(url);
    const imagen = new window.Image();
    imagen.decoding = "async";
    imagen.src = url;
  }
}

/** Cede el hilo hasta que el navegador esté ocioso, o al siguiente respiro. */
export function cuandoHayaCalma(tarea: () => void): () => void {
  const conOcio = window as Window & {
    requestIdleCallback?: (tarea: () => void, opciones?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (conOcio.requestIdleCallback) {
    const id = conOcio.requestIdleCallback(tarea, { timeout: 1200 });
    return () => conOcio.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(tarea, 300);
  return () => window.clearTimeout(id);
}
