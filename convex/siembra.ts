import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { CATALOGO_INICIAL, type TituloInicial } from "./catalogo_inicial";
import { ALFABETO_CODIGO } from "./codigo";

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

export const estado = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sala = await ctx.db.query("salas").first();
    if (!sala) return null;
    const titulos = await ctx.db
      .query("titulos")
      .withIndex("por_sala", (q) => q.eq("salaId", sala._id))
      .collect();
    return {
      codigo: sala.codigo,
      titulos: titulos.length,
      posters: titulos.filter((titulo) => titulo.posterPath !== undefined).length,
      sinTmdb: titulos.filter((titulo) => titulo.tmdbId === undefined).map((titulo) => titulo.nombre),
    };
  },
});

function generarCodigo(): string {
  return Array.from(
    { length: 6 },
    () => ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)],
  ).join("");
}

export const guardar = internalMutation({
  args: { titulos: v.array(tituloResuelto) },
  handler: async (ctx, { titulos }) => {
    let sala = await ctx.db.query("salas").first();

    if (sala) {
      const salaId = sala._id;
      const existentes = await ctx.db
        .query("titulos")
        .withIndex("por_sala", (q) => q.eq("salaId", salaId))
        .collect();
      if (existentes.length > 0 && existentes.length !== CATALOGO_INICIAL.length) {
        throw new Error(`La sala ya tiene un catálogo incompleto de ${existentes.length} títulos.`);
      }
      if (existentes.length === CATALOGO_INICIAL.length) {
        return sala.codigo;
      }
    } else {
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
      sala = (await ctx.db.get(salaId))!;
    }

    const agregado = Date.now();
    for (const [indice, titulo] of titulos.entries()) {
      await ctx.db.insert("titulos", {
        salaId: sala._id,
        tipo: titulo.tipo,
        nombre: titulo.nombre,
        anio: titulo.anio,
        tmdbId: titulo.tmdbId,
        posterPath: titulo.posterPath,
        saga: titulo.saga,
        orden: titulo.orden,
        agregadoPor: indice % 2 === 0 ? "Félix" : "Sofía",
        visto: false,
        agregado,
      });
    }

    return sala.codigo;
  },
});

export const sembrar = action({
  args: {},
  handler: async (ctx): Promise<{
    codigo: string;
    titulos: number;
    posters: number;
    sinTmdb: string[];
  }> => {
    const existente = await ctx.runQuery(internal.siembra.estado, {});
    if (existente?.titulos === CATALOGO_INICIAL.length) return existente;

    const token = process.env.TMDB_READ_TOKEN;
    if (!token) throw new Error("Falta TMDB_READ_TOKEN en el entorno de Convex.");

    const titulos = [];
    for (const titulo of CATALOGO_INICIAL) {
      titulos.push(await resolverConTmdb(titulo, token));
    }

    const codigo = await ctx.runMutation(internal.siembra.guardar, { titulos });
    return {
      codigo,
      titulos: titulos.length,
      posters: titulos.filter((titulo) => titulo.posterPath !== undefined).length,
      sinTmdb: titulos.filter((titulo) => titulo.tmdbId === undefined).map((titulo) => titulo.nombre),
    };
  },
});
