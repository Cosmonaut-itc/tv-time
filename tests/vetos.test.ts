import assert from "node:assert/strict";
import test from "node:test";
import type { TituloDeSala } from "../convex/cartelera.ts";
import {
  vetarEnNoche,
  type NocheParaVeto,
} from "../convex/noches_logica.ts";

const AHORA = Date.parse("2026-08-13T03:00:00.000Z");

function crearSalaDePrueba(cantidad = 4) {
  let noche: NocheParaVeto<string> | null = null;
  let nochesCreadas = 0;
  const propios = Array.from({ length: cantidad }, (_, indice) => ({
    _id: `titulo-${indice + 1}`,
    salaId: "sala-a",
    tipo: "pelicula" as const,
    nombre: `Título ${indice + 1}`,
    visto: false,
  }));
  const ajeno = {
    _id: "titulo-ajeno",
    salaId: "sala-b",
    tipo: "pelicula" as const,
    nombre: "Título ajeno",
    visto: false,
  };
  const titulos = new Map(
    [...propios, ajeno].map((titulo) => [titulo._id, titulo]),
  );

  return {
    dependencias: {
      ahora: () => AHORA,
      buscarTitulo: async (tituloId: string) => titulos.get(tituloId) ?? null,
      buscarTitulosDeSala: async (salaId: string): Promise<TituloDeSala[]> =>
        propios.filter((titulo) => titulo.salaId === salaId),
      buscarNoche: async () => noche,
      crearNoche: async (datos: Omit<NocheParaVeto<string>, "_id">) => {
        nochesCreadas += 1;
        noche = { _id: `noche-${nochesCreadas}`, ...datos };
        return noche;
      },
      guardarNoche: async (nueva: NocheParaVeto<string>) => {
        noche = nueva;
      },
    },
    noche: () => noche,
    nochesCreadas: () => nochesCreadas,
  };
}

test("dos vetos caben en una sola noche y el reintento no estrena un tercero", async () => {
  const sala = crearSalaDePrueba();

  await vetarEnNoche(sala.dependencias, {
    salaId: "sala-a",
    tituloId: "titulo-1",
    filtro: "loQueSea",
  });
  await assert.rejects(
    vetarEnNoche(sala.dependencias, {
      salaId: "sala-a",
      tituloId: "titulo-1",
      filtro: "loQueSea",
    }),
    /ya está vetado esta noche/,
  );
  await vetarEnNoche(sala.dependencias, {
    salaId: "sala-a",
    tituloId: "titulo-2",
    filtro: "loQueSea",
  });
  await assert.rejects(
    vetarEnNoche(sala.dependencias, {
      salaId: "sala-a",
      tituloId: "titulo-ajeno",
      filtro: "loQueSea",
    }),
    /no pertenece a esta sala/,
  );

  assert.equal(sala.nochesCreadas(), 1);
  assert.deepEqual(sala.noche()?.vetados, ["titulo-1", "titulo-2"]);
  assert.equal(sala.noche()?.vetosGastados, 2);
});

test("el servidor rechaza un tercer título aunque sea de la sala", async () => {
  const sala = crearSalaDePrueba();

  for (const tituloId of ["titulo-1", "titulo-2"]) {
    await vetarEnNoche(sala.dependencias, {
      salaId: "sala-a",
      tituloId,
      filtro: "loQueSea",
    });
  }

  await assert.rejects(
    vetarEnNoche(sala.dependencias, {
      salaId: "sala-a",
      tituloId: "titulo-3",
      filtro: "loQueSea",
    }),
    /ya gastó sus dos vetos/,
  );
  assert.equal(sala.noche()?.vetosGastados, 2);
});

test("un título de otra sala no crea una noche", async () => {
  const sala = crearSalaDePrueba();

  await assert.rejects(
    vetarEnNoche(sala.dependencias, {
      salaId: "sala-a",
      tituloId: "titulo-ajeno",
      filtro: "loQueSea",
    }),
    /no pertenece a esta sala/,
  );
  assert.equal(sala.nochesCreadas(), 0);
  assert.equal(sala.noche(), null);
});

test("con un solo candidato el servidor apaga el veto", async () => {
  const sala = crearSalaDePrueba(1);

  await assert.rejects(
    vetarEnNoche(sala.dependencias, {
      salaId: "sala-a",
      tituloId: "titulo-1",
      filtro: "loQueSea",
    }),
    /un solo título.*veto se apaga/i,
  );
  assert.equal(sala.nochesCreadas(), 0);
});

test("con dos candidatos el primer veto sí se acepta", async () => {
  const sala = crearSalaDePrueba(2);

  const noche = await vetarEnNoche(sala.dependencias, {
    salaId: "sala-a",
    tituloId: "titulo-1",
    filtro: "loQueSea",
  });

  assert.deepEqual(noche.vetados, ["titulo-1"]);
});

test("dos vetos consecutivos sobre un duelo dejan rechazado el segundo", async () => {
  const sala = crearSalaDePrueba(2);

  await vetarEnNoche(sala.dependencias, {
    salaId: "sala-a",
    tituloId: "titulo-1",
    filtro: "loQueSea",
  });
  await assert.rejects(
    vetarEnNoche(sala.dependencias, {
      salaId: "sala-a",
      tituloId: "titulo-2",
      filtro: "loQueSea",
    }),
    /un solo título.*veto se apaga/i,
  );

  assert.deepEqual(sala.noche()?.vetados, ["titulo-1"]);
  assert.equal(sala.noche()?.vetosGastados, 1);
});
