import assert from "node:assert/strict";
import test from "node:test";
import { CATALOGO_INICIAL } from "../convex/catalogo_inicial.ts";
import {
  agregadoDelIndice,
  clasificarCatalogo,
  datosDeSiembraVigentes,
} from "../convex/siembra_catalogo.ts";

test("una sala con 38 títulos ajenos no se confunde con la siembra", () => {
  const ajenos = Array.from({ length: 38 }, (_, indice) => ({
    tipo: "pelicula" as const,
    nombre: `Título ajeno ${indice}`,
  }));

  assert.equal(clasificarCatalogo(ajenos), "ajena");
});

test("la identidad versionada distingue una siembra completa de una parcial", () => {
  assert.equal(clasificarCatalogo(CATALOGO_INICIAL), "completa");
  assert.equal(clasificarCatalogo(CATALOGO_INICIAL.slice(0, 1)), "parcial");
  assert.equal(clasificarCatalogo([]), "vacia");
});

test("cada título sembrado tiene un agregado creciente y ningún autor inventado", () => {
  const base = 1_700_000_000_000;
  const sembrados = CATALOGO_INICIAL.map((titulo, indice) => ({
    ...titulo,
    agregado: agregadoDelIndice(base, indice),
  }));

  assert.equal(new Set(sembrados.map(({ agregado }) => agregado)).size, 38);
  assert.equal(datosDeSiembraVigentes(sembrados), true);
  assert.equal(
    datosDeSiembraVigentes(sembrados.map((titulo) => ({ ...titulo, agregado: base }))),
    false,
  );
  assert.equal(
    datosDeSiembraVigentes(
      sembrados.map((titulo, indice) =>
        indice === 0 ? { ...titulo, agregadoPor: "Félix" } : titulo,
      ),
    ),
    false,
  );
});
