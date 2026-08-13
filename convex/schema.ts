import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * El esquema habla el idioma de CONTEXT.md. Si aquí aparece una palabra que
 * no está en el glosario, es señal de que se coló un concepto sin discutir.
 *
 * Dos ausencias son deliberadas:
 *
 * - No hay tabla `cartelera`. La cartelera es un recorte del momento —
 *   catálogo menos visto, menos bloqueado, menos vetado, menos el filtro— y
 *   se calcula en el cliente sobre los títulos de la sala. Una tabla sería un
 *   caché que hay que invalidar cada vez que alguien marca algo visto.
 * - No hay tabla `giros`. Un giro no deja rastro: girar no es decidir.
 */
const tipoTitulo = v.union(v.literal("pelicula"), v.literal("serie"));

export default defineSchema({
  salas: defineTable({
    // Los 6 caracteres. Convex no tiene índices únicos: la unicidad la
    // defiende la mutación que crea la sala.
    codigo: v.string(),
    // Las dos personas. Viven en la sala y no en el código porque otra sala
    // tendrá otros dos nombres.
    butacas: v.array(v.string()),
    // La cabina es de la sala, no del aparato: entrar desde la laptop se
    // siente igual que desde el celular.
    ajustes: v.object({
      ritmo: v.union(
        v.literal("rapido"),
        v.literal("normal"),
        v.literal("dramatico"),
      ),
      paro: v.union(v.literal("uno"), v.literal("tres")),
      conteo: v.boolean(),
    }),
    creada: v.number(),
  }).index("por_codigo", ["codigo"]),

  titulos: defineTable({
    salaId: v.id("salas"),
    // Película y serie son la misma clase de cosa con un campo que las
    // distingue; lo único que las separa es que una serie no tiene saga.
    tipo: tipoTitulo,
    nombre: v.string(),
    anio: v.optional(v.number()),
    // Opcional a propósito: un título que TMDB no encuentra —Sheep
    // Detectives— entra igual, con póster dibujado y sin disponibilidad.
    tmdbId: v.optional(v.number()),
    // Ruta de TMDB, no URL completa: se sirve desde image.tmdb.org sin pasar
    // por la optimización de imágenes de Next.
    posterPath: v.optional(v.string()),
    // La saga son dos campos y no una tabla: no tiene nada que guardar que
    // no sea su nombre. El candado se resuelve leyendo `visto` de las
    // anteriores por `orden`.
    saga: v.optional(v.string()),
    orden: v.optional(v.number()),
    // Autoría, no permisos: la butaca que lo agregó.
    agregadoPor: v.string(),
    // El interruptor que sostiene el candado. Encenderlo desbloquea la
    // siguiente de la saga; apagarlo la devuelve a la cartelera y no borra
    // ninguna función. `visto` con funciones = lo vieron aquí; `visto` sin
    // ninguna función = «ya lo habíamos visto antes».
    visto: v.boolean(),
    agregado: v.number(),
  })
    .index("por_sala", ["salaId"])
    .index("por_sala_y_saga", ["salaId", "saga", "orden"]),

  // La mitad del historial que sí es un recuerdo: nace del botón «Esta
  // vemos», nunca del giro, y lleva su fecha. Un título puede tener varias.
  funciones: defineTable({
    salaId: v.id("salas"),
    tituloId: v.id("titulos"),
    fecha: v.number(),
  })
    .index("por_sala", ["salaId", "fecha"])
    .index("por_titulo", ["tituloId"]),

  // Lo efímero de la noche, que va de 5 a.m. a 5 a.m. La fila se crea
  // perezosamente: sin vetos no hay noche que guardar.
  noches: defineTable({
    salaId: v.id("salas"),
    // El timestamp de las 5:00 (hora de México) que abre esta noche. Es la
    // identidad de la noche, no una fecha cualquiera.
    corte: v.number(),
    vetosGastados: v.number(),
    // Fuera de la cartelera hasta que corte la noche. A lo sumo dos.
    vetados: v.array(v.id("titulos")),
  }).index("por_sala_y_corte", ["salaId", "corte"]),

  // Caché de TMDB, fuera de las salas: dos salas distintas no piden dos
  // veces lo mismo. Se refresca al usarse cuando pasa de una semana, desde
  // una acción — una query no puede hablar con la red.
  disponibilidad: defineTable({
    tmdbId: v.number(),
    tipo: tipoTitulo,
    // Los tres cortes de TMDB para México. Se guardan tal cual llegan.
    flatrate: v.array(v.object({ nombre: v.string(), logoPath: v.string() })),
    renta: v.array(v.object({ nombre: v.string(), logoPath: v.string() })),
    compra: v.array(v.object({ nombre: v.string(), logoPath: v.string() })),
    actualizada: v.number(),
  }).index("por_tmdb", ["tipo", "tmdbId"]),
});
