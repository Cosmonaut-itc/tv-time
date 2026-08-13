import assert from "node:assert/strict";
import test from "node:test";
import type { TituloDeSala } from "../app/cartelera.ts";
import {
  decidirCambioDelGiro,
  elegirFinalistas,
  mensajeDeVueltaVacia,
  prepararGiro,
} from "../app/giro.ts";

function titulos(cantidad: number): TituloDeSala[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    _id: `titulo-${indice}`,
    tipo: "pelicula" as const,
    nombre: `Título ${indice}`,
    visto: false,
  }));
}

test("el primer acto se salta de uno a tres y con cuatro reduce a tres distintos", () => {
  const cantidades = [0, 1, 2, 3, 4];
  const resultados = cantidades.map((cantidad) => {
    const candidatos = titulos(cantidad);
    const finalistas = elegirFinalistas(
      candidatos,
      cantidad > 0 && cantidad <= 3,
      () => 0,
    );
    return {
      cantidad: finalistas.length,
      distintos: new Set(finalistas.map(({ _id }) => _id)).size,
    };
  });

  assert.deepEqual(resultados, [
    { cantidad: 0, distintos: 0 },
    { cantidad: 1, distintos: 1 },
    { cantidad: 2, distintos: 2 },
    { cantidad: 3, distintos: 3 },
    { cantidad: 3, distintos: 3 },
  ]);
});

test("la preparación sólo enciende los carretes reductores cuando hay más de tres candidatos", () => {
  const preparaciones = [0, 1, 2, 3, 4].map((cantidad) => {
    const giro = prepararGiro(
      titulos(cantidad),
      cantidad > 0 && cantidad <= 3,
      () => 0,
    );
    return {
      finalistas: giro.finalistas.length,
      primerActo: giro.primerActo,
    };
  });

  assert.deepEqual(preparaciones, [
    { finalistas: 0, primerActo: false },
    { finalistas: 1, primerActo: false },
    { finalistas: 2, primerActo: false },
    { finalistas: 3, primerActo: false },
    { finalistas: 3, primerActo: true },
  ]);
});

test("Fisher-Yates permite que el último candidato llegue a la terna", () => {
  const finalistas = elegirFinalistas(titulos(4), false, () => 0);

  assert.deepEqual(
    finalistas.map(({ _id }) => _id),
    ["titulo-1", "titulo-2", "titulo-3"],
  );
});

test("un veto nuevo a un finalista reinicia el giro", () => {
  const giro = {
    finalistas: [{ _id: "a" }, { _id: "b" }],
    vetadosAlIniciar: new Set<string>(),
  };

  assert.equal(decidirCambioDelGiro(giro, new Set(["b"])), "reiniciar");
});

test("un veto nuevo fuera de la terna deja vivo el giro", () => {
  const giro = {
    finalistas: [{ _id: "a" }, { _id: "b" }],
    vetadosAlIniciar: new Set<string>(),
  };

  assert.equal(decidirCambioDelGiro(giro, new Set(["c"])), "sigue vivo");
});

test("sin giro o sin vetos nuevos no hay nada que cambiar", () => {
  const giro = {
    finalistas: [{ _id: "a" }],
    vetadosAlIniciar: new Set(["c"]),
  };

  assert.equal(decidirCambioDelGiro(null, new Set(["a"])), "no pasa nada");
  assert.equal(decidirCambioDelGiro(giro, new Set(["c"])), "no pasa nada");
});

test("la vuelta vacía distingue vistas, vetos y ambas causas", () => {
  const peliculas = titulos(35);
  const cuentas = { pelicula: 35, serie: 0, loQueSea: 35 };
  const serie = (indice: number, visto: boolean): TituloDeSala => ({
    _id: `serie-${indice}`,
    tipo: "serie",
    nombre: `Serie ${indice}`,
    visto,
  });

  assert.equal(
    mensajeDeVueltaVacia(
      [...peliculas, serie(1, true), serie(2, true)],
      "serie",
      cuentas,
      new Set(),
    ),
    "ya vieron las 2 series — hay 35 películas",
  );
  assert.equal(
    mensajeDeVueltaVacia(
      [...peliculas, serie(1, false), serie(2, false)],
      "serie",
      cuentas,
      new Set(["serie-1", "serie-2"]),
    ),
    "2 series vetadas esta noche — hay 35 películas",
  );
  assert.equal(
    mensajeDeVueltaVacia(
      [...peliculas, serie(1, true), serie(2, false)],
      "serie",
      cuentas,
      new Set(["serie-2"]),
    ),
    "1 serie vista y 1 vetada esta noche — hay 35 películas",
  );
});
