import assert from "node:assert/strict";
import test from "node:test";
import { nocheDe } from "../app/noche.ts";

test("antes de las cinco todavía pertenece a la noche anterior", () => {
  assert.equal(nocheDe(new Date("2026-01-12T10:59:59.999Z")), "2026-01-11");
});

test("a las cinco comienza una noche nueva", () => {
  assert.equal(nocheDe(new Date("2026-01-12T11:00:00.000Z")), "2026-01-12");
});

test("respeta la hora de México durante el antiguo horario estacional", () => {
  assert.equal(nocheDe(new Date("2021-04-04T09:30:00.000Z")), "2021-04-03");
  assert.equal(nocheDe(new Date("2021-04-04T10:30:00.000Z")), "2021-04-04");
});
