import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { entrarConFreno, type FrenoTaquilla } from "./taquilla_logica";

export const entrar = mutation({
  args: { codigo: v.string() },
  handler: async (ctx, args) => {
    let frenoLeido: Doc<"taquilla"> | null = null;
    let frenoConsultado = false;

    return entrarConFreno(
      {
        ahora: Date.now,
        buscarSala: async (codigo) =>
          await ctx.db
          .query("salas")
            .withIndex("por_codigo", (q) => q.eq("codigo", codigo))
            .unique(),
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
