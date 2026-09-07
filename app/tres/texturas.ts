import * as THREE from "three";
import type { TituloDeSala } from "../cartelera.ts";
import { urlDePoster, type AnchoDePoster } from "../posters.ts";
import { renglonesDeTitulo } from "../poster-crudo-logica.ts";
import { CELDAS } from "./medidas.ts";

export const PILA_DISPLAY = '"Copperplate","Copperplate Gothic Light","Futura","Century Gothic","Trebuchet MS","Cinzel",sans-serif';

/** Cada lienzo cancela sus suscripciones al liberarse su textura. */
export type LienzoConFotos = {
  lienzo: HTMLCanvasElement;
  alLlegar(cb: () => void): () => void;
  destruir(): void;
};

export function texturaDe(fuente: HTMLCanvasElement | LienzoConFotos, repetir = false): THREE.CanvasTexture {
  const lienzo = "lienzo" in fuente ? fuente.lienzo : fuente;
  const compuesto = "lienzo" in fuente ? fuente : null;
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.wrapS = repetir ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.anisotropy = 1;
  if (compuesto) {
    const quitar = compuesto.alLlegar(() => { t.needsUpdate = true; });
    const alLiberar = () => {
      quitar();
      compuesto.destruir();
      t.removeEventListener("dispose", alLiberar);
    };
    t.addEventListener("dispose", alLiberar);
  }
  return t;
}

export function lienzoRadial(paradas: readonly (readonly [number, string])[], lado = 128): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = lado;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(lado / 2, lado / 2, 0, lado / 2, lado / 2, lado / 2);
  paradas.forEach(([p, color]) => g.addColorStop(p, color));
  x.fillStyle = g;
  x.fillRect(0, 0, lado, lado);
  return c;
}

/* Fábricas perezosas: importar este módulo no necesita DOM. Cada módulo
   visual posee su textura radial y la libera al destruirse. */
export function TEX_HALO(): THREE.CanvasTexture {
  return texturaDe(lienzoRadial([
    [0, 'rgba(255,233,168,1)'], [0.28, 'rgba(255,214,120,0.55)'],
    [0.62, 'rgba(201,162,39,0.16)'], [1, 'rgba(201,162,39,0)'],
  ]));
}

export function TEX_POLVO(): THREE.CanvasTexture {
  return texturaDe(lienzoRadial([
    [0, 'rgba(242,229,198,1)'], [0.45, 'rgba(242,229,198,0.35)'], [1, 'rgba(242,229,198,0)'],
  ], 32));
}

/** Réplica del SVG PosterCrudo, en su espacio de 300 × 450. */
export function dibujarPosterCrudo(ctx: CanvasRenderingContext2D, titulo: TituloDeSala, ancho: number, alto: number): void {
  ctx.save();
  ctx.scale(ancho / 300, alto / 450);
  ctx.fillStyle = "#1E1014";
  ctx.fillRect(0, 0, 300, 450);
  ctx.beginPath();
  ctx.arc(150, 175, 82, 0, Math.PI * 2);
  ctx.strokeStyle = "#C9A227";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(52, 330);
  ctx.lineTo(248, 330);
  ctx.strokeStyle = "#8A6F1C";
  ctx.lineWidth = 3;
  ctx.stroke();
  const renglones = renglonesDeTitulo(titulo.nombre);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#F2E5C6";
  ctx.font = '18px "Optima", "Avenir Next", "Futura", "Segoe UI", system-ui, sans-serif';
  renglones.forEach((renglon, indice) => ctx.fillText(renglon, 150, 358 + indice * 23));
  if (titulo.anio) {
    ctx.fillStyle = "#9A8E75";
    ctx.font = '14px "Optima", "Avenir Next", "Futura", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(String(titulo.anio), 150, 358 + renglones.length * 23 + 7);
  }
  ctx.restore();
}

const imagenes = new Map<string, HTMLImageElement>();

export function vaciarImagenes(): void {
  imagenes.clear();
}

function urlConCORS(url: string): string {
  // Evita la caché envenenada por respuestas sin Origin: el CDN no manda Vary: Origin.
  return `${url}${url.includes("?") ? "&" : "?"}cors=1`;
}

function pedirImagen(url: string): HTMLImageElement {
  url = urlConCORS(url);
  const guardada = imagenes.get(url);
  if (guardada) return guardada;
  const imagen = new Image();
  imagen.crossOrigin = "anonymous";
  imagen.decoding = "async";
  imagen.addEventListener("error", () => {
    // Una carga antigua expulsada no debe borrar su reemplazo.
    if (imagenes.get(url) === imagen) imagenes.delete(url);
  }, { once: true });
  imagenes.set(url, imagen);
  if (imagenes.size > 96) {
    const primera = imagenes.keys().next().value;
    if (primera !== undefined) imagenes.delete(primera);
  }
  imagen.src = url;
  return imagen;
}

export function calentarPosters3D(titulos: readonly TituloDeSala[]): void {
  if (typeof Image === "undefined") return;
  titulos.forEach((titulo) => {
    if (titulo.posterPath) pedirImagen(urlDePoster(titulo.posterPath, "w185"));
  });
}

/** El dibujo crudo siempre está listo; una foto tardía sólo repinta su celda. */
function conFotos(lienzo: HTMLCanvasElement, titulos: readonly TituloDeSala[], ancho: AnchoDePoster,
  pintar: (indice: number, imagen?: HTMLImageElement) => void): LienzoConFotos {
  const avisos = new Set<() => void>();
  const pendientes = new Set<() => void>();
  let destruido = false;
  titulos.forEach((titulo, indice) => {
    pintar(indice);
    if (!titulo.posterPath) return;
    const imagen = pedirImagen(urlDePoster(titulo.posterPath, ancho));
    if (imagen.complete) {
      if (imagen.naturalWidth > 0) pintar(indice, imagen);
      return;
    }
    const quitar = () => {
      imagen.removeEventListener("load", cargar);
      imagen.removeEventListener("error", fallar);
      pendientes.delete(quitar);
    };
    const cargar = () => {
      quitar();
      if (destruido) return;
      pintar(indice, imagen);
      avisos.forEach((cb) => cb());
    };
    const fallar = () => { quitar(); }; // El dibujo queda; no se registra un error.
    pendientes.add(quitar);
    imagen.addEventListener("load", cargar);
    imagen.addEventListener("error", fallar);
  });
  return {
    lienzo,
    alLlegar(cb) {
      if (!destruido) avisos.add(cb);
      return () => { avisos.delete(cb); };
    },
    destruir() {
      destruido = true;
      pendientes.forEach((quitar) => quitar());
      avisos.clear();
    },
  };
}

/* Los pósters entran girados un cuarto de vuelta en el cilindro horizontal. */
export function lienzoTira(celdas: readonly TituloDeSala[]): LienzoConFotos {
  const celdaAncho = 384, celdaAlto = 256;
  const c = document.createElement('canvas');
  c.width = celdaAncho * CELDAS;
  c.height = celdaAlto;
  const x = c.getContext('2d')!;
  x.fillStyle = '#050204';
  x.fillRect(0, 0, c.width, c.height);
  const titulos = celdas.length ? Array.from({ length: CELDAS }, (_, i) => celdas[i % celdas.length]) : [];
  return conFotos(c, titulos, "w185", (i, imagen) => {
    x.save();
    x.translate(i * celdaAncho + celdaAncho, 0);
    x.rotate(Math.PI / 2);
    dibujarPosterCrudo(x, titulos[i], celdaAlto, celdaAncho);
    if (imagen) x.drawImage(imagen, 0, 0, celdaAlto, celdaAncho);
    x.restore();
  });
}

export function lienzoPoster(titulo: TituloDeSala): LienzoConFotos {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 384;
  const x = c.getContext('2d')!;
  return conFotos(c, [titulo], "w342", (_, imagen) => {
    dibujarPosterCrudo(x, titulo, c.width, c.height);
    if (imagen) x.drawImage(imagen, 0, 0, c.width, c.height);
  });
}

export function textoEspaciado(c: CanvasRenderingContext2D, texto: string, x: number, y: number, espaciado: number): void {
  const anchos = [...texto].map((ch) => c.measureText(ch).width);
  const total = anchos.reduce((a, b) => a + b, 0) + espaciado * (texto.length - 1);
  let cursor = x - total / 2;
  [...texto].forEach((ch, i) => {
    c.fillText(ch, cursor, y);
    cursor += anchos[i] + espaciado;
  });
}
