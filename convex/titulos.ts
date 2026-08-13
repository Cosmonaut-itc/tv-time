import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { claveLugarDeSaga, claveTmdb, prepararLoteDeAlta } from "./altas_logica";
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

const tituloParaAlta = v.object({
  tipo: v.union(v.literal("pelicula"), v.literal("serie")),
  nombre: v.string(),
  anio: v.optional(v.number()),
  tmdbId: v.optional(v.number()),
  posterPath: v.optional(v.string()),
  saga: v.optional(v.string()),
  orden: v.optional(v.number()),
  visto: v.boolean(),
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

export const altaEnLote = mutation({
  args: {
    salaId: v.id("salas"),
    agregadoPor: v.string(),
    titulos: v.array(tituloParaAlta),
  },
  returns: v.array(v.id("titulos")),
  handler: async (ctx, { salaId, agregadoPor, titulos }) => {
    const sala = await ctx.db.get(salaId);
    if (!sala) throw new Error("La sala no existe.");
    const existentes = await ctx.db
      .query("titulos")
      .withIndex("por_sala", (q) => q.eq("salaId", salaId))
      .collect();
    const listos = prepararLoteDeAlta({
      butacas: sala.butacas,
      agregadoPor,
      existentesTmdb: new Set(
        existentes.flatMap(({ tipo, tmdbId }) =>
          tmdbId === undefined ? [] : [claveTmdb(tipo, tmdbId)]
        ),
      ),
      lugaresExistentes: new Set(
        existentes.flatMap(({ saga, orden }) =>
          saga === undefined || orden === undefined ? [] : [claveLugarDeSaga(saga, orden)]
        ),
      ),
      lote: titulos,
      ahora: Date.now(),
    });

    return await Promise.all(
      listos.map((titulo) => ctx.db.insert("titulos", { salaId, ...titulo })),
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
