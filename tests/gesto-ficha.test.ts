import assert from "node:assert/strict";
import test from "node:test";
import { escucharGestoDeFicha } from "../app/gesto-ficha.ts";

for (const pointerType of ["touch", "mouse"]) {
  test(`ficha con ${pointerType}: toque, bloqueo de eje y cancelación`, () => {
    class Host extends EventTarget {
      captura: number | null = null;
      setPointerCapture(id: number) { this.captura = id; }
      hasPointerCapture(id: number) { return this.captura === id; }
      releasePointerCapture() { this.captura = null; }
    }
    const host = new Host();
    const eventos: string[] = [];
    const hoja = {
      inicio: () => eventos.push("inicio"), mover: () => eventos.push("mover"),
      fin: () => eventos.push("fin"), cancelar: () => eventos.push("cancelar"), activo: () => true,
    };
    let y = 0;
    const cartel = {
      topes: { y: 0.45 }, orientacion: () => ({ y }),
      inclinar: (x: number, destino: number) => { assert.equal(x, 0); y = destino; eventos.push("inclinar"); },
      soltar: () => eventos.push("soltar"),
    };
    const quitar = escucharGestoDeFicha(host as unknown as HTMLElement, hoja, () => cartel);
    const enviar = (nombre: string, x: number, y: number) => {
      const e = new Event(nombre, { cancelable: true });
      Object.assign(e, { pointerId: 1, isPrimary: true, button: 0, pointerType, clientX: x, clientY: y });
      host.dispatchEvent(e);
    };
    enviar("pointerdown", 0, 0);
    enviar("pointerup", 0, 0);
    assert.deepEqual(eventos, [], "un toque no abre ni cierra nada");
    enviar("pointerdown", 0, 0);
    enviar("pointermove", 80, 5);
    enviar("pointermove", 80, 150);
    enviar("pointerup", 80, 150);
    assert.deepEqual(eventos, ["inclinar", "inclinar", "soltar"], "el eje horizontal no arrastra la hoja");
    assert.ok(y > 0 && y < cartel.topes.y);
    eventos.length = 0;
    enviar("pointerdown", 0, 0);
    enviar("pointermove", 2, 80);
    enviar("pointerup", 100, 150);
    assert.deepEqual(eventos, ["inicio", "mover", "fin"], "el vertical cede a la hoja");
    eventos.length = 0;
    enviar("pointerdown", 0, 0);
    enviar("pointermove", 0, 70);
    enviar("pointercancel", 0, 70);
    assert.deepEqual(eventos, ["inicio", "mover", "cancelar"]);
    eventos.length = 0;
    enviar("pointerdown", 0, 0);
    enviar("pointermove", 0, 70);
    quitar();
    assert.equal(host.captura, null);
    assert.equal(eventos.at(-1), "cancelar");
    eventos.length = 0;
    enviar("pointerdown", 0, 0);
    enviar("pointermove", 0, 70);
    assert.deepEqual(eventos, [], "desmontar quita las escuchas");
  });
}
