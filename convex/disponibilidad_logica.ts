const DIA_EN_MS = 24 * 60 * 60 * 1000;
const FRESCURA_EN_MS = 7 * DIA_EN_MS;
const CADUCIDAD_EN_MS = 180 * DIA_EN_MS;

export type Proveedor = { nombre: string; logoPath: string };

export type DisponibilidadMapeada = {
  flatrate: Proveedor[];
  renta: Proveedor[];
  compra: Proveedor[];
};

export function politicaDeCache(
  fila: { actualizada: number } | null,
  ahora: number,
): { decision: "servir" | "pedir"; servirSiFalla: boolean } {
  if (!fila) return { decision: "pedir", servirSiFalla: false };

  const edad = ahora - fila.actualizada;
  if (edad < FRESCURA_EN_MS) {
    return { decision: "servir", servirSiFalla: true };
  }
  return {
    decision: "pedir",
    servirSiFalla: edad < CADUCIDAD_EN_MS,
  };
}

function mapearLista(valor: unknown): Proveedor[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((proveedor) => {
    if (
      typeof proveedor !== "object" ||
      proveedor === null ||
      !("provider_name" in proveedor) ||
      !("logo_path" in proveedor) ||
      typeof proveedor.provider_name !== "string" ||
      typeof proveedor.logo_path !== "string"
    ) {
      return [];
    }
    return [{ nombre: proveedor.provider_name, logoPath: proveedor.logo_path }];
  });
}

export function mapearDisponibilidadDeMexico(
  respuesta: unknown,
): DisponibilidadMapeada {
  const mexico =
    typeof respuesta === "object" &&
    respuesta !== null &&
    "results" in respuesta &&
    typeof respuesta.results === "object" &&
    respuesta.results !== null &&
    "MX" in respuesta.results &&
    typeof respuesta.results.MX === "object" &&
    respuesta.results.MX !== null
      ? respuesta.results.MX
      : null;

  return {
    flatrate: mapearLista(mexico && "flatrate" in mexico ? mexico.flatrate : null),
    renta: mapearLista(mexico && "rent" in mexico ? mexico.rent : null),
    compra: mapearLista(mexico && "buy" in mexico ? mexico.buy : null),
  };
}
