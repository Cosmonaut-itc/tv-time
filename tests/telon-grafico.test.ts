import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el candidato es un PNG 1320 por 2868", async () => {
  const png = await readFile("public/telon/1320x2868-ios26-v1.png");
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1320);
  assert.equal(png.readUInt32BE(20), 2868);
  assert.equal(png[25], 2, "el PNG debe ser RGB opaco, no indexado ni alpha");
});
