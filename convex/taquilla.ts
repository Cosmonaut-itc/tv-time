import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { codigoTieneFormatoValido, normalizarCodigo } from "./codigo";

const FALLOS_ANTES_DE_TRABAR = 5;
const MINUTOS_TRABADA = 5;
const VENTANA_DE_FALLOS = MINUTOS_TRABADA * 60_000;

export const entrar = mutation({
  args: { codigo: v.string() },
  handler: async (ctx, { codigo }) => {
    const ahora = Date.now();
    const freno = await ctx.db.query("taquilla").first();

    if (freno?.trabadaHasta && freno.trabadaHasta > ahora) {
      return {
        estado: "trabada" as const,
        mensaje: "La taquilla está trabada por varios intentos. Prueba de nuevo en unos minutos.",
        esperaMs: freno.trabadaHasta - ahora,
      };
    }

    const normalizado = normalizarCodigo(codigo);
    const formatoValido = codigoTieneFormatoValido(normalizado);
    const sala = formatoValido
      ? await ctx.db
          .query("salas")
          .withIndex("por_codigo", (q) => q.eq("codigo", normalizado))
          .unique()
      : null;

    if (sala) {
      if (freno) await ctx.db.delete(freno._id);
      return { estado: "abierta" as const, codigo: sala.codigo, butacas: sala.butacas };
    }

    const frenoVigente =
      freno &&
      freno.trabadaHasta === undefined &&
      ahora - freno.actualizada < VENTANA_DE_FALLOS;
    const fallosSeguidos = (frenoVigente ? freno.fallosSeguidos : 0) + 1;
    // Cinco errores toleran varios dedos torpes; cinco minutos vuelve inviable
    // recorrer códigos sin castigar una noche entera por una equivocación.
    const trabadaHasta =
      fallosSeguidos >= FALLOS_ANTES_DE_TRABAR ? ahora + MINUTOS_TRABADA * 60_000 : undefined;
    const datos = { fallosSeguidos, trabadaHasta, actualizada: ahora };
    if (freno) await ctx.db.replace(freno._id, datos);
    else await ctx.db.insert("taquilla", datos);

    return trabadaHasta
      ? {
          estado: "trabada" as const,
          mensaje: "La taquilla está trabada por varios intentos. Prueba de nuevo en cinco minutos.",
          esperaMs: trabadaHasta - ahora,
        }
      : {
          estado: "cerrada" as const,
          mensaje: "No hay ninguna sala con ese código.",
          intentosRestantes: FALLOS_ANTES_DE_TRABAR - fallosSeguidos,
        };
  },
});
