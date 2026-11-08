import assert from "node:assert/strict";
import test from "node:test";
import type { TituloDeSala } from "../app/cartelera.ts";
import { derivarCartelera } from "../app/cartelera.ts";
import { prepararGiro } from "../app/giro.ts";
import { finalistasDeRuleta, podarRuleta, razonSinRuleta } from "../app/ruleta-logica.ts";

const titulo = (_id: string, campos: Partial<TituloDeSala> = {}): TituloDeSala => ({
  _id, nombre: _id, tipo: "pelicula", visto: false, ...campos,
});
const a = titulo("a");
const b = titulo("b", { tipo: "serie" });
const c = titulo("c");
const d = titulo("d");
const vacio = new Set<string>();

test("tres marcadas son las finalistas sin primer acto e ignoran el filtro", () => {
  const catalogo = [a, b, c, d];
  assert.equal(derivarCartelera(catalogo, { filtro: "pelicula", vetados: vacio }).candidatos.includes(b), false);
  const candidatas = finalistasDeRuleta(["b", "c", "a"], catalogo, vacio);
  assert.deepEqual(prepararGiro(candidatas, true), { finalistas: [b, c, a], primerActo: false });
  assert.deepEqual(catalogo, [a, b, c, d]);
});

test("razones: vista, saga, veto y ruleta llena; una marcada se puede desmarcar", () => {
  const primera = titulo("primera", { saga: "Saga", orden: 1 });
  const segunda = titulo("segunda", { saga: "Saga", orden: 2 });
  const catalogo = [a, b, c, d, primera, segunda];
  assert.equal(razonSinRuleta({ ...a, visto: true }, catalogo, vacio, []), "Ya la vieron.");
  assert.equal(razonSinRuleta(segunda, catalogo, new Set(["segunda"]), ["a", "b", "c"]), "Primero va «primera».");
  assert.equal(razonSinRuleta(d, catalogo, new Set(["d"]), []), "La vetaron esta noche.");
  assert.equal(razonSinRuleta(d, catalogo, vacio, ["a", "b", "c"]), "La ruleta ya tiene tres.");
  assert.equal(razonSinRuleta(a, catalogo, vacio, ["a", "b", "c"]), null);
});

test("la poda quita vistas, vetadas, borradas y bloqueadas sin alterar el orden", () => {
  const primera = titulo("primera", { saga: "Saga", orden: 1 });
  const segunda = titulo("segunda", { saga: "Saga", orden: 2 });
  assert.deepEqual(podarRuleta(["b", "a", "c"], [{ ...a, visto: true }, b, c], new Set(["c"])), ["b"]);
  assert.deepEqual(podarRuleta(["b", "b", "borrada", "segunda"], [b, primera, segunda], vacio), ["b"]);
  assert.deepEqual(podarRuleta(["segunda"], [{ ...primera, visto: true }, segunda], vacio), ["segunda"]);
});

test("un veto conserva las otras dos como duelo y el segundo deja una sola", () => {
  const ids = ["a", "b", "c"];
  const duelo = finalistasDeRuleta(ids, [a, b, c, d], new Set(["b"]));
  assert.deepEqual(prepararGiro(duelo, true), { finalistas: [a, c], primerActo: false });
  assert.deepEqual(finalistasDeRuleta(ids, [a, b, c, d], new Set(["b", "a"])), [c]);
});

test("una marca inválida no llena la ruleta ni bloquea una serie con saga", () => {
  assert.equal(razonSinRuleta(d, [a, b, c, d], new Set(["a"]), ["a", "b", "c"]), null);
  const serie = { ...b, saga: "Mixta", orden: 2 };
  assert.equal(razonSinRuleta(serie, [titulo("previa", { saga: "Mixta", orden: 1 }), serie], vacio, []), null);
});
