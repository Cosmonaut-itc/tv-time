import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { CATALOGO_INICIAL, type TituloInicial } from "./catalogo_inicial";
import { generarCodigo } from "./codigo";
import {
  agregadoDelIndice,
  baseDeAgregados,
  clasificarCatalogo,
  datosDeSiembraVigentes,
  indiceDeTitulo,
} from "./siembra_catalogo";

const tituloResuelto = v.object({
  tipo: v.union(v.literal("pelicula"), v.literal("serie")),
  nombre: v.string(),
  anio: v.optional(v.number()),
  tmdbId: v.optional(v.number()),
  posterPath: v.optional(v.string()),
  saga: v.optional(v.string()),
  orden: v.optional(v.number()),
});

type ResultadoTmdb = {
  id: number;
  media_type: "movie" | "tv" | "person";
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
};

type RespuestaTmdb = { results?: ResultadoTmdb[] };

type TituloResuelto = Omit<TituloInicial, "busquedaTmdb"> & {
  tmdbId?: number;
  posterPath?: string;
};

function anioDe(resultado: ResultadoTmdb): number | undefined {
  const fecha = resultado.media_type === "movie" ? resultado.release_date : resultado.first_air_date;
  const anio = fecha?.slice(0, 4);
  return anio ? Number(anio) : undefined;
}

async function resolverConTmdb(titulo: TituloInicial, token: string): Promise<TituloResuelto> {
  const base = {
    tipo: titulo.tipo,
    nombre: titulo.nombre,
    anio: titulo.anio,
    saga: titulo.saga,
    orden: titulo.orden,
  };
  if (!titulo.busquedaTmdb) {
    return base;
  }

  const parametros = new URLSearchParams({
    query: titulo.busquedaTmdb,
    language: "es-MX",
    include_adult: "false",
  });
  const respuesta = await fetch(`https://api.themoviedb.org/3/search/multi?${parametros}`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });

  if (!respuesta.ok) {
    throw new Error(`TMDB respondió ${respuesta.status} al resolver ${titulo.nombre}.`);
  }

  const datos = (await respuesta.json()) as RespuestaTmdb;
  const tipoTmdb = titulo.tipo === "pelicula" ? "movie" : "tv";
  const resultado = datos.results?.find(
    (candidato) => candidato.media_type === tipoTmdb && anioDe(candidato) === titulo.anio,
  );

  if (!resultado?.poster_path) {
    throw new Error(`TMDB no devolvió un póster para ${titulo.nombre} (${titulo.anio}).`);
  }

  return { ...base, tmdbId: resultado.id, posterPath: resultado.poster_path };
}

type ContextoLectura = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
type SalaExaminada = {
  sala: Doc<"salas">;
  titulos: Doc<"titulos">[];
  clasificacion: ReturnType<typeof clasificarCatalogo>;
};

type ResumenSiembra = {
  codigo: string;
  titulos: number;
  posters: number;
  sinTmdb: string[];
  timestampsDistintosDeAgregado: number;
  titulosConAgregadoPor: number;
  datosVigentes: boolean;
};

async function titulosDeSala(ctx: ContextoLectura, salaId: Id<"salas">) {
  return await ctx.db
    .query("titulos")
    .withIndex("por_sala", (q) => q.eq("salaId", salaId))
    .collect();
}

async function examinarSala(ctx: ContextoLectura, sala: Doc<"salas">): Promise<SalaExaminada> {
  const titulos = await titulosDeSala(ctx, sala._id);
  return { sala, titulos, clasificacion: clasificarCatalogo(titulos) };
}

async function seleccionarSala(
  ctx: ContextoLectura,
  codigo?: string,
): Promise<SalaExaminada | null> {
  if (codigo !== undefined) {
    const sala = await ctx.db
      .query("salas")
      .withIndex("por_codigo", (q) => q.eq("codigo", codigo))
      .unique();
    if (!sala) throw new Error(`No existe una sala con el código ${codigo} para reanudar la siembra.`);

    const examinada = await examinarSala(ctx, sala);
    if (examinada.clasificacion === "ajena") {
      throw new Error(`La sala ${codigo} no pertenece al catálogo versionado; la siembra no la modificó.`);
    }
    return examinada;
  }

  const salas = await ctx.db.query("salas").collect();
  if (salas.length === 0) return null;
  const examinadas = await Promise.all(salas.map((sala) => examinarSala(ctx, sala)));
  const completas = examinadas.filter(({ clasificacion }) => clasificacion === "completa");
  if (completas.length === 1) return completas[0];
  if (completas.length > 1) {
    throw new Error("Hay más de una sala con el catálogo versionado; indica el código que se debe reanudar.");
  }

  const parciales = examinadas.filter(({ clasificacion }) => clasificacion === "parcial");
  if (parciales.length > 0) {
    const codigos = parciales.map(({ sala }) => sala.codigo).join(", ");
    throw new Error(`Hay una siembra parcial (${codigos}); vuelve a correrla indicando su código.`);
  }

  throw new Error(
    "La deployment ya contiene una sala que no pertenece al catálogo versionado; la siembra no adoptó ninguna.",
  );
}

function resumir({ sala, titulos }: SalaExaminada): ResumenSiembra {
  return {
    codigo: sala.codigo,
    titulos: titulos.length,
    posters: titulos.filter((titulo) => titulo.posterPath !== undefined).length,
    sinTmdb: titulos.filter((titulo) => titulo.tmdbId === undefined).map((titulo) => titulo.nombre),
    timestampsDistintosDeAgregado: new Set(titulos.map((titulo) => titulo.agregado)).size,
    titulosConAgregadoPor: titulos.filter((titulo) => titulo.agregadoPor !== undefined).length,
    datosVigentes: datosDeSiembraVigentes(titulos),
  };
}

export const estado = internalQuery({
  args: { codigo: v.optional(v.string()) },
  handler: async (ctx, { codigo }) => {
    const examinada = await seleccionarSala(ctx, codigo);
    return examinada ? resumir(examinada) : null;
  },
});

export const guardar = internalMutation({
  args: { titulos: v.array(tituloResuelto), codigo: v.optional(v.string()) },
  handler: async (ctx, { titulos, codigo }) => {
    let examinada = await seleccionarSala(ctx, codigo);

    if (!examinada) {
      let codigo: string | undefined;
      for (let intento = 0; intento < 16; intento += 1) {
        const candidato = generarCodigo();
        const choque = await ctx.db
          .query("salas")
          .withIndex("por_codigo", (q) => q.eq("codigo", candidato))
          .unique();
        if (!choque) {
          codigo = candidato;
          break;
        }
      }
      if (!codigo) throw new Error("No fue posible generar un código de sala único.");

      const salaId = await ctx.db.insert("salas", {
        codigo,
        butacas: ["Félix", "Sofía"],
        ajustes: { ritmo: "dramatico", paro: "uno", conteo: true },
        creada: Date.now(),
      });
      const sala = (await ctx.db.get(salaId))!;
      examinada = { sala, titulos: [], clasificacion: "vacia" };
    }

    if (examinada.clasificacion === "ajena") {
      throw new Error(`La sala ${examinada.sala.codigo} no pertenece al catálogo versionado.`);
    }

    const existentesPorIndice = new Map(
      examinada.titulos.flatMap((titulo) => {
        const indice = indiceDeTitulo(titulo);
        return indice === undefined ? [] : [[indice, titulo] as const];
      }),
    );
    const base = baseDeAgregados(examinada.titulos) ?? Date.now();

    for (const [indice, titulo] of titulos.entries()) {
      const existente = existentesPorIndice.get(indice);
      if (existente) {
        await ctx.db.patch(existente._id, {
          agregado: agregadoDelIndice(base, indice),
          agregadoPor: undefined,
        });
      } else {
        await ctx.db.insert("titulos", {
          salaId: examinada.sala._id,
          tipo: titulo.tipo,
          nombre: titulo.nombre,
          anio: titulo.anio,
          tmdbId: titulo.tmdbId,
          posterPath: titulo.posterPath,
          saga: titulo.saga,
          orden: titulo.orden,
          visto: false,
          agregado: agregadoDelIndice(base, indice),
        });
      }
    }

    return examinada.sala.codigo;
  },
});

export const normalizar = internalMutation({
  args: { codigo: v.string() },
  handler: async (ctx, { codigo }) => {
    const examinada = await seleccionarSala(ctx, codigo);
    if (!examinada || examinada.clasificacion !== "completa") {
      throw new Error(`La sala ${codigo} no tiene el catálogo versionado completo.`);
    }
    const base = baseDeAgregados(examinada.titulos) ?? Date.now();
    for (const titulo of examinada.titulos) {
      const indice = indiceDeTitulo(titulo);
      if (indice === undefined) throw new Error(`El título ${titulo.nombre} no pertenece a la siembra.`);
      await ctx.db.patch(titulo._id, {
        agregado: agregadoDelIndice(base, indice),
        agregadoPor: undefined,
      });
    }
  },
});

export const sembrar = internalAction({
  args: { codigo: v.optional(v.string()) },
  handler: async (ctx, { codigo }): Promise<ResumenSiembra> => {
    const existente = await ctx.runQuery(internal.siembra.estado, { codigo });
    if (existente?.titulos === CATALOGO_INICIAL.length) {
      if (!existente.datosVigentes) {
        await ctx.runMutation(internal.siembra.normalizar, { codigo: existente.codigo });
      }
      return (await ctx.runQuery(internal.siembra.estado, { codigo: existente.codigo }))!;
    }

    const token = process.env.TMDB_READ_TOKEN;
    if (!token) throw new Error("Falta TMDB_READ_TOKEN en el entorno de Convex.");

    const titulos = [];
    for (const titulo of CATALOGO_INICIAL) {
      titulos.push(await resolverConTmdb(titulo, token));
    }

    const codigoSembrado = await ctx.runMutation(internal.siembra.guardar, {
      titulos,
      codigo: existente?.codigo ?? codigo,
    });
    return (await ctx.runQuery(internal.siembra.estado, { codigo: codigoSembrado }))!;
  },
});
