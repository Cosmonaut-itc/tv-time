/**
 * El telón cerrado, en SVG y a cualquier medida.
 *
 * `pnpm graficos` lo rasteriza para los recursos visuales del proyecto. Uno
 * de esos PNG queda anunciado como mejora opcional en `app/layout.tsx`, sin
 * prometer que iOS lo usará: el iPhone real probado con iOS 26.6 no lo mostró.
 * El fallback controlado es el telón web que el servidor renderiza en el HTML.
 *
 * Aquí no hay texto a propósito: `CINE` escrito exigiría una fuente instalada
 * en la máquina que rasteriza, y el mismo dibujo saldría distinto en una Mac y
 * en el Linux de un CI. El arco de la marquesina es geometría pura, dice lo
 * mismo, y ata el arranque al icono de la pantalla de inicio.
 *
 * Ver .wayfinder/tickets/010-la-sala-instalada.md
 */

const TERCIOPELO = "#12080C";
const PLIEGUE_HONDO = "#2A0B12";
const PLIEGUE_MEDIO = "#5A1826";
const PLIEGUE_ALTO = "#6E2130";

export function telonSVG(ancho: number, alto: number): string {
  // Catorce pliegues de ancho, como en el prototipo, pero sin bajar de un
  // grosor en el que la tela se lea como tela y no como rayas.
  const pliegue = Math.max(24, Math.round(ancho / 14));
  const cenefa = Math.round(alto * 0.07);
  const filo = Math.round(alto * 0.035);
  const juntura = pliegue * 2;

  // El arco al pie: el mismo de app/icon.svg, a escala y sin su terciopelo.
  const arco = Math.round(ancho * 0.17);
  const arcoX = ancho / 2;
  const arcoY = Math.round(alto * 0.88);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
  <defs>
    <linearGradient id="tela" x1="0" y1="0" x2="${pliegue}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${PLIEGUE_HONDO}"/>
      <stop offset="34%" stop-color="${PLIEGUE_MEDIO}"/>
      <stop offset="50%" stop-color="${PLIEGUE_ALTO}"/>
      <stop offset="66%" stop-color="${PLIEGUE_MEDIO}"/>
      <stop offset="100%" stop-color="${PLIEGUE_HONDO}"/>
    </linearGradient>
    <pattern id="pliegues" x="0" y="0" width="${pliegue}" height="${alto}" patternUnits="userSpaceOnUse">
      <rect width="${pliegue}" height="${alto}" fill="url(#tela)"/>
    </pattern>
    <linearGradient id="juntura" x1="${ancho / 2 - pliegue}" y1="0" x2="${ancho / 2 + pliegue}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="50%" stop-color="#000" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="penumbra" cx="${ancho / 2}" cy="${alto * 0.44}" r="${alto * 0.62}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#000" stop-opacity="0.1"/>
      <stop offset="55%" stop-color="#000" stop-opacity="0.52"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
    </radialGradient>
    <linearGradient id="cenefa" x1="0" y1="0" x2="0" y2="${cenefa}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${PLIEGUE_ALTO}"/>
      <stop offset="100%" stop-color="#3B1019"/>
    </linearGradient>
    <linearGradient id="velo" x1="0" y1="0" x2="0" y2="${cenefa}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#000" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="filo" x1="0" y1="${cenefa}" x2="0" y2="${cenefa + filo}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#000" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="laton" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E8CE86"/>
      <stop offset="55%" stop-color="#C9A227"/>
      <stop offset="100%" stop-color="#8A6E18"/>
    </linearGradient>
  </defs>

  <rect width="${ancho}" height="${alto}" fill="${TERCIOPELO}"/>
  <rect width="${ancho}" height="${alto}" fill="url(#pliegues)"/>

  <!-- donde se juntan las dos mitades: esta sombra es lo que dice «cerrado» -->
  <rect x="${ancho / 2 - pliegue}" y="0" width="${juntura}" height="${alto}" fill="url(#juntura)"/>

  <!-- la sala está a oscuras: la luz sólo llega al centro y los bordes se
       funden con el terciopelo del theme_color -->
  <rect width="${ancho}" height="${alto}" fill="url(#penumbra)"/>

  <rect width="${ancho}" height="${cenefa}" fill="url(#cenefa)"/>
  <rect width="${ancho}" height="${cenefa}" fill="url(#velo)"/>
  <rect y="${cenefa}" width="${ancho}" height="${filo}" fill="url(#filo)"/>

  <g transform="translate(${arcoX} ${arcoY}) scale(${arco / 512})" opacity="0.85">
    <g transform="translate(-256 -256)">
      <path d="M 96 352 A 160 160 0 0 1 416 352" fill="none" stroke="url(#laton)" stroke-width="40"/>
      <rect x="74" y="336" width="364" height="34" rx="6" fill="url(#laton)"/>
      <circle cx="95" cy="259" r="25" fill="#F6E7B0"/>
      <circle cx="256" cy="166" r="25" fill="#F6E7B0"/>
      <circle cx="417" cy="259" r="25" fill="#F6E7B0"/>
    </g>
  </g>
</svg>`;
}

/**
 * Medidas heredadas que `pnpm graficos` puede rasterizar para investigación.
 *
 * `ancho`/`alto` van en puntos CSS — los que evalúa la media query, **no** los
 * que reporta `screen` en Safari: en un 17 Pro Max, `screen` dice 414 × 896
 * (las medidas de un 11 Pro Max) mientras CSS ve los 440 × 956 de verdad. Ese
 * desacuerdo hizo fallar el primer intento.
 *
 * Esta matriz no declara compatibilidad de `apple-touch-startup-image`.
 */
export const APARATOS = [
  { ancho: 440, alto: 956, dpr: 3, modelos: "17 Pro Max · 16 Pro Max" },
  { ancho: 420, alto: 912, dpr: 3, modelos: "17 Pro · 16e" },
  { ancho: 402, alto: 874, dpr: 3, modelos: "16 Pro" },
  { ancho: 430, alto: 932, dpr: 3, modelos: "15 Pro Max · 14 Pro Max · 16 Plus" },
  { ancho: 393, alto: 852, dpr: 3, modelos: "15 Pro · 14 Pro · 15 · 16" },
  { ancho: 428, alto: 926, dpr: 3, modelos: "12/13 Pro Max · 14 Plus" },
  { ancho: 390, alto: 844, dpr: 3, modelos: "12 · 13 · 14" },
  { ancho: 375, alto: 812, dpr: 3, modelos: "X · XS · 11 Pro · 13 mini" },
  { ancho: 414, alto: 896, dpr: 3, modelos: "XS Max · 11 Pro Max" },
  { ancho: 414, alto: 896, dpr: 2, modelos: "XR · 11" },
  { ancho: 375, alto: 667, dpr: 2, modelos: "SE 2 · SE 3 · 8" },
] as const;

export function rutaTelon(ancho: number, alto: number, dpr: number): string {
  return `/telon/${ancho * dpr}x${alto * dpr}.jpg`;
}
