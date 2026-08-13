import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  decidirLlegadaSala,
  decidirRecargaSala,
} from "../app/telon-de-entrada-logica.ts";
import TelonDeEntrada from "../app/telon-de-entrada.ts";

test("la sala sólo llega al conectar de verdad con Convex", () => {
  assert.equal(
    decidirLlegadaSala(false, {
      isWebSocketConnected: false,
      hasEverConnected: false,
    }),
    false,
  );
  assert.equal(
    decidirLlegadaSala(false, {
      isWebSocketConnected: true,
      hasEverConnected: false,
    }),
    true,
  );
  assert.equal(
    decidirLlegadaSala(false, {
      isWebSocketConnected: false,
      hasEverConnected: true,
    }),
    true,
  );
});

test("la reconexión abre sola y la puerta no vuelve a cerrarse", () => {
  let salaLlego = decidirLlegadaSala(false, {
    isWebSocketConnected: false,
    hasEverConnected: false,
  });
  assert.equal(salaLlego, false);

  salaLlego = decidirLlegadaSala(salaLlego, {
    isWebSocketConnected: true,
    hasEverConnected: false,
  });
  assert.equal(salaLlego, true);

  salaLlego = decidirLlegadaSala(salaLlego, {
      isWebSocketConnected: false,
      hasEverConnected: false,
  });
  assert.equal(salaLlego, true);
});

test("online sólo empuja una recarga antes de la primera llegada", () => {
  assert.equal(
    decidirRecargaSala({
      navegadorEnLinea: false,
      recargaYaSolicitada: false,
      salaYaLlego: false,
    }),
    false,
  );
  assert.equal(
    decidirRecargaSala({
      navegadorEnLinea: true,
      recargaYaSolicitada: false,
      salaYaLlego: false,
    }),
    true,
  );
  assert.equal(
    decidirRecargaSala({
      navegadorEnLinea: true,
      recargaYaSolicitada: false,
      salaYaLlego: true,
    }),
    false,
  );
  assert.equal(
    decidirRecargaSala({
      navegadorEnLinea: true,
      recargaYaSolicitada: true,
      salaYaLlego: false,
    }),
    false,
  );
});

test("el HTML inicial deja el cartel accesible y el telón decorativo", () => {
  const html = renderToStaticMarkup(createElement(TelonDeEntrada));

  assert.match(html, /^<div class="telon-de-entrada">/);
  assert.equal(
    html.match(/telon-de-entrada__cortina(?: |")/g)?.length,
    2
  );
  assert.equal(html.match(/aria-hidden="true"/g)?.length, 3);
  assert.match(html, /role="status"/);
  assert.match(html, /La sala está a oscuras/);
  assert.match(html, /No hay red/);
  assert.match(html, /El telón se abrirá solo cuando vuelva/);
});
