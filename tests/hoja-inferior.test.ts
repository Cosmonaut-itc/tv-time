import assert from "node:assert/strict";
import test from "node:test";
import { debeCerrarHoja, resistirArrastre } from "../app/hoja-inferior-logica.ts";

test("cierra al superar un tercio de la hoja, con tope de 150 px", () => {
  assert.equal(debeCerrarHoja(100, 300, 0), false);
  assert.equal(debeCerrarHoja(101, 300, 0), true);
  assert.equal(debeCerrarHoja(150, 900, 0), false);
  assert.equal(debeCerrarHoja(151, 900, 0), true);
});

test("un impulso hacia abajo cierra sin alcanzar el umbral de distancia", () => {
  assert.equal(debeCerrarHoja(30, 600, 0.51), true);
  assert.equal(debeCerrarHoja(30, 600, 0.5), false);
  assert.equal(debeCerrarHoja(10, 600, 2), false);
  assert.equal(debeCerrarHoja(30, 600, -2), false);
  assert.equal(debeCerrarHoja(-30, 600, 2), false);
});

test("sigue hacia abajo 1:1 y ofrece resistencia acotada hacia arriba", () => {
  assert.equal(resistirArrastre(90), 90);
  assert.equal(resistirArrastre(0), 0);
  assert.ok(resistirArrastre(-70) > -22);
  assert.ok(resistirArrastre(-70) < 0);
  assert.ok(resistirArrastre(-500) >= -22);
});
