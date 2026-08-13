import assert from "node:assert/strict";
import test from "node:test";
import { derivarCartelera, type TituloDeSala } from "../app/cartelera.ts";
import { CATALOGO_INICIAL } from "../convex/catalogo_inicial.ts";

function catalogoSembrado(): TituloDeSala[] {
  return CATALOGO_INICIAL.map((titulo, indice) => ({
    ...titulo,
    _id: `titulo-${indice}`,
    visto: false,
  }));
}

test("el catálogo sembrado deja 16 candidatos: 7 sueltas, 3 series y 6 cabezas de saga", () => {
  const cartelera = derivarCartelera(catalogoSembrado(), {
    filtro: "loQueSea",
    vetados: new Set(),
  });

  assert.equal(cartelera.candidatos.length, 16);
  assert.deepEqual(
    cartelera.candidatos.filter(({ saga }) => saga).map(({ orden }) => orden),
    [1, 1, 1, 1, 1, 1],
  );
});

test("marcar vista una cabeza sube sólo la siguiente película de esa saga", () => {
  const titulos = catalogoSembrado();
  const antes = derivarCartelera(titulos, {
    filtro: "loQueSea",
    vetados: new Set(),
  }).candidatos;
  const cabeza = antes.find(({ saga }) => saga === "Star Wars");
  assert.ok(cabeza);

  const despues = derivarCartelera(
    titulos.map((titulo) =>
      titulo._id === cabeza._id ? { ...titulo, visto: true } : titulo,
    ),
    { filtro: "loQueSea", vetados: new Set() },
  ).candidatos;

  assert.equal(despues.length, 16);
  assert.equal(
    despues.find(({ saga }) => saga === "Star Wars")?.orden,
    2,
  );
  assert.deepEqual(
    despues.filter(({ saga }) => saga !== "Star Wars").map(({ _id }) => _id),
    antes.filter(({ saga }) => saga !== "Star Wars").map(({ _id }) => _id),
  );
});

test("una saga con órdenes empatados elige siempre por agregado y después por id", () => {
  const empatadas: TituloDeSala[] = [
    {
      _id: "c",
      tipo: "pelicula",
      nombre: "Tercera",
      saga: "Empate",
      orden: 1,
      agregado: 10,
      visto: false,
    },
    {
      _id: "b",
      tipo: "pelicula",
      nombre: "Segunda",
      saga: "Empate",
      orden: 1,
      agregado: 5,
      visto: false,
    },
    {
      _id: "a",
      tipo: "pelicula",
      nombre: "Primera",
      saga: "Empate",
      orden: 1,
      agregado: 5,
      visto: false,
    },
  ];

  const candidatas = [empatadas, empatadas.toReversed()].map(
    (titulos) =>
      derivarCartelera(titulos, {
        filtro: "pelicula",
        vetados: new Set(),
      }).candidatos.map(({ _id }) => _id),
  );

  assert.deepEqual(candidatas, [["a"], ["a"]]);
});

test("las series compiten enteras aunque traigan saga y orden", () => {
  const series: TituloDeSala[] = [
    {
      _id: "serie-1",
      tipo: "serie",
      nombre: "Temporada uno",
      saga: "Serie mal formada",
      orden: 1,
      visto: false,
    },
    {
      _id: "serie-2",
      tipo: "serie",
      nombre: "Temporada dos",
      saga: "Serie mal formada",
      orden: 2,
      visto: false,
    },
    {
      _id: "pelicula-2",
      tipo: "pelicula",
      nombre: "Película dos",
      saga: "Serie mal formada",
      orden: 2,
      visto: false,
    },
  ];

  const cartelera = derivarCartelera(series, {
    filtro: "loQueSea",
    vetados: new Set(),
  });

  assert.deepEqual(
    cartelera.candidatos.map(({ _id }) => _id),
    ["serie-1", "serie-2", "pelicula-2"],
  );
});

test("una película con saga pero sin orden compite como título suelto", () => {
  const titulos: TituloDeSala[] = [
    {
      _id: "sin-orden",
      tipo: "pelicula",
      nombre: "Sin orden",
      saga: "Saga incompleta",
      visto: false,
    },
    {
      _id: "con-orden",
      tipo: "pelicula",
      nombre: "Con orden",
      saga: "Saga incompleta",
      orden: 1,
      visto: false,
    },
  ];

  const cartelera = derivarCartelera(titulos, {
    filtro: "pelicula",
    vetados: new Set(),
  });

  assert.deepEqual(
    cartelera.candidatos.map(({ _id }) => _id),
    ["sin-orden", "con-orden"],
  );
});

test("los órdenes cero y negativos participan y gana el menor", () => {
  const titulos: TituloDeSala[] = [-1, 0, 1].map((orden) => ({
    _id: `orden-${orden}`,
    tipo: "pelicula",
    nombre: `Orden ${orden}`,
    saga: "Números",
    orden,
    visto: false,
  }));

  const cartelera = derivarCartelera(titulos, {
    filtro: "pelicula",
    vetados: new Set(),
  });

  assert.deepEqual(
    cartelera.candidatos.map(({ _id }) => _id),
    ["orden--1"],
  );
});

test("las tres cuentas salen de los títulos vigentes y empiezan en 35, 3 y 38", () => {
  const cartelera = derivarCartelera(catalogoSembrado(), {
    filtro: "loQueSea",
    vetados: new Set(),
  });

  assert.deepEqual(cartelera.cuentas, {
    pelicula: 35,
    serie: 3,
    loQueSea: 38,
  });
});

test("las cuentas bajan en vivo al vetar y el filtro en cero sigue siendo un resultado válido", () => {
  const titulos = catalogoSembrado();
  const serieIds = titulos.filter(({ tipo }) => tipo === "serie").map(({ _id }) => _id);
  const cartelera = derivarCartelera(titulos, {
    filtro: "serie",
    vetados: new Set(serieIds),
  });

  assert.deepEqual(cartelera.cuentas, {
    pelicula: 35,
    serie: 0,
    loQueSea: 35,
  });
  assert.deepEqual(cartelera.candidatos, []);
});

test("dos candidatos anuncian esta noche, duelo", () => {
  const cartelera = derivarCartelera(catalogoSembrado().slice(0, 2), {
    filtro: "loQueSea",
    vetados: new Set(),
  });

  assert.equal(cartelera.anuncio, "esta noche, duelo");
});

test("un candidato anuncia no había de otra", () => {
  const cartelera = derivarCartelera(catalogoSembrado().slice(0, 1), {
    filtro: "loQueSea",
    vetados: new Set(),
  });

  assert.equal(cartelera.anuncio, "no había de otra");
});

test("cero no salta ningún acto; de uno a tres salta el primero y con cuatro hace falta", () => {
  const saltos = Array.from({ length: 5 }, (_, candidatos) =>
    derivarCartelera(catalogoSembrado().slice(0, candidatos), {
      filtro: "loQueSea",
      vetados: new Set(),
    }).saltaPrimerActo,
  );

  assert.deepEqual(saltos, [false, true, true, true, false]);
});
