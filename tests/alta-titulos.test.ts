import assert from "node:assert/strict";
import test from "node:test";
import {
  ESPERA_BUSQUEDA_MS,
  claveTmdb,
  estaEstrenado,
  etiquetaDelBotonDeSaga,
  etiquetaDeEstrenoPendiente,
  mismaFilaDeBusqueda,
  mismaParteDeSaga,
  ordenarPartesPorEstreno,
  prepararAltaDeSaga,
  sagaExistenteEnColeccion,
  siguienteOrdenDeSaga,
  type TituloEncontrado,
} from "../app/alta-logica.ts";

const HOY = "2026-08-13";

const duna: TituloEncontrado = {
  id: 438631,
  tipo: "pelicula",
  nombre: "Duna",
  anio: 2021,
  fechaEstreno: "2021-09-15",
  posterPath: "/duna.jpg",
  coleccion: { id: 726871, nombre: "Duna" },
};

test("el botón describe la saga como una sola entrada", () => {
  assert.equal(
    etiquetaDelBotonDeSaga({ cantidadDeEstrenadas: 8, enCartelera: 1, unaEntrada: true }),
    "Agregar 1 entrada · 1 en cartelera",
  );
});

test("el botón singulariza un solo título estrenado", () => {
  assert.equal(
    etiquetaDelBotonDeSaga({ cantidadDeEstrenadas: 1, enCartelera: 1, unaEntrada: false }),
    "Agregar 1 título · 1 en cartelera",
  );
});

test("el botón pluraliza varios títulos estrenados", () => {
  assert.equal(
    etiquetaDelBotonDeSaga({ cantidadDeEstrenadas: 8, enCartelera: 5, unaEntrada: false }),
    "Agregar 8 títulos · 5 en cartelera",
  );
});

test("el botón deshabilitado conserva la etiqueta para una saga vacía", () => {
  assert.equal(
    etiquetaDelBotonDeSaga({ cantidadDeEstrenadas: 0, enCartelera: 0, unaEntrada: false }),
    "Agregar 0 títulos · 0 en cartelera",
  );
});

test("la búsqueda espera 220 ms y una fecha futura o ausente no se puede agregar", () => {
  assert.equal(ESPERA_BUSQUEDA_MS, 220);
  assert.equal(estaEstrenado("2026-08-13", HOY), true);
  assert.equal(estaEstrenado("2026-08-14", HOY), false);
  assert.equal(estaEstrenado(undefined, HOY), false);
});

test("la identidad del buscador separa película y serie con el mismo id de TMDB", () => {
  assert.notEqual(claveTmdb("pelicula", 671), claveTmdb("serie", 671));
  assert.equal(claveTmdb("pelicula", 671), "pelicula:671");
});

test("una fecha ausente se etiqueta sin afirmar que el estreno es futuro", () => {
  assert.equal(etiquetaDeEstrenoPendiente(undefined), "sin fecha");
  assert.equal(etiquetaDeEstrenoPendiente("2027-01-01"), "aún no se estrena");
  assert.equal(estaEstrenado(undefined, HOY), false);
});

test("una saga unida se ordena por estreno y el corte sólo enciende visto", () => {
  const partes = ordenarPartesPorEstreno([
    { ...duna, id: 3, nombre: "Tres", fechaEstreno: "2026-08-14", anio: 2026 },
    { ...duna, id: 2, nombre: "Dos", fechaEstreno: "2024-02-27", anio: 2024 },
    { ...duna, id: 1, nombre: "Uno", fechaEstreno: "2021-09-15", anio: 2021 },
  ]);

  assert.deepEqual(partes.map(({ id }) => id), [1, 2, 3]);
  assert.deepEqual(
    prepararAltaDeSaga({ nombre: "  Duna  ", partes, corte: 1, unaEntrada: false }, HOY),
    [
      {
        tipo: "pelicula",
        nombre: "Uno",
        anio: 2021,
        tmdbId: 1,
        posterPath: "/duna.jpg",
        saga: "Duna",
        orden: 1,
        visto: true,
      },
      {
        tipo: "pelicula",
        nombre: "Dos",
        anio: 2024,
        tmdbId: 2,
        posterPath: "/duna.jpg",
        saga: "Duna",
        orden: 2,
        visto: false,
      },
    ],
  );
});

test("la saga como una entrada usa la primera película y no guarda candado", () => {
  const [entrada] = prepararAltaDeSaga(
    {
      nombre: "Duna",
      partes: [
        { ...duna, id: 2, nombre: "Dos", fechaEstreno: "2024-02-27", anio: 2024 },
        { ...duna, id: 1, nombre: "Uno", fechaEstreno: "2021-09-15", anio: 2021 },
      ],
      corte: 1,
      unaEntrada: true,
    },
    HOY,
  );

  assert.deepEqual(entrada, {
    tipo: "pelicula",
    nombre: "Duna",
    anio: 2021,
    tmdbId: 1,
    posterPath: "/duna.jpg",
    visto: false,
  });
  assert.equal("saga" in entrada, false);
  assert.equal("orden" in entrada, false);
});

test("agregar a una saga existente conserva sus huecos de orden", () => {
  assert.equal(
    siguienteOrdenDeSaga(
      [
        { tipo: "pelicula", saga: "Star Wars", orden: 1 },
        { tipo: "pelicula", saga: "Star Wars", orden: 2 },
        { tipo: "pelicula", saga: "Star Wars", orden: 4 },
        { tipo: "serie", saga: "Star Wars", orden: 99 },
      ],
      "Star Wars",
    ),
    5,
  );
});

test("una colección continúa la saga existente desde su último orden", () => {
  const partes = [
    { ...duna, id: 1, nombre: "Duna" },
    { ...duna, id: 2, nombre: "Duna: Parte Dos", fechaEstreno: "2024-02-27" },
    { ...duna, id: 3, nombre: "Duna: Parte Tres", fechaEstreno: HOY },
  ];
  const catalogo = [
    { tipo: "pelicula" as const, tmdbId: 1, saga: "Duna", orden: 1 },
    { tipo: "pelicula" as const, tmdbId: 2, saga: "Duna", orden: 2 },
  ];
  const saga = sagaExistenteEnColeccion(catalogo, partes);

  assert.equal(saga, "Duna");
  assert.deepEqual(
    prepararAltaDeSaga(
      {
        nombre: saga!,
        partes: [partes[2]],
        corte: 0,
        unaEntrada: false,
        ordenInicial: siguienteOrdenDeSaga(catalogo, saga!),
      },
      HOY,
    ),
    [{
      tipo: "pelicula",
      nombre: "Duna: Parte Tres",
      anio: 2021,
      tmdbId: 3,
      posterPath: "/duna.jpg",
      saga: "Duna",
      orden: 3,
      visto: false,
    }],
  );
});

test("las filas iguales saltan una instantánea nueva y detectan un solo campo distinto", () => {
  const nueva = {
    ...duna,
    coleccion: duna.coleccion ? { ...duna.coleccion } : undefined,
  };
  assert.notEqual(nueva, duna);
  assert.equal(mismaFilaDeBusqueda(duna, nueva), true);
  assert.equal(mismaFilaDeBusqueda(duna, { ...nueva, posterPath: "/otra.jpg" }), false);
});

test("las partes memoizadas comparan por campos aunque Convex entregue otra instantánea", () => {
  const despues = {
    ...duna,
    coleccion: duna.coleccion ? { ...duna.coleccion } : undefined,
  };

  assert.notEqual(despues, duna);
  assert.notEqual(despues.coleccion, duna.coleccion);
  assert.equal(mismaParteDeSaga(duna, despues), true);
  assert.equal(mismaParteDeSaga(duna, { ...despues, fechaEstreno: "2027-01-01" }), false);
});
