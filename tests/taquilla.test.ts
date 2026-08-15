import assert from "node:assert/strict";
import test from "node:test";
import {
  elegirCodigoNuevo,
  entrarConFreno,
  normalizarButacas,
  type FrenoTaquilla,
} from "../convex/taquilla_logica.ts";

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

test("la rotación descarta el código actual y los ocupados antes de elegir uno libre", async () => {
  const candidatos = [CODIGO_CORRECTO, "OCUPA1", "NUEV01"];
  const ocupados = new Set([CODIGO_CORRECTO, "OCUPA1"]);

  const nuevo = await elegirCodigoNuevo(
    {
      generarCodigo: () => candidatos.shift()!,
      codigoEstaTomado: async (codigo) => ocupados.has(codigo),
    },
    { codigoActual: CODIGO_CORRECTO },
  );

  assert.equal(nuevo, "NUEV01");
});

test("la rotación se rinde sin candidato después de dieciséis intentos", async () => {
  let intentos = 0;

  const nuevo = await elegirCodigoNuevo(
    {
      generarCodigo: () => {
        intentos += 1;
        return "OCUPA1";
      },
      codigoEstaTomado: async () => true,
    },
    { codigoActual: CODIGO_CORRECTO },
  );

  assert.equal(nuevo, null);
  assert.equal(intentos, 16);
});

test("las butacas se recortan y deben ser exactamente dos nombres distintos", () => {
  assert.deepEqual(normalizarButacas([" Félix ", " Sofía  "]), ["Félix", "Sofía"]);
  assert.equal(normalizarButacas(["Félix", " "]), null);
  assert.equal(normalizarButacas(["A".repeat(15), "Sofía"]), null);
  assert.equal(normalizarButacas(["Félix", "félix"]), null);
  assert.equal(normalizarButacas(["Félix"]), null);
  assert.equal(normalizarButacas(["Félix", "Sofía", "Claude"]), null);
});
