import assert from "node:assert/strict";
import test from "node:test";
import { esLaSalaDeLaCasa } from "../app/firma-logica.ts";

test("reconoce la sala de la casa en cualquier orden y con cualquier capitalización", () => {
  assert.equal(esLaSalaDeLaCasa(["Félix", "Sofía"]), true);
  assert.equal(esLaSalaDeLaCasa(["sofía", "FÉLIX"]), true);
  assert.equal(esLaSalaDeLaCasa(["Sofía", "fÉlIx"]), true);
});

// Escritos con escapes a propósito: en el archivo se verían idénticos a los de
// arriba. Una sala guardada antes de que la taquilla normalizara a NFC trae los
// acentos sueltos, y sin limpiarlos la casa dejaría de reconocerse a sí misma.
const FELIX_DESCOMPUESTO = "Fe\u0301lix";
const SOFIA_DESCOMPUESTA = "Sofi\u0301a";

test("reconoce sus butacas aunque vengan con los acentos sueltos", () => {
  assert.equal(esLaSalaDeLaCasa([FELIX_DESCOMPUESTO, SOFIA_DESCOMPUESTA]), true);
  assert.equal(esLaSalaDeLaCasa([SOFIA_DESCOMPUESTA, "Félix"]), true);
});

test("no firma otra sala ni una lista que no trae exactamente los dos nombres", () => {
  assert.equal(esLaSalaDeLaCasa(["Ana", "Bruno"]), false);
  assert.equal(esLaSalaDeLaCasa(["Félix"]), false);
  assert.equal(esLaSalaDeLaCasa(["Félix", "Sofía", "Ana"]), false);
});
