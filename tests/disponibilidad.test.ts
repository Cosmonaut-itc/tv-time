import assert from "node:assert/strict";
import test from "node:test";
import {
  mapearDisponibilidadDeMexico,
  politicaDeCache,
} from "../convex/disponibilidad_logica.ts";

const DIA = 24 * 60 * 60 * 1000;
const AHORA = Date.parse("2026-08-13T12:00:00.000Z");

test("sin caché pide datos y no inventa un respaldo", () => {
  assert.deepEqual(politicaDeCache(null, AHORA), {
    decision: "pedir",
    servirSiFalla: false,
    borrar: false,
  });
});

test("una fila de menos de siete días se sirve sin pedir", () => {
  assert.deepEqual(politicaDeCache({ actualizada: AHORA - 6 * DIA }, AHORA), {
    decision: "servir",
    servirSiFalla: true,
    borrar: false,
  });
});

test("una fila rancia se refresca pero todavía sirve de respaldo", () => {
  assert.deepEqual(politicaDeCache({ actualizada: AHORA - 7 * DIA }, AHORA), {
    decision: "pedir",
    servirSiFalla: true,
    borrar: false,
  });
});

test("una fila caducada a los seis meses se marca para borrar y no sirve de respaldo", () => {
  assert.deepEqual(
    politicaDeCache({ actualizada: AHORA - 180 * DIA }, AHORA),
    { decision: "pedir", servirSiFalla: false, borrar: true },
  );
});

test("mapea flatrate, rent y buy de México", () => {
  assert.deepEqual(
    mapearDisponibilidadDeMexico({
      results: {
        MX: {
          flatrate: [{ provider_name: "Netflix", logo_path: "/netflix.jpg" }],
          rent: [{ provider_name: "Prime Video", logo_path: "/prime.jpg" }],
          buy: [{ provider_name: "Apple TV", logo_path: "/apple.jpg" }],
        },
      },
    }),
    {
      flatrate: [{ nombre: "Netflix", logoPath: "/netflix.jpg" }],
      renta: [{ nombre: "Prime Video", logoPath: "/prime.jpg" }],
      compra: [{ nombre: "Apple TV", logoPath: "/apple.jpg" }],
    },
  );
});

test("sin región México cachea tres listas vacías", () => {
  assert.deepEqual(mapearDisponibilidadDeMexico({ results: {} }), {
    flatrate: [],
    renta: [],
    compra: [],
  });
});

test("México sin ninguna lista cachea tres listas vacías", () => {
  assert.deepEqual(mapearDisponibilidadDeMexico({ results: { MX: {} } }), {
    flatrate: [],
    renta: [],
    compra: [],
  });
});

test("una envoltura inválida de TMDB se rechaza en vez de parecer disponibilidad vacía", () => {
  for (const respuesta of [null, { error: "temporal" }, { results: "mal" }]) {
    assert.throws(
      () => mapearDisponibilidadDeMexico(respuesta),
      /respuesta inválida de TMDB/i,
    );
  }
});

test("una lista de México que no es array se rechaza como respuesta inválida", () => {
  assert.throws(
    () =>
      mapearDisponibilidadDeMexico({
        results: { MX: { flatrate: { provider_name: "Netflix" } } },
      }),
    /respuesta inválida de TMDB/i,
  );
});

test("una respuesta con sólo renta conserva esa pista", () => {
  assert.deepEqual(
    mapearDisponibilidadDeMexico({
      results: {
        MX: {
          rent: [{ provider_name: "Claro video", logo_path: "/claro.jpg" }],
        },
      },
    }),
    {
      flatrate: [],
      renta: [{ nombre: "Claro video", logoPath: "/claro.jpg" }],
      compra: [],
    },
  );
});
