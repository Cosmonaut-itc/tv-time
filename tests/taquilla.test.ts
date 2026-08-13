import assert from "node:assert/strict";
import test from "node:test";
import { entrarConFreno, type FrenoTaquilla } from "../convex/taquilla_logica.ts";

const CODIGO_CORRECTO = "R4346N";

function crearTaquilla() {
  let freno: FrenoTaquilla | null = null;
  const dependencias = {
    ahora: () => Date.parse("2026-08-12T18:00:00.000Z"),
    buscarSala: async (codigo: string) =>
      codigo === CODIGO_CORRECTO
        ? { salaId: "sala-dev", codigo: CODIGO_CORRECTO, butacas: ["Félix", "Sofía"] }
        : null,
    leerFreno: async () => freno,
    guardarFreno: async (nuevo: FrenoTaquilla) => {
      freno = nuevo;
    },
    limpiarFreno: async () => {
      freno = null;
    },
  };

  return { dependencias, leerFreno: () => freno };
}

test("un código correcto entra y limpia el freno aunque cinco fallos hayan trabado la taquilla", async () => {
  const taquilla = crearTaquilla();

  for (let intento = 0; intento < 5; intento += 1) {
    await entrarConFreno(taquilla.dependencias, { codigo: `ZZZZZ${intento}` });
  }

  assert.ok(taquilla.leerFreno()?.trabadaHasta);
  assert.deepEqual(
    await entrarConFreno(taquilla.dependencias, { codigo: CODIGO_CORRECTO }),
    {
      estado: "abierta",
      salaId: "sala-dev",
      codigo: CODIGO_CORRECTO,
      butacas: ["Félix", "Sofía"],
    },
  );
  assert.equal(taquilla.leerFreno(), null);
});

test("el freno sólo responde a un código inexistente y conserva el mensaje acordado", async () => {
  const taquilla = crearTaquilla();

  const resultado = await entrarConFreno(taquilla.dependencias, { codigo: "ZZZZZV" });

  assert.deepEqual(resultado, {
    estado: "cerrada",
    mensaje: "No hay ninguna sala con ese código.",
    intentosRestantes: 4,
  });
});
