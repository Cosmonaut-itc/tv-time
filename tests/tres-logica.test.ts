import assert from "node:assert/strict";
import test from "node:test";
import type { TituloDeSala } from "../app/cartelera.ts";
import { tira3D } from "../app/tres/logica.ts";

const titulo = (_id: string): TituloDeSala => ({
  _id, nombre: _id, tipo: "pelicula", visto: false,
});

test("la proyección de la banda de escritorio llega al plano del ganador", async () => {
  const { fraccionAMundo } = await import("../app/tres/logica.ts");
  const vista = { alto: 6, distancia: 3 / Math.tan(17 * Math.PI / 180), z: 2.4 };
  assert.equal(fraccionAMundo({ ...vista, fraccion: 0.5 }), 0);
  assert.ok(Math.abs(fraccionAMundo({ ...vista, fraccion: 84 / 430 }) - 1.3808291802) < 1e-9);
  assert.ok(Math.abs(fraccionAMundo({ ...vista, fraccion: 244 / 430 }) + 0.3056797422) < 1e-9);
});

for (const caso of [
  { nombre: "escritorio", banda: 430, ficha: 268, escala: 0.756, altura: 219 },
  { nombre: "iPhone", banda: 442, ficha: 280, escala: 0.772, altura: 230 },
]) test(`${caso.nombre} ancla el marco al techo aprobado y deja margen sólo sobre la ficha`, async () => {
  const { fraccionAMundo, poseDelGanador } = await import("../app/tres/logica.ts");
  const { ALTO_MARCO_GANADOR, TECHO_GANADOR } = await import("../app/tres/medidas.ts");
  const distancia = 3 / Math.tan(17 * Math.PI / 180);
  const proyectar = (fraccion: number) => fraccionAMundo({ fraccion, alto: 6, distancia, z: 2.4 });
  assert.ok(Math.abs(TECHO_GANADOR - 1.84) < 1e-12);
  const techo = TECHO_GANADOR, suelo = proyectar(caso.ficha / caso.banda);
  const pose = poseDelGanador({ techo, suelo, altoMarco: ALTO_MARCO_GANADOR, margen: proyectar(0) * 0.04 });
  const mitad = ALTO_MARCO_GANADOR * pose.escala / 2;
  assert.ok(Math.abs(pose.y + mitad - techo) < 1e-12);
  assert.ok(Math.abs(pose.y - mitad - suelo - proyectar(0) * 0.04) < 1e-12);
  assert.ok(Math.abs(pose.escala - caso.escala) < 0.001);
  const camara = new (await import("three")).PerspectiveCamera(34, 1, 0.1, 60);
  camara.position.z = distancia;
  camara.updateMatrixWorld();
  const { Vector3 } = await import("three");
  const inferiorPx = (1 - new Vector3(0, pose.y - mitad, 2.4).project(camara).y) * caso.banda / 2;
  const superiorPx = (1 - new Vector3(0, pose.y + mitad, 2.4).project(camara).y) * caso.banda / 2;
  assert.ok(Math.abs(inferiorPx - (caso.ficha - caso.banda * 0.02)) < 1e-9);
  assert.ok(Math.abs(inferiorPx - superiorPx - caso.altura) < 1);
});

test("iPhone con ficha a 320 px y sin ficha conservan exactamente la pose histórica", async () => {
  const { fraccionAMundo, poseDelGanador } = await import("../app/tres/logica.ts");
  const vista = { alto: 6, distancia: 3 / Math.tan(17 * Math.PI / 180), z: 2.4 };
  const margen = fraccionAMundo({ ...vista, fraccion: 0 }) * 0.04;
  for (const suelo of [fraccionAMundo({ ...vista, fraccion: 320 / 442 }), -Infinity]) {
    assert.deepEqual(poseDelGanador({ techo: 1.84, suelo, altoMarco: 3.05, margen }), { y: 0.62, escala: 0.80 });
  }
});

test("el ganador nunca baja de escala 0.5 aunque el hueco no alcance", async () => {
  const { poseDelGanador } = await import("../app/tres/logica.ts");
  for (const suelo of [0.9, 1.2]) {
    const pose = poseDelGanador({ techo: 1, suelo, altoMarco: 3.05, margen: 0.1 });
    assert.equal(pose.escala, 0.5);
    assert.ok(Math.abs(pose.y + 3.05 * pose.escala / 2 - 1) < 1e-12);
  }
});

test("la tira deja al finalista en el destino y excluye copias por _id del relleno", () => {
  const finalista = titulo("a");
  const candidatos = [titulo("a"), titulo("b"), titulo("c")];
  const original = [...candidatos];
  const tira = tira3D(finalista, candidatos, false, () => 0.5);
  assert.equal(tira.celdas.length, 8);
  assert.equal(tira.destino, 4);
  assert.equal(tira.celdas[4], finalista);
  assert.equal(tira.celdas.filter((t) => t._id === finalista._id).length, 1);
  assert.deepEqual(candidatos, original);
});

test("la zona muerta es continua, simétrica y recorta los extremos", async () => {
  const { fuera } = await import("../app/tres/logica.ts");
  assert.equal(fuera(2.6, 26), 0);
  assert.equal(fuera(-2.6, 26), 0);
  assert.ok(Math.abs(fuera(14.3, 26) - 0.5) < 1e-12);
  assert.ok(Math.abs(fuera(-14.3, 26) + 0.5) < 1e-12);
  assert.equal(fuera(50, 26), 1);
  assert.equal(fuera(-50, 26), -1);
});

test("el arrastre conserva el ángulo inicial y satura suavemente a 130 px", async () => {
  const { saturar } = await import("../app/tres/logica.ts");
  assert.ok(Math.abs(saturar(0, 0.5, 0.2) - 0.2) < 1e-12);
  assert.ok(Math.abs(saturar(130, 1, 0) - 0.7615941559557649) < 1e-12);
  assert.equal(saturar(1e6, 0.5, 0), 0.5);
  assert.equal(saturar(-1e6, 0.5, 0), -0.5);
  assert.ok(Number.isFinite(saturar(0, 0.5, 0.5)));
});

test("el reloj sostiene 60 durante el gesto, el despertar y las fases animadas", async () => {
  const { cuadrosPorSegundo } = await import("../app/tres/logica.ts");
  const quieto = { arrastrando: false, reloj: 10, altoHasta: 10, fase: "reposo" as const };
  assert.equal(cuadrosPorSegundo(quieto), 20);
  assert.equal(cuadrosPorSegundo({ ...quieto, arrastrando: true }), 60);
  assert.equal(cuadrosPorSegundo({ ...quieto, altoHasta: 10.01 }), 60);
  for (const fase of ["conteo", "girando", "finalistas", "vetando"] as const) {
    assert.equal(cuadrosPorSegundo({ ...quieto, fase }), 60);
  }
  for (const fase of ["ganador", "funcion"] as const) {
    assert.equal(cuadrosPorSegundo({ ...quieto, fase }), 20);
  }
});

test("el vuelo empieza con el ancho aparente del tambor", async () => {
  const { escalaDeVuelo } = await import("../app/tres/logica.ts");
  assert.ok(Math.abs(escalaDeVuelo() - 0.6468817204301075) < 1e-12);
});

test("la tira quieta arranca de frente y una cartelera vacía usa el finalista", () => {
  const a = titulo("a");
  const quieta = tira3D(a, [titulo("b")], true, () => 0.999);
  assert.equal(quieta.destino, 0);
  assert.equal(quieta.celdas[0], a);
  assert.deepEqual(quieta.celdas.slice(1).map((t) => t._id), Array(7).fill("b"));
  const sola = tira3D(a, [], false, () => 0.999);
  assert.equal(sola.destino, 7);
  assert.ok(sola.celdas.every((t) => t === a));
});

test("Fisher–Yates consume el azar inyectado sin alterar la entrada", async () => {
  const { barajar } = await import("../app/tres/logica.ts");
  const original = [1, 2, 3];
  let llamadas = 0;
  assert.deepEqual(barajar(original, () => { llamadas += 1; return 0; }), [2, 3, 1]);
  assert.equal(llamadas, 2);
  assert.deepEqual(original, [1, 2, 3]);
});
