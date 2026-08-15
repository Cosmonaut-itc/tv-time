import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { generarCodigo, normalizarCodigo } from "./codigo";
import {
  elegirCodigoNuevo,
  entrarConFreno,
  normalizarButacas,
  type FrenoTaquilla,
} from "./taquilla_logica";

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

const ERROR_PERTENENCIA = "No fue posible verificar la sala.";

export const rotarCodigo = mutation({
  args: { salaId: v.id("salas"), codigoActual: v.string() },
  returns: v.object({ codigo: v.string() }),
  handler: async (ctx, { salaId, codigoActual }) => {
    const sala = await ctx.db.get(salaId);
    if (!sala || sala.codigo !== normalizarCodigo(codigoActual)) {
      throw new Error(ERROR_PERTENENCIA);
    }

    const nuevo = await elegirCodigoNuevo(
      {
        generarCodigo,
        codigoEstaTomado: async (codigo) => {
          const existente = await ctx.db
            .query("salas")
            .withIndex("por_codigo", (q) => q.eq("codigo", codigo))
            .unique();
          return existente !== null;
        },
      },
      { codigoActual: sala.codigo },
    );
    if (!nuevo) throw new Error("No fue posible generar un código de sala único.");

    await ctx.db.patch(salaId, { codigo: nuevo });
    return { codigo: nuevo };
  },
});

// La creación es pública, pero sólo quien conoce el código de una sala puede
// abrir otra desde su cabina. Así la taquilla no se vuelve una fábrica de salas.
export const crearSala = mutation({
  args: {
    salaId: v.id("salas"),
    codigoActual: v.string(),
    butacas: v.array(v.string()),
  },
  returns: v.object({
    salaId: v.id("salas"),
    codigo: v.string(),
    butacas: v.array(v.string()),
  }),
  handler: async (ctx, { salaId, codigoActual, butacas }) => {
    const sala = await ctx.db.get(salaId);
    if (!sala || sala.codigo !== normalizarCodigo(codigoActual)) {
      throw new Error(ERROR_PERTENENCIA);
    }

    const nombres = normalizarButacas(butacas);
    if (!nombres) throw new Error("Las butacas no son válidas.");

    const codigo = await elegirCodigoNuevo(
      {
        generarCodigo,
        codigoEstaTomado: async (candidato) => {
          const existente = await ctx.db
            .query("salas")
            .withIndex("por_codigo", (q) => q.eq("codigo", candidato))
            .unique();
          return existente !== null;
        },
      },
      { codigoActual: sala.codigo },
    );
    if (!codigo) throw new Error("No fue posible generar un código de sala único.");

    const nueva = await ctx.db.insert("salas", {
      codigo,
      butacas: nombres,
      ajustes: { ritmo: "dramatico", paro: "uno", conteo: true },
      creada: Date.now(),
    });

    return { salaId: nueva, codigo, butacas: nombres };
  },
});
