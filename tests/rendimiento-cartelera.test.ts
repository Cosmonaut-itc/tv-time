import assert from "node:assert/strict";
import test from "node:test";
import { derivarCartelera, type TituloDeSala } from "../app/cartelera.ts";
import { CATALOGO_INICIAL } from "../convex/catalogo_inicial.ts";

test("los títulos compartidos conservan su identidad al cambiar de lo que sea a peli", () => {
  const titulos: TituloDeSala[] = CATALOGO_INICIAL.map((titulo, indice) => ({
    ...titulo,
    _id: `titulo-${indice}`,
    visto: false,
  }));
  const opciones = { vetados: new Set<string>() };
  const todos = derivarCartelera(titulos, {
    ...opciones,
    filtro: "loQueSea",
  }).candidatos;
  const peliculas = derivarCartelera(titulos, {
    ...opciones,
    filtro: "pelicula",
  }).candidatos;

  assert.equal(peliculas.length, 13);
  for (const pelicula of peliculas) {
    const compartida = todos.find(({ _id }) => _id === pelicula._id);
    assert.strictEqual(compartida, pelicula);
  }
});
