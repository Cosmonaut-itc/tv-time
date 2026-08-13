import { codigoTieneFormatoValido, normalizarCodigo } from "./codigo.ts";

const FALLOS_ANTES_DE_TRABAR = 5;
const MINUTOS_TRABADA = 5;
const VENTANA_DE_FALLOS = MINUTOS_TRABADA * 60_000;

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
