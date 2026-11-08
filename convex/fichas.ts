import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import {
  CADUCIDAD_CACHE_EN_MS,
  politicaDeCache,
} from "./disponibilidad_logica";
import { mapearFicha, type FichaMapeada } from "./fichas_logica";

const tipoTitulo = v.union(v.literal("pelicula"), v.literal("serie"));
const campos = {
  sinopsis: v.optional(v.string()),
  calificacion: v.optional(v.number()),
};
const filaDeCache = v.object({
  _id: v.id("fichasTmdb"),
  ...campos,
  actualizada: v.number(),
});
const respuesta = v.union(
  v.object({ estado: v.literal("sin tmdb") }),
  v.object({ estado: v.literal("sin datos") }),
  v.object({ estado: v.literal("datos"), ...campos }),
);

const TAMANO_LOTE_PURGA = 200;

type RespuestaFicha =
  | { estado: "sin tmdb" }
  | { estado: "sin datos" }
  | ({ estado: "datos" } & FichaMapeada);

export const leerTituloYCache = internalQuery({
  args: { salaId: v.id("salas"), tituloId: v.id("titulos") },
  returns: v.union(
    v.object({ estado: v.literal("sin tmdb") }),
    v.object({
      estado: v.literal("con tmdb"),
      tmdbId: v.number(),
      tipo: tipoTitulo,
      cache: v.union(filaDeCache, v.null()),
    }),
  ),
  handler: async (ctx, { salaId, tituloId }) => {
    const titulo = await ctx.db.get(tituloId);
    if (!titulo || titulo.salaId !== salaId) {
      throw new Error("El título no pertenece a esta sala.");
    }
    if (titulo.tmdbId === undefined) return { estado: "sin tmdb" as const };

    const cache = await ctx.db
      .query("fichasTmdb")
      .withIndex("por_tmdb", (q) =>
        q.eq("tipo", titulo.tipo).eq("tmdbId", titulo.tmdbId!),
      )
      .unique();

    return {
      estado: "con tmdb" as const,
      tmdbId: titulo.tmdbId,
      tipo: titulo.tipo,
      cache: cache
        ? {
            _id: cache._id,
            sinopsis: cache.sinopsis,
            calificacion: cache.calificacion,
            actualizada: cache.actualizada,
          }
        : null,
    };
  },
});

export const borrarCache = internalMutation({
  args: { cacheId: v.id("fichasTmdb") },
  returns: v.null(),
  handler: async (ctx, { cacheId }) => {
    if (await ctx.db.get(cacheId)) await ctx.db.delete(cacheId);
    return null;
  },
});

export const purgarVencidas = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const limite = Date.now() - CADUCIDAD_CACHE_EN_MS;
    const vencidas = await ctx.db
      .query("fichasTmdb")
      .withIndex("por_actualizada", (q) => q.lte("actualizada", limite))
      .take(TAMANO_LOTE_PURGA);

    for (const ficha of vencidas) await ctx.db.delete(ficha._id);

    if (vencidas.length === TAMANO_LOTE_PURGA) {
      await ctx.scheduler.runAfter(0, internal.fichas.purgarVencidas, {});
    }
    return null;
  },
});

export const guardarCache = internalMutation({
  args: {
    tmdbId: v.number(),
    tipo: tipoTitulo,
    ...campos,
    actualizada: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, datos) => {
    const existente = await ctx.db
      .query("fichasTmdb")
      .withIndex("por_tmdb", (q) =>
        q.eq("tipo", datos.tipo).eq("tmdbId", datos.tmdbId),
      )
      .unique();
    if (existente) await ctx.db.replace(existente._id, datos);
    else await ctx.db.insert("fichasTmdb", datos);
    return null;
  },
});

function conDatos(datos: FichaMapeada) {
  return {
    estado: "datos" as const,
    sinopsis: datos.sinopsis,
    calificacion: datos.calificacion,
  };
}

export const deTitulo = action({
  args: { salaId: v.id("salas"), tituloId: v.id("titulos") },
  returns: respuesta,
  handler: async (ctx, args): Promise<RespuestaFicha> => {
    const lectura = await ctx.runQuery(
      internal.fichas.leerTituloYCache,
      args,
    );
    if (lectura.estado === "sin tmdb") return lectura;

    const ahora = Date.now();
    const politica = politicaDeCache(lectura.cache, ahora);
    if (politica.decision === "servir" && lectura.cache) {
      return conDatos(lectura.cache);
    }
    if (politica.borrar && lectura.cache) {
      await ctx.runMutation(internal.fichas.borrarCache, {
        cacheId: lectura.cache._id,
      });
    }

    try {
      const token = process.env.TMDB_READ_TOKEN;
      if (!token) throw new Error("TMDB_READ_TOKEN no está configurado.");

      const medio = lectura.tipo === "pelicula" ? "movie" : "tv";
      const solicitud = await fetch(
        `https://api.themoviedb.org/3/${medio}/${lectura.tmdbId}?language=es-MX`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!solicitud.ok) throw new Error(`TMDB respondió ${solicitud.status}.`);

      const datos = mapearFicha(await solicitud.json());
      await ctx.runMutation(internal.fichas.guardarCache, {
        tmdbId: lectura.tmdbId,
        tipo: lectura.tipo,
        ...datos,
        actualizada: ahora,
      });
      return conDatos(datos);
    } catch {
      return politica.servirSiFalla && lectura.cache
        ? conDatos(lectura.cache)
        : { estado: "sin datos" as const };
    }
  },
});
