import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { entrarConFreno, type FrenoTaquilla } from "./taquilla_logica";

const respuestaDeTaquilla = v.union(
  v.object({
    estado: v.literal("abierta"),
    salaId: v.id("salas"),
    codigo: v.string(),
    butacas: v.array(v.string()),
  }),
  v.object({
    estado: v.literal("cerrada"),
    mensaje: v.string(),
    intentosRestantes: v.number(),
  }),
  v.object({
    estado: v.literal("trabada"),
    mensaje: v.string(),
    esperaMs: v.number(),
  }),
);

export const entrar = mutation({
  args: { codigo: v.string() },
  returns: respuestaDeTaquilla,
  handler: async (ctx, args) => {
    let frenoLeido: Doc<"taquilla"> | null = null;
    let frenoConsultado = false;

    return entrarConFreno(
      {
        ahora: Date.now,
        buscarSala: async (codigo) => {
          const sala = await ctx.db
            .query("salas")
            .withIndex("por_codigo", (q) => q.eq("codigo", codigo))
            .unique();
          return sala
            ? { salaId: sala._id, codigo: sala.codigo, butacas: sala.butacas }
            : null;
        },
        leerFreno: async () => {
          frenoLeido = await ctx.db.query("taquilla").first();
          frenoConsultado = true;
          return frenoLeido;
        },
        guardarFreno: async (freno: FrenoTaquilla) => {
          if (!frenoConsultado) frenoLeido = await ctx.db.query("taquilla").first();
          if (frenoLeido) await ctx.db.replace(frenoLeido._id, freno);
          else await ctx.db.insert("taquilla", freno);
        },
        limpiarFreno: async () => {
          const freno = await ctx.db.query("taquilla").first();
          if (freno) await ctx.db.delete(freno._id);
        },
      },
      args,
    );
  },
});
