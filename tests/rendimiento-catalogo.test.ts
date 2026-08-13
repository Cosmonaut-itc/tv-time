import assert from "node:assert/strict";
import test from "node:test";
import { CATALOGO_INICIAL } from "../convex/catalogo_inicial.ts";
import {
  derivarMuro,
  mismaCeldaDePila,
  mismaCeldaDeTitulo,
  type CeldaDelMuro,
  type PilaDelMuro,
  type TituloSueltoDelMuro,
} from "../app/muro-logica.ts";

const titulos = CATALOGO_INICIAL.map((titulo, indice) => ({
  ...titulo,
  _id: `titulo-${indice}`,
  visto: false,
  agregado: indice,
}));

function pila(celdas: readonly CeldaDelMuro[], saga: string): PilaDelMuro {
  const encontrada = celdas.find(
    (actual): actual is PilaDelMuro => actual.tipo === "pila" && actual.saga === saga,
  );
  assert.ok(encontrada, `Falta la pila ${saga}`);
  return encontrada;
}

function suelta(celdas: readonly CeldaDelMuro[], id: string): TituloSueltoDelMuro {
  const encontrada = celdas.find(
    (actual): actual is TituloSueltoDelMuro =>
      actual.tipo === "titulo" && actual.titulo._id === id,
  );
  assert.ok(encontrada, `Falta la celda ${id}`);
  return encontrada;
}

test("las comparadoras saltan celdas ajenas en una instantánea nueva de Convex", () => {
  const antes = derivarMuro(titulos, { filtro: "todo", busqueda: "" });
  const despues = derivarMuro(
    titulos.map((titulo) => ({
      ...titulo,
      visto: titulo.nombre === "Dune" ? true : titulo.visto,
    })),
    { filtro: "todo", busqueda: "" },
  );

  assert.equal(mismaCeldaDePila(pila(antes.celdas, "Dune"), pila(despues.celdas, "Dune")), false);
  assert.equal(mismaCeldaDePila(pila(antes.celdas, "Tierra Media"), pila(despues.celdas, "Tierra Media")), true);
  assert.equal(mismaCeldaDeTitulo(suelta(antes.celdas, "titulo-0"), suelta(despues.celdas, "titulo-0")), true);
});

test("una serie anterior no bloquea una película de la misma saga", () => {
  const muro = derivarMuro([
    { _id: "serie", tipo: "serie", nombre: "Serie", saga: "Mixta", orden: 1, visto: false },
    { _id: "pelicula", tipo: "pelicula", nombre: "Película", saga: "Mixta", orden: 2, visto: false },
  ], { filtro: "todo", busqueda: "" });
  const mixta = pila(muro.celdas, "Mixta");
  const pelicula = mixta.visibles.find(({ titulo }) => titulo._id === "pelicula");

  assert.ok(pelicula);
  assert.equal(pelicula.bloqueada, false);
});
