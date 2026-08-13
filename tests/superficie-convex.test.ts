import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("la siembra es interna y la superficie pública usa ids, nunca códigos", async () => {
  const siembra = await readFile("convex/siembra.ts", "utf8");
  assert.match(siembra, /export const sembrar = internalAction\s*\(/);

  const archivos = (await readdir("convex"))
    .filter((archivo) => archivo.endsWith(".ts"))
    .sort();
  const publicas: string[] = [];
  for (const archivo of archivos) {
    const fuente = await readFile(`convex/${archivo}`, "utf8");
    for (const coincidencia of fuente.matchAll(
      /export const (\w+)\s*=\s*(query|mutation|action)\s*\(/g,
    )) {
      publicas.push(`${archivo}:${coincidencia[1]}:${coincidencia[2]}`);
    }
  }

  assert.deepEqual(publicas, [
    "noches.ts:vigente:query",
    "noches.ts:vetar:mutation",
    "taquilla.ts:entrar:mutation",
    "titulos.ts:deSala:query",
  ]);

  for (const modulo of ["convex/noches.ts", "convex/titulos.ts"]) {
    const fuente = await readFile(modulo, "utf8");
    assert.doesNotMatch(fuente, /codigo/);
  }

});
