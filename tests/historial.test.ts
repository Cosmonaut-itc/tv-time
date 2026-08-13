import assert from "node:assert/strict";
import test from "node:test";
import {
  formatearFechaDeFuncion,
  mismaFilaDeFuncion,
} from "../app/historial-logica.ts";

const funcion = {
  _id: "funcion-1",
  fecha: Date.parse("2026-08-13T12:00:00.000Z"),
  titulo: { _id: "titulo-1", tipo: "pelicula" as const, nombre: "Duna", anio: 2021 },
};

test("una instantánea nueva no repinta una función que no cambió", () => {
  assert.equal(mismaFilaDeFuncion(funcion, { ...funcion, titulo: { ...funcion.titulo } }), true);
  assert.equal(mismaFilaDeFuncion(funcion, { ...funcion, fecha: funcion.fecha + 1 }), false);
});

test("la función muestra una fecha legible y la mitad sin fecha no la inventa", () => {
  assert.equal(formatearFechaDeFuncion(funcion.fecha).includes("2026"), true);
});
