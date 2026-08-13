import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, mutation, query } from "./_generated/server";
import { nocheDe } from "./noche";
import { vetarEnNoche, type NocheParaVeto } from "./noches_logica";

const filtroDeCartelera = v.union(
  v.literal("pelicula"),
  v.literal("serie"),
  v.literal("loQueSea"),
);

const ajustesDeSala = v.object({
  ritmo: v.union(
    v.literal("rapido"),
    v.literal("normal"),
    v.literal("dramatico"),
  ),
  paro: v.union(v.literal("uno"), v.literal("tres")),
  conteo: v.boolean(),
});

const estadoDeNoche = v.object({
  corte: v.number(),
  ajustes: ajustesDeSala,
  vetosGastados: v.number(),
  vetados: v.array(v.id("titulos")),
});

export const vigente = query({
  args: { salaId: v.id("salas"), momento: v.number() },
  returns: estadoDeNoche,
  handler: async (ctx, { salaId }) => {
    const sala = await ctx.db.get(salaId);
    if (!sala) throw new Error("La sala ya no existe.");

    const corte = nocheDe(Date.now());
    const noche = await ctx.db
      .query("noches")
      .withIndex("por_sala_y_corte", (q) =>
        q.eq("salaId", salaId).eq("corte", corte),
      )
      .unique();

    return {
      corte,
      ajustes: sala.ajustes,
      vetosGastados: noche?.vetosGastados ?? 0,
      vetados: noche?.vetados ?? [],
    };
  },
});

export const vetar = mutation({
  args: {
    salaId: v.id("salas"),
    tituloId: v.id("titulos"),
    filtro: filtroDeCartelera,
  },
  returns: v.object({
    corte: v.number(),
    vetosGastados: v.number(),
    vetados: v.array(v.id("titulos")),
  }),
  handler: async (ctx, args) => {
    const noche = await vetarEnNoche<
      Id<"salas">,
      Id<"titulos">,
      Id<"noches">
    >(
      {
        ahora: Date.now,
        buscarTitulo: async (tituloId) => {
          const titulo = await ctx.db.get(tituloId);
          return titulo
            ? { _id: titulo._id, salaId: titulo.salaId }
            : null;
        },
        buscarTitulosDeSala: async (salaId) =>
          await ctx.db
            .query("titulos")
            .withIndex("por_sala", (q) => q.eq("salaId", salaId))
            .collect(),
        buscarNoche: async (salaId, corte) =>
          await ctx.db
            .query("noches")
            .withIndex("por_sala_y_corte", (q) =>
              q.eq("salaId", salaId).eq("corte", corte),
            )
            .unique(),
        crearNoche: async (datos) => {
          const id = await ctx.db.insert("noches", {
            salaId: datos.salaId,
            corte: datos.corte,
            vetosGastados: datos.vetosGastados,
            vetados: datos.vetados,
          });
          return { _id: id, ...datos };
        },
        guardarNoche: async (
          noche: NocheParaVeto<
            Id<"noches">,
            Id<"salas">,
            Id<"titulos">
          >,
        ) => {
          await ctx.db.replace(noche._id, {
            salaId: noche.salaId,
            corte: noche.corte,
            vetosGastados: noche.vetosGastados,
            vetados: noche.vetados,
          });
        },
      },
      args,
    );

    return {
      corte: noche.corte,
      vetosGastados: noche.vetosGastados,
      vetados: noche.vetados,
    };
  },
});

/** Prueba ejecutable en el runtime dev de Convex, no una API de la sala. */
export const comprobarRuntimeDeNoche = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: () => {
    const antes = nocheDe(Date.parse("2026-08-12T10:59:00.000Z"));
    const despues = nocheDe(Date.parse("2026-08-12T11:00:00.000Z"));
    if (antes !== Date.parse("2026-08-11T11:00:00.000Z")) {
      throw new Error("El runtime no resolvió correctamente las 04:59 de México.");
    }
    if (despues !== Date.parse("2026-08-12T11:00:00.000Z")) {
      throw new Error("El runtime no resolvió correctamente las 05:00 de México.");
    }
    return true;
  },
});
