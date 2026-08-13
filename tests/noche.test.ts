import assert from "node:assert/strict";
import test from "node:test";
import { nocheLocalEsMasReciente } from "../app/noche.ts";
import { nocheDe, proximoCorte } from "../convex/noche.ts";

test("antes de las cinco todavía pertenece a la noche anterior", () => {
  assert.equal(
    nocheDe(new Date("2026-08-12T10:59:00.000Z")),
    Date.parse("2026-08-11T11:00:00.000Z"),
  );
});

test("a las cinco comienza una noche nueva", () => {
  assert.equal(
    nocheDe(new Date("2026-08-12T11:00:00.000Z")),
    Date.parse("2026-08-12T11:00:00.000Z"),
  );
});

test("un minuto después de las cinco conserva el mismo corte", () => {
  assert.equal(
    nocheDe(new Date("2026-08-12T11:01:00.000Z")),
    Date.parse("2026-08-12T11:00:00.000Z"),
  );
});

test("respeta la hora de México durante el antiguo horario estacional", () => {
  assert.equal(
    nocheDe(new Date("2021-07-15T09:59:00.000Z")),
    Date.parse("2021-07-14T10:00:00.000Z"),
  );
  assert.equal(
    nocheDe(new Date("2021-07-15T10:00:00.000Z")),
    Date.parse("2021-07-15T10:00:00.000Z"),
  );
});

test("el próximo corte cae hoy a las cinco desde las 04:59", () => {
  assert.equal(
    proximoCorte(new Date("2026-08-12T10:59:00.000Z")),
    Date.parse("2026-08-12T11:00:00.000Z"),
  );
});

test("a las 05:00 el próximo corte ya es el de mañana", () => {
  assert.equal(
    proximoCorte(new Date("2026-08-12T11:00:00.000Z")),
    Date.parse("2026-08-13T11:00:00.000Z"),
  );
});

test("a una hora cualquiera programa el siguiente corte", () => {
  assert.equal(
    proximoCorte(new Date("2026-08-12T22:30:00.000Z")),
    Date.parse("2026-08-13T11:00:00.000Z"),
  );
});

test("una noche local anterior no resucita sus vetos sobre la noche remota", () => {
  assert.equal(
    nocheLocalEsMasReciente(
      { corte: 200, vetosGastados: 0 },
      { corte: 100, vetosGastados: 2 },
    ),
    false,
  );
  assert.equal(
    nocheLocalEsMasReciente(undefined, { corte: 100, vetosGastados: 2 }),
    false,
  );
});
