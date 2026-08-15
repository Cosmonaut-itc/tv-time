import assert from "node:assert/strict";
import test from "node:test";
import {
  leerLlavero,
  MAXIMO_DEL_LLAVERO,
  nombreDeSala,
  olvidarSala,
  recordarSala,
  type SalaDelLlavero,
} from "../app/llavero-logica.ts";

function sala(salaId: string, titulos = 0): SalaDelLlavero {
  return { salaId, codigo: `COD${salaId}`, butacas: ["Félix", salaId], titulos };
}

test("leerLlavero tolera basura y descarta entradas inválidas", () => {
  assert.deepEqual(leerLlavero(null), []);
  assert.deepEqual(leerLlavero("{"), []);
  assert.deepEqual(leerLlavero("{}"), []);
  assert.deepEqual(leerLlavero(JSON.stringify([sala("1"), { salaId: "2" }])), [sala("1")]);
});

test("recordarSala conserva el sitio del existente y limita el llavero", () => {
  assert.deepEqual(recordarSala([sala("1"), sala("2")], sala("1", 3)), [sala("1", 3), sala("2")]);
  const lleno = Array.from({ length: MAXIMO_DEL_LLAVERO }, (_, indice) => sala(String(indice)));
  assert.deepEqual(recordarSala(lleno, sala("nueva")).map((otra) => otra.salaId), [
    ...lleno.slice(1).map((otra) => otra.salaId),
    "nueva",
  ]);
});

test("olvidarSala elimina por identificador y el nombre une las butacas", () => {
  assert.deepEqual(olvidarSala([sala("1"), sala("2")], "1"), [sala("2")]);
  assert.equal(nombreDeSala(["Félix", "Sofía"]), "Félix y Sofía");
});
