import assert from "node:assert/strict";
import test from "node:test";
import { advertenciaTrasGuardarCodigo } from "../app/cabina-logica.ts";

test("la cabina sólo advierte cuando el navegador no guardó el código nuevo", () => {
  assert.equal(advertenciaTrasGuardarCodigo(true), null);
  assert.equal(
    advertenciaTrasGuardarCodigo(false),
    "Este navegador no pudo guardar el código nuevo. Anótenlo antes de cerrar.",
  );
});
