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
): {
  decision: "servir" | "pedir";
  servirSiFalla: boolean;
  borrar: boolean;
} {
  if (!fila) {
    return { decision: "pedir", servirSiFalla: false, borrar: false };
  }

  const edad = ahora - fila.actualizada;
  if (edad < FRESCURA_EN_MS) {
    return { decision: "servir", servirSiFalla: true, borrar: false };
  }
  return {
    decision: "pedir",
    servirSiFalla: edad < CADUCIDAD_EN_MS,
    borrar: edad >= CADUCIDAD_EN_MS,
  };
}

function mapearLista(valor: unknown): Proveedor[] {
  if (!Array.isArray(valor)) {
    throw new Error("Respuesta inválida de TMDB.");
  }

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
  if (
    typeof respuesta !== "object" ||
    respuesta === null ||
    Array.isArray(respuesta) ||
    !("results" in respuesta) ||
    typeof respuesta.results !== "object" ||
    respuesta.results === null ||
    Array.isArray(respuesta.results)
  ) {
    throw new Error("Respuesta inválida de TMDB.");
  }

  let mexico: object | null = null;
  if ("MX" in respuesta.results) {
    const valor = respuesta.results.MX;
    if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
      throw new Error("Respuesta inválida de TMDB.");
    }
    mexico = valor;
  }

  return {
    flatrate:
      mexico && "flatrate" in mexico ? mapearLista(mexico.flatrate) : [],
    renta: mexico && "rent" in mexico ? mapearLista(mexico.rent) : [],
    compra: mexico && "buy" in mexico ? mapearLista(mexico.buy) : [],
  };
}
