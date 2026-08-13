import { createElement } from "react";

export default function TelonDeEntrada() {
  return createElement(
    "div",
    { className: "telon-de-entrada", "aria-hidden": true },
    createElement("div", { className: "telon-de-entrada__cenefa" }),
    createElement("div", {
      className:
        "telon-de-entrada__cortina telon-de-entrada__cortina--izquierda",
    }),
    createElement("div", {
      className:
        "telon-de-entrada__cortina telon-de-entrada__cortina--derecha",
    })
  );
}
