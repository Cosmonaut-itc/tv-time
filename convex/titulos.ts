import { v } from "convex/values";
import { query } from "./_generated/server";

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
