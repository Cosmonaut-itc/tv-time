import assert from "node:assert/strict";
import test from "node:test";
import * as sala from "../app/tres/sala.ts";

test("sustituir y retirar fichas libera las observaciones anteriores", () => {
  const observados: Element[] = [];
  const retirados: Element[] = [];
  const observador = {
    observe(elemento: Element) { observados.push(elemento); },
    unobserve(elemento: Element) { retirados.push(elemento); },
  };
  const actualizar = sala.crearObservacionFicha(observador);
  const capa = {} as Element, ficha = {} as Element;
  const nuevaCapa = {} as Element, nuevaFicha = {} as Element;
  actualizar(capa, ficha);
  actualizar(capa, ficha);
  assert.equal(observados.length, 2);
  actualizar(capa, nuevaFicha);
  assert.deepEqual(retirados, [ficha]);
  actualizar(nuevaCapa, nuevaFicha);
  assert.deepEqual(retirados, [ficha, capa]);
  actualizar(null, null);
  assert.deepEqual(retirados, [ficha, capa, nuevaCapa, nuevaFicha]);
  assert.equal(observados.length, 4);
  actualizar(null, null);
  assert.equal(retirados.length, 4);
});
