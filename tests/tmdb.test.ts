import assert from "node:assert/strict";
import test from "node:test";
import { mapearParteDeColeccion, mapearResultadoDeBusqueda } from "../convex/tmdb_logica.ts";

test("TMDB se reduce al contrato común de película y serie", () => {
  assert.deepEqual(
    mapearResultadoDeBusqueda(
      {
        id: 11,
        media_type: "movie",
        title: "La guerra de las galaxias",
        release_date: "1977-05-25",
        poster_path: "/star-wars.jpg",
      },
      { id: 10, name: "Star Wars: trilogía original" },
    ),
    {
      id: 11,
      tipo: "pelicula",
      nombre: "La guerra de las galaxias",
      anio: 1977,
      fechaEstreno: "1977-05-25",
      posterPath: "/star-wars.jpg",
      coleccion: { id: 10, nombre: "Star Wars: trilogía original" },
    },
  );
  assert.deepEqual(
    mapearResultadoDeBusqueda({
      id: 95396,
      media_type: "tv",
      name: "Severance",
      first_air_date: "2022-02-18",
      poster_path: null,
    }),
    {
      id: 95396,
      tipo: "serie",
      nombre: "Severance",
      anio: 2022,
      fechaEstreno: "2022-02-18",
    },
  );
});

test("personas y resultados sin identidad no se disfrazan de títulos", () => {
  assert.equal(mapearResultadoDeBusqueda({ id: 1, media_type: "person", name: "Alguien" }), null);
  assert.equal(mapearResultadoDeBusqueda({ id: -1, media_type: "movie", title: "Rota" }), null);
  assert.equal(mapearResultadoDeBusqueda({ id: 2, media_type: "movie", title: "   " }), null);
});

test("las partes de colección conservan la fecha completa que manda en el orden", () => {
  assert.deepEqual(
    mapearParteDeColeccion({
      id: 1891,
      title: "El Imperio contraataca",
      release_date: "1980-05-17",
      poster_path: "/empire.jpg",
    }, { id: 10, nombre: "Star Wars" }),
    {
      id: 1891,
      tipo: "pelicula",
      nombre: "El Imperio contraataca",
      anio: 1980,
      fechaEstreno: "1980-05-17",
      posterPath: "/empire.jpg",
      coleccion: { id: 10, nombre: "Star Wars" },
    },
  );
});

test("búsqueda y colección incluyen sinopsis y nota con la misma regla", () => {
  const datos = { id: 1, title: "Antes", overview: "  Una noche.  ", vote_average: 7.777, vote_count: 2 };
  const encontrado = mapearResultadoDeBusqueda({ ...datos, media_type: "movie" });
  const parte = mapearParteDeColeccion(datos, { id: 2, nombre: "Antes" });
  for (const titulo of [encontrado, parte]) {
    assert.equal(titulo?.sinopsis, "Una noche.");
    assert.equal(titulo?.calificacion, 7.8);
  }
  const sinDatos = mapearResultadoDeBusqueda({ ...datos, media_type: "movie", overview: " ", vote_count: 0 });
  assert.ok(!("sinopsis" in sinDatos!));
  assert.ok(!("calificacion" in sinDatos!));
  const sinVotos = mapearParteDeColeccion({ ...datos, vote_count: undefined }, { id: 2, nombre: "Antes" });
  assert.ok(!("calificacion" in sinVotos!));
});
