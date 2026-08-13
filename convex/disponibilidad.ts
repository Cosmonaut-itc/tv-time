import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import {
  mapearDisponibilidadDeMexico,
  politicaDeCache,
  type DisponibilidadMapeada,
} from "./disponibilidad_logica";

const tipoTitulo = v.union(v.literal("pelicula"), v.literal("serie"));
const proveedor = v.object({ nombre: v.string(), logoPath: v.string() });
const listas = {
  flatrate: v.array(proveedor),
  renta: v.array(proveedor),
  compra: v.array(proveedor),
};
const filaDeCache = v.object({ ...listas, actualizada: v.number() });
const respuesta = v.union(
  v.object({ estado: v.literal("sin tmdb") }),
  v.object({ estado: v.literal("sin datos") }),
  v.object({ estado: v.literal("datos"), ...listas }),
);

type RespuestaDisponibilidad =
  | { estado: "sin tmdb" }
  | { estado: "sin datos" }
  | ({ estado: "datos" } & DisponibilidadMapeada);

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
      .query("disponibilidad")
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
            flatrate: cache.flatrate,
            renta: cache.renta,
            compra: cache.compra,
            actualizada: cache.actualizada,
          }
        : null,
    };
  },
});

export const guardarCache = internalMutation({
  args: {
    tmdbId: v.number(),
    tipo: tipoTitulo,
    ...listas,
    actualizada: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, datos) => {
    const existente = await ctx.db
      .query("disponibilidad")
      .withIndex("por_tmdb", (q) =>
        q.eq("tipo", datos.tipo).eq("tmdbId", datos.tmdbId),
      )
      .unique();
    if (existente) await ctx.db.patch(existente._id, datos);
    else await ctx.db.insert("disponibilidad", datos);
    return null;
  },
});

function conDatos(datos: DisponibilidadMapeada) {
  return {
    estado: "datos" as const,
    flatrate: datos.flatrate,
    renta: datos.renta,
    compra: datos.compra,
  };
}

export const deTitulo = action({
  args: { salaId: v.id("salas"), tituloId: v.id("titulos") },
  returns: respuesta,
  handler: async (ctx, args): Promise<RespuestaDisponibilidad> => {
    const lectura = await ctx.runQuery(
      internal.disponibilidad.leerTituloYCache,
      args,
    );
    if (lectura.estado === "sin tmdb") return lectura;

    const ahora = Date.now();
    const politica = politicaDeCache(lectura.cache, ahora);
    if (politica.decision === "servir" && lectura.cache) {
      return conDatos(lectura.cache);
    }

    try {
      const token = process.env.TMDB_READ_TOKEN;
      if (!token) throw new Error("TMDB_READ_TOKEN no está configurado.");

      const medio = lectura.tipo === "pelicula" ? "movie" : "tv";
      const solicitud = await fetch(
        `https://api.themoviedb.org/3/${medio}/${lectura.tmdbId}/watch/providers`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!solicitud.ok) throw new Error(`TMDB respondió ${solicitud.status}.`);

      const datos = mapearDisponibilidadDeMexico(await solicitud.json());
      await ctx.runMutation(internal.disponibilidad.guardarCache, {
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
