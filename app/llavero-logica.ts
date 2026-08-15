export const CLAVE_LLAVERO = "cine.llavero";
export const MAXIMO_DEL_LLAVERO = 8;
const BUTACAS_POR_SALA = 2;

export type SalaDelLlavero = {
  salaId: string;
  codigo: string;
  butacas: string[];
  titulos: number;
};

// Lo que se lee del navegador no es un dato de confianza: lo escribió esta app
// pero pudo quedar a medias, de una versión vieja o editado a mano. Una entrada
// que no cumple el contrato entero se descarta, porque una llave incompleta
// manda a la taquilla sin explicar por qué.
function esSalaDelLlavero(valor: unknown): valor is SalaDelLlavero {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const sala = valor as Record<string, unknown>;
  return typeof sala.salaId === "string" && sala.salaId !== "" &&
    typeof sala.codigo === "string" && sala.codigo !== "" &&
    Array.isArray(sala.butacas) &&
    sala.butacas.length === BUTACAS_POR_SALA &&
    sala.butacas.every((butaca) => typeof butaca === "string" && butaca !== "") &&
    typeof sala.titulos === "number" &&
    Number.isFinite(sala.titulos) &&
    sala.titulos >= 0;
}

export function leerLlavero(crudo: string | null): SalaDelLlavero[] {
  if (!crudo) return [];
  let valor: unknown;
  try {
    valor = JSON.parse(crudo);
  } catch {
    return [];
  }
  if (!Array.isArray(valor)) return [];

  const vistas = new Set<string>();
  const salas: SalaDelLlavero[] = [];
  for (const entrada of valor) {
    if (!esSalaDelLlavero(entrada) || vistas.has(entrada.salaId)) continue;
    vistas.add(entrada.salaId);
    salas.push(entrada);
  }
  return salas.slice(-MAXIMO_DEL_LLAVERO);
}

export function recordarSala(
  llavero: readonly SalaDelLlavero[],
  sala: SalaDelLlavero,
  salaPuesta?: string,
): SalaDelLlavero[] {
  const indice = llavero.findIndex((otra) => otra.salaId === sala.salaId);
  if (indice >= 0) return llavero.map((otra, actual) => actual === indice ? sala : otra);

  const actualizado = [...llavero, sala];
  if (actualizado.length <= MAXIMO_DEL_LLAVERO) return actualizado;

  // El llavero se poda por la punta más vieja, pero nunca por la sala en la que
  // estás: quedarte adentro sin su llave es justo lo que el llavero evita.
  const desalojada = actualizado.findIndex(
    (otra) => otra.salaId !== salaPuesta && otra.salaId !== sala.salaId,
  );
  return actualizado.filter((_, actual) => actual !== (desalojada >= 0 ? desalojada : 0));
}

export function olvidarSala(
  llavero: readonly SalaDelLlavero[],
  salaId: string,
): SalaDelLlavero[] {
  return llavero.filter((sala) => sala.salaId !== salaId);
}

export function nombreDeSala(butacas: readonly string[]): string {
  return butacas.join(" y ");
}
