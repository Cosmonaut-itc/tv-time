import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import * as THREE from "three";
import { crearTelon } from "../app/tres/telon.ts";
import { crearMarquesina } from "../app/tres/marquesina.ts";
import { crearTambores } from "../app/tres/tambores.ts";
import { crearConteo } from "../app/tres/conteo.ts";
import { crearGanador } from "../app/tres/ganador.ts";
import { tira3D } from "../app/tres/logica.ts";
import type { TituloDeSala } from "../app/cartelera.ts";

function instalarLienzo(t: TestContext) {
  const trazos: { metodo: "fillRect" | "strokeRect"; argumentos: number[]; fillStyle: unknown }[] = [];
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement() {
      return { width: 0, height: 0, getContext() {
        return {
          fillStyle: "", shadowColor: "", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
          save() {}, restore() {}, scale() {}, translate() {}, rotate() {},
          fillRect(...argumentos: number[]) { trazos.push({ metodo: "fillRect", argumentos, fillStyle: this.fillStyle }); },
          strokeRect(...argumentos: number[]) { trazos.push({ metodo: "strokeRect", argumentos, fillStyle: this.fillStyle }); },
          beginPath() {}, arc() {}, stroke() {}, moveTo() {}, lineTo() {}, fillText() {},
          createRadialGradient() { return { addColorStop() {} }; },
          measureText() { return { width: 12, actualBoundingBoxAscent: 110, actualBoundingBoxDescent: 3 }; },
        };
      } };
    },
  } });
  t.after(() => {
    if (anterior) Object.defineProperty(globalThis, "document", anterior);
    else Reflect.deleteProperty(globalThis, "document");
  });
  return trazos;
}

const titulo: TituloDeSala = { _id: "uno", tipo: "pelicula", nombre: "Soul", visto: false };

test("encuadrar reutiliza las cuerdas salvo cambios de radios mayores a la tolerancia", (t) => {
  instalarLienzo(t);
  const telon = crearTelon(new THREE.Group());
  t.after(() => telon.destruir());
  const cuerdas: THREE.Mesh<THREE.TubeGeometry, THREE.ShaderMaterial>[] = [];
  telon.grupo.traverse((objeto) => {
    if (objeto instanceof THREE.Mesh && objeto.geometry instanceof THREE.TubeGeometry &&
        objeto.geometry.parameters.closed) cuerdas.push(objeto);
  });
  assert.equal(cuerdas.length, 2);
  telon.encuadrar(2, 3);
  const primeras = cuerdas.map((cuerda) => cuerda.geometry);
  let liberadas = 0;
  primeras.forEach((geometria) => geometria.addEventListener("dispose", () => { liberadas++; }));
  telon.encuadrar(2, 3);
  cuerdas.forEach((cuerda, i) => assert.equal(cuerda.geometry, primeras[i], "misma medida conserva la geometría"));
  telon.encuadrar(2 + 1e-5, 3);
  cuerdas.forEach((cuerda, i) => assert.equal(cuerda.geometry, primeras[i], "ignora ruido menor a la tolerancia"));
  const alturas = cuerdas.map((cuerda) => cuerda.parent!.position.y);
  telon.encuadrar(2, 4);
  cuerdas.forEach((cuerda, i) => {
    assert.equal(cuerda.geometry, primeras[i], "la altura no cambia los radios");
    assert.notEqual(cuerda.parent!.position.y, alturas[i], "la posición sigue actualizándose");
  });
  assert.equal(liberadas, 0);
  telon.encuadrar(3, 4);
  cuerdas.forEach((cuerda, i) => assert.notEqual(cuerda.geometry, primeras[i], "otros radios reconstruyen la geometría"));
  assert.equal(liberadas, 2);
  const siguientes = cuerdas.map((cuerda) => cuerda.geometry);
  telon.encuadrar(3, 4);
  cuerdas.forEach((cuerda, i) => assert.equal(cuerda.geometry, siguientes[i]));
});

test("el vuelo sigue la meta vigente y una ficha tardía se acomoda sin salto", (t) => {
  instalarLienzo(t);
  const ganador = crearGanador(new THREE.Group());
  t.after(() => ganador.destruir());
  ganador.mostrar(0, titulo, 1);
  ganador.update(0.3, 0.05);
  ganador.encuadrar(1.4, -0.3);
  const meta = ganador.poseMeta();
  ganador.update(0.78, 0.05);
  for (let i = 0; i < 180; i++) ganador.update(0.78 + i / 60, 1 / 60);
  const caja = ganador.grupo.children[0];
  assert.ok(Math.abs(caja.position.y - meta.y) < 1e-12);
  assert.ok(Math.abs(caja.scale.x - meta.escala) < 1e-12);
  const antes = { y: caja.position.y, escala: caja.scale.x };
  ganador.encuadrar(1.4, 0.2);
  assert.equal(caja.position.y, antes.y);
  assert.equal(caja.scale.x, antes.escala);
  ganador.update(0.80, 0.02);
  const nueva = ganador.poseMeta();
  assert.ok(Math.abs(caja.position.y - (antes.y + (nueva.y - antes.y) * 0.16)) < 1e-12);
  assert.ok(Math.abs(caja.scale.x - (antes.escala + (nueva.escala - antes.escala) * 0.16)) < 1e-12);
  for (let i = 0; i < 140; i++) ganador.update(0.82 + i / 60, 1 / 60);
  assert.ok(Math.abs(caja.position.y - nueva.y) < 1e-8);
  ganador.esconder();
  assert.equal(ganador.enEscena(), false);
  ganador.mostrar(4, titulo, -1);
  ganador.update(4.78, 0.05);
  assert.ok(Math.abs(caja.position.y - nueva.y) < 1e-12);
});

test("telón reversible y vuelo conservan los tiempos del prototipo", (t) => {
  instalarLienzo(t);
  const telon = crearTelon(new THREE.Group());
  telon.abrir(0, true);
  telon.update(1.15, 0.05);
  assert.equal(telon.abierto, true);
  telon.abrir(1.15, false);
  telon.update(2.3, 0.05);
  assert.equal(telon.abierto, false);
  assert.ok(telon.grupo.children.slice(0, 2).every((pano) => pano.visible), "los paños nunca se esconden");
  telon.destruir();

  const ganador = crearGanador(new THREE.Group());
  ganador.mostrar(0, titulo, 1.3248, { escala: 0.94, z: -0.1466771955534908 });
  const caja = ganador.grupo.children[0];
  assert.ok(Math.abs(caja.scale.x - 0.6468817204301075) < 1e-12);
  ganador.update(0.78, 0.05);
  assert.deepEqual(caja.position.toArray(), [0, 0.62, 2.4]);
  assert.equal(caja.scale.x, 0.8);
  ganador.inclinar(99, -99);
  ganador.update(0.83, 0.05);
  assert.deepEqual(ganador.orientacion(), { x: ganador.topes.x, y: -ganador.topes.y });
  ganador.soltar();
  ganador.update(1.44, 0.05);
  assert.deepEqual(ganador.orientacion(), { x: 0, y: 0 });
  ganador.destruir();
});

test("destruir libera geometrías, materiales y texturas, incluidos números fuera de pantalla", (t) => {
  instalarLienzo(t);
  const modulos = [crearTelon(new THREE.Group()), crearMarquesina(new THREE.Group()),
    crearTambores(new THREE.Group()), crearConteo(new THREE.Group()), crearGanador(new THREE.Group())] as const;
  const [, marquesina, tambores, conteo, ganador] = modulos;
  marquesina.colocar([{ x: 10, y: -10 }, { x: 20, y: -10 }]);
  tambores.montar([tira3D(titulo, [titulo], true)]);
  ganador.mostrar(0, titulo, 0);
  type Recurso = THREE.BufferGeometry | THREE.Material | THREE.Texture;
  const recursos = new Set<Recurso>();
  const recoger = (grupo: THREE.Group) => grupo.traverse((objeto) => {
    if (!(objeto instanceof THREE.Mesh || objeto instanceof THREE.Points || objeto instanceof THREE.Sprite)) return;
    if (!(objeto instanceof THREE.Sprite)) recursos.add(objeto.geometry);
    const materiales: THREE.Material[] = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
    materiales.forEach((material) => {
      recursos.add(material);
      Object.values(material).forEach((valor: unknown) => { if (valor instanceof THREE.Texture) recursos.add(valor); });
      if (material instanceof THREE.ShaderMaterial) {
        Object.values(material.uniforms).forEach((u: THREE.IUniform<unknown>) => {
          if (u.value instanceof THREE.Texture) recursos.add(u.value);
        });
      }
    });
  });
  for (const n of [3, 2, 1]) { conteo.setNumero(n); recoger(conteo.grupo); }
  modulos.forEach((modulo) => recoger(modulo.grupo));
  const liberados = new Map<Recurso, number>();
  recursos.forEach((recurso) => recurso.addEventListener("dispose", () => {
    liberados.set(recurso, (liberados.get(recurso) ?? 0) + 1);
  }));
  modulos.forEach((modulo) => modulo.destruir());
  assert.ok(recursos.size > 40);
  recursos.forEach((recurso) => assert.equal(liberados.get(recurso), 1, String(recurso.type)));
  modulos.forEach((modulo) => assert.equal(modulo.grupo.children.length, 0));
});

 test("la meta tardía a e cercano a 0.95 no salta y converge", (t) => {
  instalarLienzo(t);
  const ganador = crearGanador(new THREE.Group());
  t.after(() => ganador.destruir());
  ganador.mostrar(0, titulo, 1);
  const caja = ganador.grupo.children[0];
  ganador.update(0.5, 1 / 60);
  const antes = caja.position.y;
  ganador.encuadrar(1.4, -0.3);
  ganador.update(0.5 + 1 / 60, 1 / 60);
  assert.ok(Math.abs(caja.position.y - antes) < 0.05, "salto menor de 0.05 unidades");
  for (let i = 2; i < 200; i++) ganador.update(0.5 + i / 60, 1 / 60);
  assert.ok(Math.abs(caja.position.y - ganador.poseMeta().y) < 1e-8);
  assert.ok(Math.abs(caja.scale.x - ganador.poseMeta().escala) < 1e-8);
});

test("el sello se estampa en mezcla normal sobre una placa oscura", (t) => {
  const trazos = instalarLienzo(t);
  const ganador = crearGanador(new THREE.Group());
  t.after(() => ganador.destruir());
  const sello = ganador.grupo.children[0].children[1].children[2] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  assert.equal(sello.material.blending, THREE.NormalBlending);
  const placa = trazos.findIndex((trazo) => trazo.metodo === "fillRect" &&
    typeof trazo.fillStyle === "string" && trazo.fillStyle.startsWith("rgba(") &&
    JSON.stringify(trazo.argumentos) === JSON.stringify([14, 14, 484, 228]));
  const marco = trazos.findIndex((trazo) => trazo.metodo === "strokeRect" &&
    JSON.stringify(trazo.argumentos) === JSON.stringify([14, 14, 484, 228]));
  assert.ok(placa >= 0 && marco > placa, "la placa oscura se dibuja antes del marco exterior");
  assert.equal(trazos[placa].fillStyle, "rgba(14, 6, 9, 0.58)");
  ganador.mostrar(0, titulo, 0);
  ganador.sellar(0, true);
  ganador.update(1, 1 / 60);
  assert.equal(sello.material.opacity, 0.94);
});

test("apagar el sello lo oculta inmediatamente y no vuelve a animarse", (t) => {
  instalarLienzo(t);
  const ganador = crearGanador(new THREE.Group());
  t.after(() => ganador.destruir());
  ganador.mostrar(0, titulo, 0);
  ganador.sellar(0, true);
  ganador.update(1, 1 / 60);
  const sello = ganador.grupo.children[0].children[1].children[2] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  assert.equal(sello.visible, true);
  assert.equal(sello.material.opacity, 0.94);
  ganador.sellar(1, false);
  assert.equal(sello.visible, false);
  assert.equal(sello.material.opacity, 0);
  ganador.update(1.6, 1 / 60);
  assert.equal(sello.material.opacity, 0);
});
