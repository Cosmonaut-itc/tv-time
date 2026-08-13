import assert from "node:assert/strict";
import test from "node:test";
import { nocheDe } from "../app/noche.ts";

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
