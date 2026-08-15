import assert from "node:assert/strict";
import test from "node:test";
import { renglonesDeTitulo } from "../app/poster-crudo-logica.ts";

test("el póster dibujado parte el nombre por palabra, nunca a media letra", () => {
  assert.deepEqual(renglonesDeTitulo("Soul"), ["SOUL"]);
  assert.deepEqual(renglonesDeTitulo("Cómo entrenar a tu dragón"), [
    "CÓMO ENTRENAR A TU",
    "DRAGÓN",
  ]);
});

test("lo que no cabe en dos renglones se admite con puntos suspensivos", () => {
  const renglones = renglonesDeTitulo(
    "El señor de los anillos: el retorno del rey",
  );
  assert.equal(renglones.length, 2);
  assert.ok(renglones.every((renglon) => renglon.length <= 22));
  assert.ok(renglones[1].endsWith("…"));
});

test("un título sin nombre no dibuja renglones", () => {
  assert.deepEqual(renglonesDeTitulo("   "), []);
});
