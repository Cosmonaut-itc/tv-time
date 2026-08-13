import assert from "node:assert/strict";
import test from "node:test";
import { codigoTieneFormatoValido, normalizarCodigo } from "../convex/codigo.ts";

test("corrige caracteres ambiguos, espacios y mayúsculas antes de buscar", () => {
  assert.equal(normalizarCodigo(" o iL 9rm "), "0119RM");
});

test("sólo acepta seis caracteres del alfabeto acordado", () => {
  assert.equal(codigoTieneFormatoValido("0119RM"), true);
  assert.equal(codigoTieneFormatoValido("OIL9RM"), false);
  assert.equal(codigoTieneFormatoValido("119RM"), false);
});
