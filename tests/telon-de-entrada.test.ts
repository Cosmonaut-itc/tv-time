import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TelonDeEntrada from "../app/telon-de-entrada.ts";

test("el HTML inicial contiene una capa decorativa con dos cortinas", () => {
  const html = renderToStaticMarkup(createElement(TelonDeEntrada));

  assert.match(html, /^<div class="telon-de-entrada" aria-hidden="true">/);
  assert.equal(
    html.match(/telon-de-entrada__cortina(?: |")/g)?.length,
    2
  );
});
