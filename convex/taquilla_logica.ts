import { codigoTieneFormatoValido, normalizarCodigo } from "./codigo.ts";

const FALLOS_ANTES_DE_TRABAR = 5;
const MINUTOS_TRABADA = 5;
const VENTANA_DE_FALLOS = MINUTOS_TRABADA * 60_000;

export const LARGO_MAXIMO_BUTACA = 14;

// Un nombre de butaca se va a leer en una pantalla, así que tiene que verse.
// `trim` no quita los caracteres de formato —el espacio de ancho cero entre
// ellos—, y sin NFC «José» y «Jose» + acento combinante son dos cadenas
// distintas que la sala dibujaría idénticas: dos butacas indistinguibles.
export function limpiarNombreDeButaca(nombre: string): string {
  return nombre.normalize("NFC").replace(/\p{Cf}/gu, "").trim();
}

export function normalizarButacas(butacas: readonly string[]): [string, string] | null {
  if (butacas.length !== 2) return null;

  const [primera, segunda] = butacas.map(limpiarNombreDeButaca);
  if (
    !primera ||
    !segunda ||
    primera.length > LARGO_MAXIMO_BUTACA ||
    segunda.length > LARGO_MAXIMO_BUTACA ||
    primera.toLocaleLowerCase("es") === segunda.toLocaleLowerCase("es")
  ) {
    return null;
  }

  return [primera, segunda];
}

export type FrenoTaquilla = {
  fallosSeguidos: number;
  trabadaHasta?: number;
  actualizada: number;
};

type SalaTaquilla<SalaId extends string> = {
  salaId: SalaId;
  codigo: string;
  butacas: string[];
};

type DependenciasTaquilla<SalaId extends string> = {
  ahora: () => number;
  buscarSala: (codigo: string) => Promise<SalaTaquilla<SalaId> | null>;
  leerFreno: () => Promise<FrenoTaquilla | null>;
  guardarFreno: (freno: FrenoTaquilla) => Promise<void>;
  limpiarFreno: () => Promise<void>;
};

type DependenciasRotacion = {
  generarCodigo: () => string;
  codigoEstaTomado: (codigo: string) => Promise<boolean>;
};

export async function elegirCodigoNuevo(
  dependencias: DependenciasRotacion,
  { codigoActual }: { codigoActual: string },
): Promise<string | null> {
  for (let intento = 0; intento < 16; intento += 1) {
    const candidato = dependencias.generarCodigo();
    if (candidato !== codigoActual && !(await dependencias.codigoEstaTomado(candidato))) {
      return candidato;
    }
  }
  return null;
}

export async function entrarConFreno<SalaId extends string>(
  dependencias: DependenciasTaquilla<SalaId>,
  { codigo }: { codigo: string },
) {
  const normalizado = normalizarCodigo(codigo);
  const sala = codigoTieneFormatoValido(normalizado)
    ? await dependencias.buscarSala(normalizado)
    : null;

  if (sala) {
    await dependencias.limpiarFreno();
    return {
      estado: "abierta" as const,
      salaId: sala.salaId,
      codigo: sala.codigo,
      butacas: sala.butacas,
    };
  }

  const ahora = dependencias.ahora();
  const freno = await dependencias.leerFreno();
  if (freno?.trabadaHasta && freno.trabadaHasta > ahora) {
    return {
      estado: "trabada" as const,
      mensaje: "La taquilla está trabada por varios intentos. Prueba de nuevo en unos minutos.",
      esperaMs: freno.trabadaHasta - ahora,
    };
  }

  const frenoVigente =
    freno &&
    freno.trabadaHasta === undefined &&
    ahora - freno.actualizada < VENTANA_DE_FALLOS;
  const fallosSeguidos = (frenoVigente ? freno.fallosSeguidos : 0) + 1;
  const trabadaHasta =
    fallosSeguidos >= FALLOS_ANTES_DE_TRABAR ? ahora + MINUTOS_TRABADA * 60_000 : undefined;
  await dependencias.guardarFreno({ fallosSeguidos, trabadaHasta, actualizada: ahora });

  return trabadaHasta
    ? {
        estado: "trabada" as const,
        mensaje: "La taquilla está trabada por varios intentos. Prueba de nuevo en cinco minutos.",
        esperaMs: trabadaHasta - ahora,
      }
    : {
        estado: "cerrada" as const,
        mensaje: "No hay ninguna sala con ese código.",
        intentosRestantes: FALLOS_ANTES_DE_TRABAR - fallosSeguidos,
      };
}
