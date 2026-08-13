import { v } from "convex/values";
import { derivarCartelera } from "./cartelera";
import { mutation } from "./_generated/server";
import {
  esPrimeraFuncion,
  siguienteDeSaga,
  validarEnCartelera,
  validarTituloParaFuncion,
} from "./funciones_logica";
import { nocheDe } from "./noche";

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
