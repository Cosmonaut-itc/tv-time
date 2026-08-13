import assert from "node:assert/strict";
import test from "node:test";
import { demoraTelon } from "../app/laboratorio-telon.ts";

test("sin variable no demora", () => assert.equal(demoraTelon(undefined), 0));
test("acepta una demora acotada", () => assert.equal(demoraTelon("1500"), 1500));
test("rechaza valores ambiguos o excesivos", () => {
  for (const valor of ["x", "-1", "5001", "1.5"]) {
    assert.throws(() => demoraTelon(valor), /TELON_DEMORA_MS inválida/);
  }
});
