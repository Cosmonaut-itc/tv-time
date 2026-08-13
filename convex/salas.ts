import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const ajustes = v.object({
  ritmo: v.union(v.literal("rapido"), v.literal("normal"), v.literal("dramatico")),
  paro: v.union(v.literal("uno"), v.literal("tres")),
  conteo: v.boolean(),
});

type ContextoConSala = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

async function salaDe(ctx: ContextoConSala, salaId: Id<"salas">) {
  const sala = await ctx.db.get(salaId);
  if (!sala) throw new Error("La sala no existe.");
  return sala;
}

export const ajustesDeSala = query({
  args: { salaId: v.id("salas") },
  returns: ajustes,
  handler: async (ctx, { salaId }) => (await salaDe(ctx, salaId)).ajustes,
});

export const guardarAjustes = mutation({
  args: { salaId: v.id("salas"), ajustes },
  returns: v.null(),
  handler: async (ctx, { salaId, ajustes: nuevosAjustes }) => {
    await salaDe(ctx, salaId);
    await ctx.db.patch(salaId, { ajustes: nuevosAjustes });
    return null;
  },
});
