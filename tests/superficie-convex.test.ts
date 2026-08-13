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
    "disponibilidad.ts:deTitulo:action",
    "funciones.ts:cerrar:mutation",
    "noches.ts:vigente:query",
    "noches.ts:vetar:mutation",
    "taquilla.ts:entrar:mutation",
    "titulos.ts:deSala:query",
    "titulos.ts:altaEnLote:mutation",
    "titulos.ts:marcarVisto:mutation",
    "titulos.ts:quitar:mutation",
    "tmdb.ts:buscar:action",
    "tmdb.ts:coleccion:action",
  ]);

  for (const modulo of [
    "convex/disponibilidad.ts",
    "convex/funciones.ts",
    "convex/noches.ts",
    "convex/titulos.ts",
    "convex/titulos_logica.ts",
    "convex/tmdb.ts",
    "convex/tmdb_logica.ts",
  ]) {
    const fuente = await readFile(modulo, "utf8");
    assert.doesNotMatch(fuente, /codigo/);
  }

});
