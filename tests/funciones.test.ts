import assert from "node:assert/strict";
import test from "node:test";
import { derivarCartelera } from "../convex/cartelera.ts";
import {
  validarTituloDelCatalogo,
  esPrimeraFuncion,
  idsYaVistosSinFuncion,
  planParaDeshacer,
  siguienteDeSaga,
  validarEnCartelera,
  validarTituloParaFuncion,
} from "../convex/funciones_logica.ts";

/** Una saga de dos y una suelta, que es lo mínimo para ver el candado. */
const CATALOGO = [
  { _id: "duna-1", tipo: "pelicula" as const, nombre: "Duna", saga: "Duna", orden: 1, visto: false },
  { _id: "duna-2", tipo: "pelicula" as const, nombre: "Duna: Parte Dos", saga: "Duna", orden: 2, visto: false },
  { _id: "suelta", tipo: "pelicula" as const, nombre: "Soul", visto: false },
];

function carteleraDeLaNoche(vetados: string[] = []) {
  return derivarCartelera(CATALOGO, {
    filtro: "loQueSea",
    vetados: new Set(vetados),
  }).candidatos;
}

test("la mutación no cierra función sobre una saga todavía bloqueada", () => {
  assert.throws(
    () => validarEnCartelera(carteleraDeLaNoche(), "duna-2"),
    /Ese título no está en la cartelera de esta noche\./,
  );
});

test("la mutación no cierra función sobre algo vetado esta noche", () => {
  assert.throws(
    () => validarEnCartelera(carteleraDeLaNoche(["suelta"]), "suelta"),
    /Ese título no está en la cartelera de esta noche\./,
  );
});

test("lo que sí está en la cartelera pasa sin ruido", () => {
  assert.doesNotThrow(() => validarEnCartelera(carteleraDeLaNoche(), "duna-1"));
  assert.doesNotThrow(() => validarEnCartelera(carteleraDeLaNoche(), "suelta"));
});

test("rechaza un título ajeno a la sala", () => {
  assert.throws(
    () =>
      validarTituloParaFuncion(
        { salaId: "sala-ajena", visto: false },
        "sala-propia",
      ),
    /El título no pertenece a esta sala\./,
  );
});

test("rechaza un título que ya salió de la cartelera", () => {
  assert.throws(
    () =>
      validarTituloParaFuncion(
        { salaId: "sala-propia", visto: true },
        "sala-propia",
      ),
    /Ese título ya salió de la cartelera\./,
  );
});

test("detecta la primera función con el recorte acotado de filas", () => {
  assert.equal(esPrimeraFuncion(1), true);
  assert.equal(esPrimeraFuncion(2), false);
});

test("resuelve el siguiente título inmediato de la saga", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: "Duna", orden: 1 },
      [
        { nombre: "Duna", saga: "Duna", orden: 1, visto: true },
        { nombre: "Duna: Parte Dos", saga: "Duna", orden: 2, visto: false },
        { nombre: "Duna: Parte Tres", saga: "Duna", orden: 3, visto: false },
      ],
    ),
    "Duna: Parte Dos",
  );
});

test("un título sin saga no desbloquea otro", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: undefined, orden: undefined },
      [{ nombre: "Otra", saga: "Otra saga", orden: 2, visto: false }],
    ),
    null,
  );
});

test("una siguiente ya vista no se anuncia como desbloqueada", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: "Duna", orden: 1 },
      [
        { nombre: "Duna: Parte Dos", saga: "Duna", orden: 2, visto: true },
        { nombre: "Duna: Parte Tres", saga: "Duna", orden: 3, visto: false },
      ],
    ),
    null,
  );
});

test("sin el orden inmediatamente superior no anuncia otro salto de saga", () => {
  assert.equal(
    siguienteDeSaga(
      { saga: "Duna", orden: 1 },
      [{ nombre: "Duna: Parte Tres", saga: "Duna", orden: 3, visto: false }],
    ),
    null,
  );
});

test("el historial separa las funciones de los vistos sin fecha", () => {
  assert.deepEqual(
    idsYaVistosSinFuncion(
      [
        { _id: "con-funcion", visto: true },
        { _id: "ya-vista", visto: true },
        { _id: "cartelera", visto: false },
      ],
      [{ tituloId: "con-funcion" }],
    ),
    ["ya-vista"],
  );
});

test("desde el catálogo acepta títulos vistos, sin ver, bloqueados o vetados", () => {
  for (const visto of [false, true]) {
    const titulo = { salaId: "propia", visto, saga: "Duna", orden: 2, vetado: true };
    assert.doesNotThrow(() => validarTituloDelCatalogo(titulo, "propia"));
  }
});

test("desde el catálogo rechaza títulos inexistentes o de otra sala", () => {
  assert.throws(() => validarTituloDelCatalogo(null, "propia"), /no pertenece/);
  assert.throws(() => validarTituloDelCatalogo({ salaId: "ajena", visto: true }, "propia"), /no pertenece/);
});

test("deshacer devuelve a sin ver sólo cuando la función lo encontró sin ver", () => {
  assert.deepEqual(planParaDeshacer({ salaId: "propia", vistoAntes: false }, "propia", null), { titulo: { visto: false }, posterior: null });
  assert.deepEqual(planParaDeshacer({ salaId: "propia", vistoAntes: true }, "propia", null), { titulo: null, posterior: null });
  assert.deepEqual(planParaDeshacer({ salaId: "propia" }, "propia", null), { titulo: null, posterior: null });
});

test("deshacer es idempotente y no permite borrar funciones ajenas", () => {
  assert.equal(planParaDeshacer(null, "propia", null), null);
  assert.throws(() => planParaDeshacer({ salaId: "ajena", vistoAntes: false }, "propia", null), /La función no pertenece/);
});

/** Réplica mínima de registrar y deshacer sobre un título, en orden de creación. */
function historialDeUnTitulo(vistoInicial: boolean) {
  const estado = { visto: vistoInicial };
  const funciones: { id: string; salaId: "sala"; vistoAntes?: boolean }[] = [];
  return {
    estado,
    funciones,
    registrar(id: string) {
      funciones.push({ id, salaId: "sala", vistoAntes: estado.visto });
      estado.visto = true;
    },
    cerrarRuleta(id: string) {
      funciones.push({ id, salaId: "sala" });
      estado.visto = true;
    },
    marcar(visto: boolean) {
      estado.visto = visto;
    },
    deshacer(id: string) {
      const i = funciones.findIndex((f) => f.id === id);
      const plan = planParaDeshacer(funciones[i] ?? null, "sala", funciones[i + 1] ?? null);
      if (!plan) return;
      if (plan.posterior) Object.assign(funciones[i + 1], plan.posterior);
      if (plan.titulo) Object.assign(estado, plan.titulo);
      funciones.splice(i, 1);
    },
  };
}

const ORDENES_DE_TRES = [["a", "b", "c"], ["a", "c", "b"], ["b", "a", "c"], ["b", "c", "a"], ["c", "a", "b"], ["c", "b", "a"]];

test("deshacer todos los registros, en cualquier orden, devuelve el título a como estaba", () => {
  for (const vistoInicial of [false, true]) {
    for (const orden of ORDENES_DE_TRES) {
      const h = historialDeUnTitulo(vistoInicial);
      ["a", "b", "c"].forEach((id) => h.registrar(id));
      orden.forEach((id, paso) => {
        h.deshacer(id);
        const quedan = paso < orden.length - 1;
        assert.equal(h.estado.visto, quedan || vistoInicial, `${vistoInicial} ${orden.join("")} paso ${paso}`);
      });
      assert.deepEqual(h.funciones, []);
    }
  }
});

test("deshacer no cuenta las funciones anteriores ni borra lo que hizo la ruleta", () => {
  const vueltaACartelera = historialDeUnTitulo(false);
  vueltaACartelera.cerrarRuleta("ruleta");
  vueltaACartelera.marcar(false);
  vueltaACartelera.registrar("hoy");
  vueltaACartelera.deshacer("hoy");
  assert.equal(vueltaACartelera.estado.visto, false);
  assert.deepEqual(vueltaACartelera.funciones.map((f) => f.id), ["ruleta"]);

  const ruletaDespues = historialDeUnTitulo(false);
  ruletaDespues.registrar("catalogo");
  ruletaDespues.marcar(false);
  ruletaDespues.cerrarRuleta("ruleta");
  ruletaDespues.deshacer("catalogo");
  assert.equal(ruletaDespues.estado.visto, true);
});
