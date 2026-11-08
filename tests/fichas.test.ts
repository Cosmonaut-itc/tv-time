import assert from "node:assert/strict";
import test from "node:test";
import { mapearFicha } from "../convex/fichas_logica.ts";

test("la ficha recorta la sinopsis y redondea la calificación a un decimal", () => {
  assert.deepEqual(mapearFicha({ overview: "  Una noche en Viena. \n", vote_average: 8.156, vote_count: 120 }), {
    sinopsis: "Una noche en Viena.", calificacion: 8.2,
  });
});

test("una sinopsis vacía y una nota sin votos quedan ausentes", () => {
  assert.deepEqual(mapearFicha({ overview: " \n ", vote_average: 7, vote_count: 0 }), {});
  assert.deepEqual(mapearFicha({ overview: null, vote_average: 7 }), {});
  assert.deepEqual(mapearFicha({ vote_count: 10 }), {});
  assert.deepEqual(mapearFicha({ vote_count: 10, vote_average: NaN }), {});
  assert.deepEqual(mapearFicha({ vote_count: 1, vote_average: 0 }), { calificacion: 0 });
});

test("una respuesta malformada no se guarda como ficha vacía", () => {
  for (const respuesta of [null, [], "error"]) assert.throws(() => mapearFicha(respuesta));
});
