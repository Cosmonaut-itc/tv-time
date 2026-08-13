import assert from "node:assert/strict";
import test from "node:test";
import { validarTituloDeSala } from "../convex/titulos_logica.ts";

test("marcar o quitar rechaza un título que no pertenece a la sala", () => {
  assert.throws(
    () => validarTituloDeSala({ salaId: "sala-ajena" }, "sala-propia"),
    /El título no pertenece a esta sala\./,
  );
});

test("marcar o quitar acepta un título de la sala", () => {
  assert.doesNotThrow(() =>
    validarTituloDeSala({ salaId: "sala-propia" }, "sala-propia"),
  );
});
