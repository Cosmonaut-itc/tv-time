import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validarTituloDeSala } from "./titulos_logica";

const tituloDeSala = v.object({
  _id: v.id("titulos"),
  tipo: v.union(v.literal("pelicula"), v.literal("serie")),
  nombre: v.string(),
  anio: v.optional(v.number()),
  tmdbId: v.optional(v.number()),
  posterPath: v.optional(v.string()),
  saga: v.optional(v.string()),
  orden: v.optional(v.number()),
  agregadoPor: v.optional(v.string()),
  visto: v.boolean(),
  agregado: v.number(),
});

export const deSala = query({
  args: { salaId: v.id("salas") },
  returns: v.array(tituloDeSala),
  handler: async (ctx, { salaId }) => {
    const titulos = await ctx.db
      .query("titulos")
      .withIndex("por_sala", (q) => q.eq("salaId", salaId))
      .collect();

    return titulos.map(
      ({
        _id,
        tipo,
        nombre,
        anio,
        tmdbId,
        posterPath,
        saga,
        orden,
        agregadoPor,
        visto,
        agregado,
      }) => ({
        _id,
        tipo,
        nombre,
        anio,
        tmdbId,
        posterPath,
        saga,
        orden,
        agregadoPor,
        visto,
        agregado,
      }),
    );
  },
});

export const marcarVisto = mutation({
  args: { salaId: v.id("salas"), tituloId: v.id("titulos"), visto: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { salaId, tituloId, visto }) => {
    const titulo = await ctx.db.get(tituloId);
    validarTituloDeSala(titulo, salaId);
    await ctx.db.patch(tituloId, { visto });
    return null;
  },
});

export const quitar = mutation({
  args: { salaId: v.id("salas"), tituloId: v.id("titulos") },
  returns: v.null(),
  handler: async (ctx, { salaId, tituloId }) => {
    const titulo = await ctx.db.get(tituloId);
    validarTituloDeSala(titulo, salaId);
    const funciones = await ctx.db
      .query("funciones")
      .withIndex("por_titulo", (q) => q.eq("tituloId", tituloId))
      .collect();

    await Promise.all(funciones.map(({ _id }) => ctx.db.delete(_id)));
    await ctx.db.delete(tituloId);
    // `noches.vetados` puede conservar el id: la derivación sólo mira títulos
    // que siguen en la sala y esa fila efímera caduca al próximo corte.
    return null;
  },
});
