import assert from "node:assert/strict";
import test from "node:test";
import { enlacesTelon } from "../app/telon-arranque.ts";

test("la matriz conserva el contrato actual", () => {
  const enlaces = enlacesTelon("matriz-jpeg");
  assert.equal(enlaces.length, 12);
  assert.equal(enlaces[0], "/telon/comodin.jpg");
});

test("png-unico emite exactamente un recurso sin media", () => {
  assert.deepEqual(enlacesTelon("png-unico"), [
    "/telon/1320x2868-ios26-v1.png",
  ]);
});

test("jpeg-unico cambia sólo el formato y la URL", () => {
  assert.deepEqual(enlacesTelon("jpeg-unico"), [
    "/telon/1320x2868.jpg",
  ]);
});

test("png-media-safari une la geometría de instalación con el panel real", () => {
  assert.deepEqual(enlacesTelon("png-media-safari"), [
    {
      url: "/telon/1320x2868-ios26-v1.png",
      media:
        "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
    },
  ]);
});

test("una variante desconocida invalida el build", () => {
  assert.throws(() => enlacesTelon("inventada"), /Variante de telón desconocida/);
});
