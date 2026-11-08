import assert from "node:assert/strict";
import test from "node:test";
import { derivarCartelera } from "../convex/cartelera.ts";
import {
  cambioAlDeshacerFuncion,
  validarTituloDelCatalogo,
  esPrimeraFuncion,
  idsYaVistosSinFuncion,
  siguienteDeSaga,
  validarEnCartelera,
  validarTituloParaFuncion,
} from "../convex/funciones_logica.ts";

/** Una saga de dos y una suelta, que es lo mínimo para ver el candado. */
const CATALOGO = [
  { _id: "duna-1", tipo: "pelicula" as const, nombre: "Duna", saga: "Duna", orden: 1, visto: false },
  { _id: "duna-2", tipo: "pelicula" as const, nombre: "Duna: Parte Dos", saga: "Duna", orden: 2, visto: false },
  { _id: "suelta", tipo: "pelicula" as const, nombre: "Soul", visto: false },
];

function carteleraDeLaNoche(vetados: string[] = []) {
  return derivarCartelera(CATALOGO, {
    filtro: "loQueSea",
    vetados: new Set(vetados),
  }).candidatos;
}

test("la mutación no cierra función sobre una saga todavía bloqueada", () => {
  assert.throws(
    () => validarEnCartelera(carteleraDeLaNoche(), "duna-2"),
    /Ese título no está en la cartelera de esta noche\./,
  );
});

test("la mutación no cierra función sobre algo vetado esta noche", () => {
  assert.throws(
    () => validarEnCartelera(carteleraDeLaNoche(["suelta"]), "suelta"),
    /Ese título no está en la cartelera de esta noche\./,
  );
});

test("lo que sí está en la cartelera pasa sin ruido", () => {
  assert.doesNotThrow(() => validarEnCartelera(carteleraDeLaNoche(), "duna-1"));
  assert.doesNotThrow(() => validarEnCartelera(carteleraDeLaNoche(), "suelta"));
});

test("rechaza un título ajeno a la sala", () => {
  assert.throws(
    () =>
      validarTituloParaFuncion(
        { salaId: "sala-ajena", visto: false },
        "sala-propia",
      ),
    /El título no pertenece a esta sala\./,
  );
});

test("rechaza un título que ya salió de la cartelera", () => {
  assert.throws(
    () =>
      validarTituloParaFuncion(
        { salaId: "sala-propia", visto: true },
        "sala-propia",
      ),
    /Ese título ya salió de la cartelera\./,
  );
});

test("detecta la primera función con el recorte acotado de filas", () => {
  assert.equal(esPrimeraFuncion(1), true);
  assert.equal(esPrimeraFuncion(2), false);
});

test("resuelve el siguiente título inmediato de la saga", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: "Duna", orden: 1 },
      [
        { nombre: "Duna", saga: "Duna", orden: 1, visto: true },
        { nombre: "Duna: Parte Dos", saga: "Duna", orden: 2, visto: false },
        { nombre: "Duna: Parte Tres", saga: "Duna", orden: 3, visto: false },
      ],
    ),
    "Duna: Parte Dos",
  );
});

test("un título sin saga no desbloquea otro", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: undefined, orden: undefined },
      [{ nombre: "Otra", saga: "Otra saga", orden: 2, visto: false }],
    ),
    null,
  );
});

test("una siguiente ya vista no se anuncia como desbloqueada", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: "Duna", orden: 1 },
      [
        { nombre: "Duna: Parte Dos", saga: "Duna", orden: 2, visto: true },
        { nombre: "Duna: Parte Tres", saga: "Duna", orden: 3, visto: false },
      ],
    ),
    null,
  );
});

test("sin el orden inmediatamente superior no anuncia otro salto de saga", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: "Duna", orden: 1 },
      [{ nombre: "Duna: Parte Tres", saga: "Duna", orden: 3, visto: false }],
    ),
    null,
  );
});

test("el historial separa las funciones de los vistos sin fecha", () => {
  assert.deepEqual(
    idsYaVistosSinFuncion(
      [
        { _id: "con-funcion", visto: true },
        { _id: "ya-vista", visto: true },
        { _id: "cartelera", visto: false },
      ],
      [{ tituloId: "con-funcion" }],
    ),
    ["ya-vista"],
  );
});

test("desde el catálogo acepta títulos vistos, sin ver, bloqueados o vetados", () => {
  for (const visto of [false, true]) {
    const titulo = { salaId: "propia", visto, saga: "Duna", orden: 2, vetado: true };
    assert.doesNotThrow(() => validarTituloDelCatalogo(titulo, "propia"));
  }
});

test("desde el catálogo rechaza títulos inexistentes o de otra sala", () => {
  assert.throws(() => validarTituloDelCatalogo(null, "propia"), /no pertenece/);
  assert.throws(() => validarTituloDelCatalogo({ salaId: "ajena", visto: true }, "propia"), /no pertenece/);
});

test("deshacer devuelve a sin ver sólo cuando la función lo encontró sin ver", () => {
  assert.deepEqual(cambioAlDeshacerFuncion({ salaId: "propia", vistoAntes: false }, "propia", false), { visto: false });
  assert.equal(cambioAlDeshacerFuncion({ salaId: "propia", vistoAntes: true }, "propia", false), null);
  assert.equal(cambioAlDeshacerFuncion({ salaId: "propia" }, "propia", false), null);
});

test("deshacer deja visto el título si otra función suya sigue en el historial", () => {
  assert.equal(cambioAlDeshacerFuncion({ salaId: "propia", vistoAntes: false }, "propia", true), null);
});

test("deshacer es idempotente y no permite borrar funciones ajenas", () => {
  assert.equal(cambioAlDeshacerFuncion(null, "propia", false), null);
  assert.throws(() => cambioAlDeshacerFuncion({ salaId: "ajena", vistoAntes: false }, "propia", false), /La función no pertenece/);
});
