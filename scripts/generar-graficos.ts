// Rasteriza los dos dibujos de la sala desde su única fuente:
//
//   pnpm graficos
//
//   · el icono, desde app/icon.svg
//   · el telón de arranque, desde app/telon.ts, uno por iPhone de la tabla
//
// Se corre a mano cuando cambia el dibujo, no en cada build: las imágenes viven
// en el repo para que el manifest y el <head> las pidan por una ruta fija, sin
// hash ni cómputo en producción.
//
// sharp entra por ruta directa al store de pnpm: es una dependencia transitiva
// de Next, no una nuestra, y no queremos declararla sólo para esto.

import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { APARATOS, telonSVG } from "../app/telon.ts";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

async function cargarSharp() {
  const store = join(raiz, "node_modules/.pnpm");
  const entradas = await readdir(store);
  const carpeta = entradas.find((n) => n.startsWith("sharp@"));
  if (!carpeta) {
    throw new Error(
      "No encontré sharp en node_modules/.pnpm. Corre `pnpm install` primero."
    );
  }
  return require(join(store, carpeta, "node_modules/sharp"));
}

const sharp = await cargarSharp();

async function escribir(ruta: string, datos: Buffer, nota = "") {
  const salida = join(raiz, ruta);
  await mkdir(dirname(salida), { recursive: true });
  await writeFile(salida, datos);
  console.log(
    `${ruta.padEnd(34)} ${(datos.length / 1024).toFixed(0).padStart(5)} KB  ${nota}`
  );
}

// ── El icono ────────────────────────────────────────────────────────────────
// 180 es el apple-touch-icon que iOS usa en la pantalla de inicio; 192 y 512
// los pide el manifest; 1024 es el que quiere cualquier generador futuro.

const icono = await readFile(join(raiz, "app/icon.svg"));

for (const { px, ruta } of [
  { px: 180, ruta: "app/apple-icon.png" },
  { px: 192, ruta: "public/icono/cine-192.png" },
  { px: 512, ruta: "public/icono/cine-512.png" },
  { px: 1024, ruta: "public/icono/cine-1024.png" },
]) {
  const png = await sharp(icono, { density: 384 })
    .resize(px, px, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await escribir(ruta, png, `${px}×${px}`);
}

// ── El telón ────────────────────────────────────────────────────────────────
// JPEG y no PNG: es todo degradado, así que comprime como una fotografía. En
// PNG el telón del 17 Pro Max pesaba 4.3 MB; en JPEG pesa una fracción y no se
// distingue a simple vista.

await rm(join(raiz, "public/telon"), { recursive: true, force: true });

const hechos = new Set<string>();

for (const { ancho, alto, dpr, modelos } of APARATOS) {
  const px = { w: ancho * dpr, h: alto * dpr };
  const ruta = `public/telon/${px.w}x${px.h}.jpg`;
  // Dos modelos pueden compartir resolución en píxeles con distinta media
  // query: la imagen se fabrica una vez y los dos links la apuntan.
  if (hechos.has(ruta)) continue;
  hechos.add(ruta);

  const jpg = await sharp(Buffer.from(telonSVG(px.w, px.h)))
    .jpeg({ quality: 82, chromaSubsampling: "4:4:4" })
    .toBuffer();
  await escribir(ruta, jpg, `${px.w}×${px.h}  ${modelos}`);
}

// El comodín, para cualquier iPhone que no esté en la tabla: la resolución más
// grande que existe hoy, que iOS escala.
const comodin = await sharp(Buffer.from(telonSVG(1320, 2868)))
  .jpeg({ quality: 82, chromaSubsampling: "4:4:4" })
  .toBuffer();
await escribir("public/telon/comodin.jpg", comodin, "sin media query");
