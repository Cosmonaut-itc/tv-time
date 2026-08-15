import { limpiarNombreDeButaca } from "../convex/taquilla_logica.ts";

// Quién firma la sala es una decisión de presentación y por eso vive en `app/`:
// el servidor no tiene nada que opinar sobre esto, y ninguna sala guarda un
// campo que diga de quién es. La casa se reconoce por sus dos butacas, que es
// la misma identidad que el llavero enseña.
const BUTACAS_DE_LA_CASA = ["Félix", "Sofía"];

// La misma limpieza que la taquilla, aplicada también a los nombres de aquí:
// un fuente guardado con los acentos sueltos dibujaría «Félix» igual y no
// coincidiría con nada, y la firma desaparecería sin que se viera por qué.
function comparable(nombre: string): string {
  return limpiarNombreDeButaca(nombre).toLocaleLowerCase("es");
}

export function esLaSalaDeLaCasa(butacas: readonly string[]): boolean {
  if (butacas.length !== 2) return false;

  const nombres = butacas.map(comparable);
  return BUTACAS_DE_LA_CASA.every((butaca) => nombres.includes(comparable(butaca)));
}
