import assert from "node:assert/strict";
import test from "node:test";
import { debeOlvidarCodigo } from "../app/entrada-sala-logica.ts";

test("sólo una sala cerrada borra el código recordado", () => {
  assert.equal(debeOlvidarCodigo("cerrada"), true);
  assert.equal(debeOlvidarCodigo("trabada"), false);
  assert.equal(debeOlvidarCodigo("abierta"), false);
});
