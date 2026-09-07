import assert from "node:assert/strict";
import test from "node:test";
import { faseDeLaSala3D, puedeArrancar, tamboresQuietos, debeMontarTambores } from "../app/escenario-3d-logica.ts";

test("traduce las fases de la cartelera al contrato 3D", () => {
  assert.equal(faseDeLaSala3D("función"), "funcion");
  assert.equal(faseDeLaSala3D("vuelta vacía"), "reposo");
  for (const fase of ["reposo", "conteo", "girando", "finalistas", "ganador", "vetando"] as const) {
    assert.equal(faseDeLaSala3D(fase), fase);
  }
});

test("el arranque espera una fase segura y el final de la ocupación", () => {
  for (const fase of ["reposo", "ganador", "función"] as const) {
    assert.equal(puedeArrancar(fase, false), true);
    assert.equal(puedeArrancar(fase, true), false);
  }
  for (const fase of ["conteo", "girando", "finalistas", "vuelta vacía", "vetando"] as const) {
    assert.equal(puedeArrancar(fase, false), false);
    assert.equal(puedeArrancar(fase, true), false);
  }
});

test("los tambores quedan de frente sólo cuando todas las tiras tienen una celda", () => {
  assert.equal(tamboresQuietos([[1], [2], [3]]), true);
  assert.equal(tamboresQuietos([[1]]), true);
  assert.equal(tamboresQuietos([[1, 2], [3]]), false);
  assert.equal(tamboresQuietos([[]]), false);
  assert.equal(tamboresQuietos([]), true);
});

test("monta una vez por giro y conserva los tambores al pasar al segundo acto", () => {
  const finalistas = [{ _id: "uno" }];
  assert.equal(debeMontarTambores("girando", finalistas, null), true);
  assert.equal(debeMontarTambores("girando", finalistas, finalistas), false);
  assert.equal(debeMontarTambores("finalistas", finalistas, finalistas), false);
  // Otro giro puede escoger exactamente los mismos títulos: importa el array.
  assert.equal(debeMontarTambores("finalistas", [...finalistas], finalistas), true);
  assert.equal(debeMontarTambores("finalistas", finalistas, null), true);
  for (const fase of ["reposo", "conteo", "ganador", "función", "vuelta vacía", "vetando"] as const) {
    assert.equal(debeMontarTambores(fase, [...finalistas], finalistas), false);
  }
});

 test("el sello sincroniza ambos flancos sin reiniciar estados repetidos", async () => {
  const { sincronizarSello } = await import("../app/escenario-3d-logica.ts");
  const llamadas: boolean[] = [];
  const sala = { sello(visible: boolean) { llamadas.push(visible); } };
  sincronizarSello(sala, false, undefined);
  sincronizarSello(sala, true, false);
  sincronizarSello(sala, true, true);
  sincronizarSello(sala, false, true);
  sincronizarSello(sala, false, false);
  assert.deepEqual(llamadas, [false, true, false]);
});
