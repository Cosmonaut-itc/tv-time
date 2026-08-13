import { createElement } from "react";

export default function TelonDeEntrada() {
  return createElement(
    "div",
    { className: "telon-de-entrada" },
    createElement("div", {
      className: "telon-de-entrada__cenefa",
      "aria-hidden": true,
    }),
    createElement("div", {
      className:
        "telon-de-entrada__cortina telon-de-entrada__cortina--izquierda",
      "aria-hidden": true,
    }),
    createElement("div", {
      className:
        "telon-de-entrada__cortina telon-de-entrada__cortina--derecha",
      "aria-hidden": true,
    }),
    createElement(
      "div",
      { className: "telon-de-entrada__cartel", role: "status" },
      createElement(
        "p",
        { className: "telon-de-entrada__rotulo" },
        "La sala está a oscuras",
      ),
      createElement(
        "p",
        { className: "telon-de-entrada__mensaje" },
        "No hay red. El telón se abrirá solo cuando vuelva.",
      ),
    ),
  );
}
