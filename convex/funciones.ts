import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { derivarCartelera } from "./cartelera";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import {
  esPrimeraFuncion,
  idsYaVistosSinFuncion,
  siguienteDeSaga,
  validarEnCartelera,
  validarTituloParaFuncion,
} from "./funciones_logica";
import { nocheDe } from "./noche";

const tituloDelHistorial = v.object({
  _id: v.id("titulos"),
  tipo: v.union(v.literal("pelicula"), v.literal("serie")),
  nombre: v.string(),
  anio: v.optional(v.number()),
  saga: v.optional(v.string()),
  orden: v.optional(v.number()),
});

type ContextoConSala = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

async function asegurarSala(ctx: ContextoConSala, salaId: Id<"salas">) {
  const sala = await ctx.db.get(salaId);
  if (!sala) throw new Error("La sala no existe.");
}

function tituloParaHistorial(titulo: {
  _id: Id<"titulos">;
  tipo: "pelicula" | "serie";
  nombre: string;
  anio?: number;
  saga?: string;
  orden?: number;
}) {
  return {
    _id: titulo._id,
    tipo: titulo.tipo,
    nombre: titulo.nombre,
    ...(titulo.anio === undefined ? {} : { anio: titulo.anio }),
    ...(titulo.saga === undefined ? {} : { saga: titulo.saga }),
    ...(titulo.orden === undefined ? {} : { orden: titulo.orden }),
  };
}

export const historialDeSala = query({
  args: { salaId: v.id("salas") },
  returns: v.object({
    funciones: v.array(v.object({
      _id: v.id("funciones"),
      fecha: v.number(),
      titulo: tituloDelHistorial,
    })),
    yaVisto: v.array(tituloDelHistorial),
  }),
  handler: async (ctx, { salaId }) => {
    await asegurarSala(ctx, salaId);
    const [funciones, titulos] = await Promise.all([
      ctx.db.query("funciones").withIndex("por_sala", (q) => q.eq("salaId", salaId)).collect(),
      ctx.db.query("titulos").withIndex("por_sala", (q) => q.eq("salaId", salaId)).collect(),
    ]);
    const porId = new Map(titulos.map((titulo) => [titulo._id, titulo]));
    const idsYaVisto = new Set(idsYaVistosSinFuncion(titulos, funciones));
    return {
      funciones: funciones
        .flatMap((funcion) => {
          const titulo = porId.get(funcion.tituloId);
          return titulo ? [{ _id: funcion._id, fecha: funcion.fecha, titulo: tituloParaHistorial(titulo) }] : [];
        })
        .sort((izquierda, derecha) => derecha.fecha - izquierda.fecha),
      yaVisto: titulos
        .filter((titulo) => idsYaVisto.has(titulo._id))
        .sort((izquierda, derecha) => izquierda.nombre.localeCompare(derecha.nombre, "es"))
        .map(tituloParaHistorial),
    };
  },
});

export const vaciarFunciones = mutation({
  args: { salaId: v.id("salas") },
  returns: v.null(),
  handler: async (ctx, { salaId }) => {
    await asegurarSala(ctx, salaId);
    const funciones = await ctx.db
      .query("funciones")
      .withIndex("por_sala", (q) => q.eq("salaId", salaId))
      .collect();
    await Promise.all(funciones.map(({ _id }) => ctx.db.delete(_id)));
    // Los títulos se quedan vistos. Al desaparecer su última función pasan a
    // «Ya lo habíamos visto», nunca regresan accidentalmente a la cartelera.
    return null;
  },
});

export const vaciarYaVisto = mutation({
  args: { salaId: v.id("salas") },
  returns: v.null(),
  handler: async (ctx, { salaId }) => {
    await asegurarSala(ctx, salaId);
    const [funciones, titulos] = await Promise.all([
      ctx.db.query("funciones").withIndex("por_sala", (q) => q.eq("salaId", salaId)).collect(),
      ctx.db.query("titulos").withIndex("por_sala", (q) => q.eq("salaId", salaId)).collect(),
    ]);
    const idsYaVisto = idsYaVistosSinFuncion(titulos, funciones);
    await Promise.all(
      idsYaVisto.map((tituloId) => ctx.db.patch(tituloId, { visto: false })),
    );
    return null;
  },
});

export const cerrar = mutation({
  args: { salaId: v.id("salas"), tituloId: v.id("titulos") },
  returns: v.object({
    primeraFuncion: v.boolean(),
    siguiente: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { salaId, tituloId }) => {
    const titulo = await ctx.db.get(tituloId);
    validarTituloParaFuncion(titulo, salaId);

    const titulos = await ctx.db
      .query("titulos")
      .withIndex("por_sala", (q) => q.eq("salaId", salaId))
      .collect();
    const noche = await ctx.db
      .query("noches")
      .withIndex("por_sala_y_corte", (q) =>
        q.eq("salaId", salaId).eq("corte", nocheDe(Date.now())),
      )
      .unique();
    const { candidatos } = derivarCartelera(titulos, {
      filtro: "loQueSea",
      vetados: new Set(noche?.vetados ?? []),
    });
    validarEnCartelera(candidatos, tituloId);

    await ctx.db.insert("funciones", {
      salaId,
      tituloId,
      fecha: Date.now(),
    });
    await ctx.db.patch(tituloId, { visto: true });

    const funciones = await ctx.db
      .query("funciones")
      .withIndex("por_sala", (q) => q.eq("salaId", salaId))
      .take(2);

    return {
      primeraFuncion: esPrimeraFuncion(funciones.length),
      // `titulos` se leyó antes de encender `visto`: la siguiente de la saga
      // sigue viéndose sin ver, que es justo lo que hay que anunciar.
      siguiente: siguienteDeSaga(titulo, titulos),
    };
  },
});
