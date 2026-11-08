import assert from "node:assert/strict";
import test from "node:test";
import { calificarTitulo } from "../convex/titulos_logica.ts";

const base = { visto: true, butacas: ["Ana", "Luis"], butaca: "Ana", estrellas: 4 };

test("calificar agrega una voz y reemplaza sólo la de esa butaca", () => {
  assert.deepEqual(calificarTitulo(base), [{ butaca: "Ana", estrellas: 4 }]);
  const calificaciones = [{ butaca: "Ana", estrellas: 2 }, { butaca: "Luis", estrellas: 5 }];
  assert.deepEqual(calificarTitulo({ ...base, calificaciones }), [calificaciones[1], { butaca: "Ana", estrellas: 4 }]);
  assert.equal(calificaciones[0].estrellas, 2);
});

test("cero borra la voz sin afectar la otra butaca y se puede repetir", () => {
  const otra = { butaca: "Luis", estrellas: 3 };
  assert.deepEqual(calificarTitulo({ ...base, estrellas: 0, calificaciones: [{ butaca: "Ana", estrellas: 5 }, otra] }), [otra]);
  assert.deepEqual(calificarTitulo({ ...base, estrellas: 0 }), []);
});

test("rechaza una butaca ajena y títulos sin ver", () => {
  assert.throws(() => calificarTitulo({ ...base, butaca: "Félix" }), /butaca/);
  assert.throws(() => calificarTitulo({ ...base, visto: false }), /vistos/);
  assert.throws(() => calificarTitulo({ ...base, visto: false, estrellas: 0 }), /vistos/);
});

test("las estrellas son enteros entre cero y cinco", () => {
  for (const estrellas of [-1, 6, 2.5, NaN, Infinity]) {
    assert.throws(() => calificarTitulo({ ...base, estrellas }), /entero/);
  }
  assert.equal(calificarTitulo({ ...base, estrellas: 1 })[0].estrellas, 1);
  assert.equal(calificarTitulo({ ...base, estrellas: 5 })[0].estrellas, 5);
});
