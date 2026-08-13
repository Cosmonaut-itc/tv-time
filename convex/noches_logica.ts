import { nocheDe } from "./noche.ts";
import {
  derivarCartelera,
  VETOS_POR_NOCHE,
  type FiltroCartelera,
  type TituloDeSala,
} from "./cartelera.ts";

export type NocheParaVeto<
  NocheId extends string,
  SalaId extends string = NocheId,
  TituloId extends string = SalaId,
> = {
  _id: NocheId;
  salaId: SalaId;
  corte: number;
  vetosGastados: number;
  vetados: TituloId[];
};

type TituloParaVeto<TituloId extends string, SalaId extends string> = {
  _id: TituloId;
  salaId: SalaId;
};

type DependenciasVeto<
  SalaId extends string,
  TituloId extends string,
  NocheId extends string,
> = {
  ahora: () => number;
  buscarTitulo: (
    tituloId: TituloId,
  ) => Promise<TituloParaVeto<TituloId, SalaId> | null>;
  buscarTitulosDeSala: (salaId: SalaId) => Promise<readonly TituloDeSala[]>;
  buscarNoche: (
    salaId: SalaId,
    corte: number,
  ) => Promise<NocheParaVeto<NocheId, SalaId, TituloId> | null>;
  crearNoche: (
    noche: Omit<NocheParaVeto<NocheId, SalaId, TituloId>, "_id">,
  ) => Promise<NocheParaVeto<NocheId, SalaId, TituloId>>;
  guardarNoche: (
    noche: NocheParaVeto<NocheId, SalaId, TituloId>,
  ) => Promise<void>;
};

export async function vetarEnNoche<
  SalaId extends string,
  TituloId extends string,
  NocheId extends string,
>(
  dependencias: DependenciasVeto<SalaId, TituloId, NocheId>,
  {
    salaId,
    tituloId,
    filtro,
  }: { salaId: SalaId; tituloId: TituloId; filtro: FiltroCartelera },
): Promise<NocheParaVeto<NocheId, SalaId, TituloId>> {
  const titulo = await dependencias.buscarTitulo(tituloId);
  if (!titulo || titulo.salaId !== salaId) {
    throw new Error("El título no pertenece a esta sala.");
  }

  const corte = nocheDe(dependencias.ahora());
  const existente = await dependencias.buscarNoche(salaId, corte);
  if (existente?.vetados.includes(tituloId)) {
    throw new Error("El título ya está vetado esta noche.");
  }
  if (existente && existente.vetosGastados >= VETOS_POR_NOCHE) {
    throw new Error("La noche ya gastó sus dos vetos.");
  }

  const titulos = await dependencias.buscarTitulosDeSala(salaId);
  const cartelera = derivarCartelera(titulos, {
    filtro,
    vetados: new Set(existente?.vetados ?? []),
  });
  if (cartelera.candidatos.length <= 1) {
    throw new Error("Con un solo título en la cartelera, el veto se apaga.");
  }

  if (!existente) {
    return await dependencias.crearNoche({
      salaId,
      corte,
      vetosGastados: 1,
      vetados: [tituloId],
    });
  }

  const nueva = {
    ...existente,
    vetosGastados: existente.vetosGastados + 1,
    vetados: [...existente.vetados, tituloId],
  };
  await dependencias.guardarNoche(nueva);
  return nueva;
}
