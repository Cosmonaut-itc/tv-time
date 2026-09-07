import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { calentarPosters3D, lienzoTira, lienzoPoster, texturaDe } from "../app/tres/texturas.ts";
import type { TituloDeSala } from "../app/cartelera.ts";
import { urlDePoster } from "../app/posters.ts";

/** Dobles de las fronteras del navegador; las texturas son CanvasTexture reales. */
class Imagen extends EventTarget {
  static creadas: Imagen[] = [];
  src = "";
  crossOrigin = "";
  decoding = "";
  complete = false;
  naturalWidth = 0;
  constructor() { super(); Imagen.creadas.push(this); }
  cargar() { this.complete = true; this.naturalWidth = 185; this.dispatchEvent(new Event("load")); }
  fallar() { this.complete = true; this.dispatchEvent(new Event("error")); }
}

function crearLienzo() {
  const fotos: unknown[][] = [];
  const textos: [string, number, number][] = [];
  const contexto = {
    save() {}, restore() {}, scale() {}, translate() {}, rotate() {},
    fillRect() {}, beginPath() {}, arc() {}, stroke() {}, moveTo() {}, lineTo() {},
    drawImage(...args: unknown[]) { fotos.push(args); },
    fillText(texto: string, x: number, y: number) { textos.push([texto, x, y]); },
  };
  return { width: 0, height: 0, fotos, textos, getContext() { return contexto; } };
}

function instalarDOM(t: TestContext, lienzos: ReturnType<typeof crearLienzo>[]) {
  const valores = {
    Image: Imagen,
    document: { createElement() { const c = crearLienzo(); lienzos.push(c); return c; } },
  };
  for (const [nombre, valor] of Object.entries(valores)) {
    const anterior = Object.getOwnPropertyDescriptor(globalThis, nombre);
    Object.defineProperty(globalThis, nombre, { value: valor, configurable: true });
    t.after(() => {
      if (anterior) Object.defineProperty(globalThis, nombre, anterior);
      else Reflect.deleteProperty(globalThis, nombre);
    });
  }
}

const titulo = (id: string, posterPath?: string): TituloDeSala => ({
  _id: id, nombre: "Soul", tipo: "pelicula", visto: false, anio: 2020, posterPath,
});

test("precalentar omite rutas ausentes y nulas y comparte la foto con la tira", (t) => {
  instalarDOM(t, []);
  const sinRuta = titulo("sin-ruta");
  const rutaNula = titulo("ruta-nula");
  // El contrato admite undefined; comprobamos además null recibido en ejecución.
  Reflect.set(rutaNula, "posterPath", null);
  const conRuta = titulo("con-ruta", "/precalentado-nulos.jpg");
  const cantidad = Imagen.creadas.length;
  calentarPosters3D([sinRuta, rutaNula, conRuta, conRuta]);
  assert.equal(Imagen.creadas.length, cantidad + 1);
  assert.equal(Imagen.creadas.at(-1)!.src, "https://image.tmdb.org/t/p/w185/precalentado-nulos.jpg?cors=1");
  const tira = lienzoTira([sinRuta, rutaNula, conRuta]);
  t.after(() => tira.destruir());
  assert.equal(Imagen.creadas.length, cantidad + 1, "la tira usa la misma petición precalentada");
});

test("la tira separa la URL CORS y reutiliza la misma imagen entre peticiones", (t) => {
  const lienzos: ReturnType<typeof crearLienzo>[] = [];
  instalarDOM(t, lienzos);
  const posterPath = "/tres-prueba-cors.jpg";
  const a = titulo("cors", posterPath);
  const primera = lienzoTira([a]);
  t.after(() => primera.destruir());
  const imagen = Imagen.creadas.at(-1)!;
  const url = urlDePoster(posterPath, "w185");
  assert.notEqual(imagen.src, url);
  assert.ok(imagen.src.startsWith(url));
  assert.equal(imagen.crossOrigin, "anonymous");
  imagen.cargar();
  const cantidad = Imagen.creadas.length;
  const segunda = lienzoTira([a]);
  t.after(() => segunda.destruir());
  assert.equal(Imagen.creadas.length, cantidad);
  assert.equal(lienzos[0].fotos[0][0], imagen);
  assert.equal(lienzos[1].fotos[0][0], imagen);
});

test("el póster crudo da paso a la foto tardía y dispose desconecta la carga", (t) => {
  const lienzos: ReturnType<typeof crearLienzo>[] = [];
  instalarDOM(t, lienzos);
  const a = titulo("foto", "/tres-prueba-carga.jpg");
  calentarPosters3D([a, a]);
  const imagen = Imagen.creadas.at(-1)!;
  assert.equal(imagen.crossOrigin, "anonymous");
  assert.equal(imagen.decoding, "async");
  assert.equal(imagen.src, "https://image.tmdb.org/t/p/w185/tres-prueba-carga.jpg?cors=1");
  const cantidad = Imagen.creadas.length;
  const tira = texturaDe(lienzoTira([a]), true);
  assert.equal(Imagen.creadas.length, cantidad, "la tira reutiliza la imagen calentada");
  assert.equal(lienzos[0].fotos.length, 0);
  assert.deepEqual(lienzos[0].textos.slice(0, 2), [["SOUL", 150, 358], ["2020", 150, 388]]);
  const version = tira.version;
  imagen.cargar();
  assert.equal(lienzos[0].fotos.length, 8);
  assert.ok(tira.version > version, "la llegada invalida la textura GPU");
  tira.dispose();

  const ganador = texturaDe(lienzoPoster(titulo("ganador", "/tres-prueba-ganador.jpg")));
  const pendiente = Imagen.creadas.at(-1)!;
  assert.ok(pendiente.src.includes("/w342/"));
  assert.ok(pendiente.src.endsWith("?cors=1"));
  const versionGanador = ganador.version;
  ganador.dispose();
  pendiente.cargar();
  assert.equal(lienzos[1].fotos.length, 0);
  assert.equal(ganador.version, versionGanador);
});

test("una foto fallida conserva el dibujo y una foto en caché se pinta al montar", (t) => {
  const lienzos: ReturnType<typeof crearLienzo>[] = [];
  instalarDOM(t, lienzos);
  const a = titulo("fallida", "/tres-prueba-error.jpg");
  const textura = texturaDe(lienzoTira([a]));
  const version = textura.version;
  Imagen.creadas.at(-1)!.fallar();
  assert.equal(lienzos[0].fotos.length, 0);
  assert.equal(textura.version, version);
  assert.equal(lienzos[0].textos.length, 16);
  textura.dispose();
  const b = titulo("lista", "/tres-prueba-cache.jpg");
  calentarPosters3D([b]);
  Imagen.creadas.at(-1)!.cargar();
  const lista = texturaDe(lienzoTira([b]));
  assert.equal(lienzos[1].fotos.length, 8);
  lista.dispose();
});

 test("la caché conserva las últimas 96 imágenes y expulsa la primera", (t) => {
  instalarDOM(t, []);
  const titulos = Array.from({ length: 97 }, (_, i) => titulo(String(i), `/limite-${i}.jpg`));
  calentarPosters3D(titulos);
  const cantidad = Imagen.creadas.length;
  calentarPosters3D(titulos.slice(1));
  assert.equal(Imagen.creadas.length, cantidad, "las 96 últimas siguen guardadas");
  calentarPosters3D([titulos[0]]);
  assert.equal(Imagen.creadas.length, cantidad + 1, "la primera se vuelve a pedir");
});

 test("una carga fallida se vuelve a pedir", (t) => {
  instalarDOM(t, []);
  const pelicula = titulo("reintento", "/reintento.jpg");
  calentarPosters3D([pelicula]);
  Imagen.creadas.at(-1)!.fallar();
  const cantidad = Imagen.creadas.length;
  calentarPosters3D([pelicula]);
  assert.equal(Imagen.creadas.length, cantidad + 1);
});

test("vaciar imágenes obliga a pedirlas de nuevo", async (t) => {
  instalarDOM(t, []);
  const { vaciarImagenes } = await import("../app/tres/texturas.ts");
  const pelicula = titulo("vaciar", "/vaciar.jpg");
  calentarPosters3D([pelicula]);
  const cantidad = Imagen.creadas.length;
  vaciarImagenes();
  calentarPosters3D([pelicula]);
  assert.equal(Imagen.creadas.length, cantidad + 1);
});
