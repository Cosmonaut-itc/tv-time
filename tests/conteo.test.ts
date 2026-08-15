import assert from "node:assert/strict";
import test from "node:test";
import { ajusteOpticoDelNumero } from "../app/conteo-logica.ts";

test("una cifra sin descendente se corre hacia arriba lo que le sobra a la caja", () => {
  // Caja de 78 px con la línea base a 78 (tipografía sin descendente) y una
  // cifra de 40 px de tinta: su centro cae en 58, veinte px debajo del centro.
  const ajuste = ajusteOpticoDelNumero({
    alto: 78,
    lineaBase: 78,
    tintaArriba: 40,
    tintaAbajo: 0,
  });
  assert.equal(ajuste, -19);
});

test("un glifo ya centrado no se mueve", () => {
  const ajuste = ajusteOpticoDelNumero({
    alto: 100,
    lineaBase: 70,
    tintaArriba: 40,
    tintaAbajo: 0,
  });
  assert.equal(ajuste, 0);
});

test("la tinta que baja de la línea base también cuenta", () => {
  // Con tinta de 40 arriba y 10 abajo, su centro cae 15 px sobre la línea base
  // —o sea en 45— y el centro de la caja está en 40: sobra la diferencia.
  const ajuste = ajusteOpticoDelNumero({
    alto: 80,
    lineaBase: 60,
    tintaArriba: 40,
    tintaAbajo: 10,
  });
  assert.equal(ajuste, -5);
});
