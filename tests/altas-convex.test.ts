import assert from "node:assert/strict";
import test from "node:test";
import {
  claveTmdb,
  MAX_TITULOS_POR_ALTA,
  prepararLoteDeAlta,
} from "../convex/altas_logica.ts";

const base = {
  butacas: ["Félix", "Sofía"],
  agregadoPor: "Félix",
  existentesTmdb: new Set<string>([claveTmdb("pelicula", 10)]),
  ahora: 1_000,
};

test("el alta rechaza lotes enormes, autorías ajenas y campos dañinos", () => {
  const titulo = { tipo: "pelicula" as const, nombre: "Duna", visto: false };
  assert.throws(
    () => prepararLoteDeAlta({ ...base, lote: Array.from({ length: MAX_TITULOS_POR_ALTA + 1 }, () => titulo) }),
    /demasiados títulos/,
  );
  assert.throws(
    () => prepararLoteDeAlta({ ...base, agregadoPor: "Otra", lote: [titulo] }),
    /butaca de esta sala/,
  );
  assert.throws(
    () => prepararLoteDeAlta({ ...base, lote: [{ ...titulo, nombre: "   " }] }),
    /nombre/,
  );
  assert.throws(
    () => prepararLoteDeAlta({ ...base, lote: [{ ...titulo, saga: "Duna", orden: -1 }] }),
    /orden/,
  );
  assert.throws(
    () => prepararLoteDeAlta({ ...base, lote: [{ ...titulo, tmdbId: 2.5 }] }),
    /tmdbId/,
  );
});

test("el alta evita duplicados de TMDB existentes o dentro del mismo lote", () => {
  const titulo = { tipo: "pelicula" as const, nombre: "Duna", visto: false };
  assert.throws(
    () => prepararLoteDeAlta({ ...base, lote: [{ ...titulo, tmdbId: 10 }] }),
    /ya está en el catálogo/,
  );
  assert.throws(
    () => prepararLoteDeAlta({
      ...base,
      lote: [
        { ...titulo, tmdbId: 11 },
        { ...titulo, nombre: "Duna otra vez", tmdbId: 11 },
      ],
    }),
    /repetido en el lote/,
  );
});

test("película y serie con el mismo id de TMDB no se confunden", () => {
  const serie = { tipo: "serie" as const, nombre: "Serie 671", tmdbId: 671, visto: false };
  const existentesTmdb = new Set([claveTmdb("pelicula", 671)]);

  assert.equal(
    prepararLoteDeAlta({ ...base, existentesTmdb, lote: [serie] })[0]?.nombre,
    "Serie 671",
  );
  assert.throws(
    () => prepararLoteDeAlta({
      ...base,
      existentesTmdb: new Set(),
      lote: [serie, { ...serie, nombre: "Serie 671 repetida" }],
    }),
    /repetido en el lote/,
  );
});

test("el alta no crea dos películas en el mismo lugar de una saga", () => {
  const titulo = { tipo: "pelicula" as const, nombre: "Parte", visto: false };
  assert.throws(
    () => prepararLoteDeAlta({
      ...base,
      lugaresExistentes: new Set(["Duna\u00004"]),
      lote: [{ ...titulo, saga: "Duna", orden: 4 }],
    }),
    /lugar ocupado/,
  );
  assert.throws(
    () => prepararLoteDeAlta({
      ...base,
      lote: [
        { ...titulo, saga: "Duna", orden: 5 },
        { ...titulo, nombre: "Otra", saga: "Duna", orden: 5 },
      ],
    }),
    /lugar repetido/,
  );
});

test("el alta normaliza sin renumerar y da un agregado distinto a cada fila", () => {
  const lote = prepararLoteDeAlta({
    ...base,
    lote: [
      {
        tipo: "pelicula",
        nombre: "  Duna  ",
        anio: 2021,
        tmdbId: 438631,
        posterPath: "/duna.jpg",
        saga: " Duna ",
        orden: 4,
        visto: true,
      },
      { tipo: "serie", nombre: " Severance ", visto: false },
    ],
  });

  assert.deepEqual(lote, [
    {
      tipo: "pelicula",
      nombre: "Duna",
      anio: 2021,
      tmdbId: 438631,
      posterPath: "/duna.jpg",
      saga: "Duna",
      orden: 4,
      agregadoPor: "Félix",
      visto: true,
      agregado: 1_000,
    },
    {
      tipo: "serie",
      nombre: "Severance",
      agregadoPor: "Félix",
      visto: false,
      agregado: 1_001,
    },
  ]);
});
