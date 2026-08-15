export const CLAVE_LLAVERO = "cine.llavero";
export const MAXIMO_DEL_LLAVERO = 8;

export type SalaDelLlavero = {
  salaId: string;
  codigo: string;
  butacas: string[];
  titulos: number;
};

function esSalaDelLlavero(valor: unknown): valor is SalaDelLlavero {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const sala = valor as Record<string, unknown>;
  return typeof sala.salaId === "string" &&
    typeof sala.codigo === "string" &&
    Array.isArray(sala.butacas) &&
    sala.butacas.every((butaca) => typeof butaca === "string") &&
    typeof sala.titulos === "number";
}

export function leerLlavero(crudo: string | null): SalaDelLlavero[] {
  if (!crudo) return [];
  try {
    const valor: unknown = JSON.parse(crudo);
    return Array.isArray(valor) ? valor.filter(esSalaDelLlavero) : [];
  } catch {
    return [];
  }
}

export function recordarSala(
  llavero: readonly SalaDelLlavero[],
  sala: SalaDelLlavero,
): SalaDelLlavero[] {
  const indice = llavero.findIndex((otra) => otra.salaId === sala.salaId);
  if (indice >= 0) return llavero.map((otra, actual) => actual === indice ? sala : otra);

  const actualizado = [...llavero, sala];
  return actualizado.length > MAXIMO_DEL_LLAVERO ? actualizado.slice(1) : actualizado;
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
