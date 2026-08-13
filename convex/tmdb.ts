import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import {
  mapearParteDeColeccion,
  mapearResultadoDeBusqueda,
  type ParteCruda,
  type ResultadoCrudo,
} from "./tmdb_logica";

const coleccionEncontrada = v.object({ id: v.number(), nombre: v.string() });
const tituloEncontrado = v.object({
  id: v.number(),
  tipo: v.union(v.literal("pelicula"), v.literal("serie")),
  nombre: v.string(),
  anio: v.optional(v.number()),
  fechaEstreno: v.optional(v.string()),
  posterPath: v.optional(v.string()),
  coleccion: v.optional(coleccionEncontrada),
});

type EnvolturaDeBusqueda = { results?: unknown };
type DetalleDePelicula = { belongs_to_collection?: { id?: unknown; name?: unknown } | null };
type DetalleDeColeccion = { id?: unknown; name?: unknown; parts?: unknown };

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function tokenDeTmdb(): string {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) throw new Error("TMDB_READ_TOKEN no está configurado.");
  return token;
}

function cabeceras(token: string) {
  return { Authorization: `Bearer ${token}`, accept: "application/json" };
}

async function pedirJson(url: string, token: string): Promise<unknown> {
  const respuesta = await fetch(url, { headers: cabeceras(token) });
  if (!respuesta.ok) throw new Error(`TMDB respondió ${respuesta.status}.`);
  return await respuesta.json();
}

export const validarSala = internalQuery({
  args: { salaId: v.id("salas") },
  returns: v.null(),
  handler: async (ctx, { salaId }) => {
    if (!await ctx.db.get(salaId)) throw new Error("La sala no existe.");
    return null;
  },
});

export const buscar = action({
  args: { salaId: v.id("salas"), consulta: v.string() },
  returns: v.array(tituloEncontrado),
  handler: async (ctx, { salaId, consulta }) => {
    await ctx.runQuery(internal.tmdb.validarSala, { salaId });
    const limpia = consulta.trim();
    if (limpia.length < 2 || limpia.length > 80) {
      throw new Error("La búsqueda debe tener entre 2 y 80 caracteres.");
    }

    const token = tokenDeTmdb();
    const parametros = new URLSearchParams({
      query: limpia,
      language: "es-MX",
      include_adult: "false",
      page: "1",
    });
    const datos = await pedirJson(
      `https://api.themoviedb.org/3/search/multi?${parametros}`,
      token,
    );
    if (!esRegistro(datos)) throw new Error("TMDB devolvió una búsqueda inválida.");
    const envoltura = datos as EnvolturaDeBusqueda;
    if (!Array.isArray(envoltura.results)) throw new Error("TMDB devolvió una búsqueda inválida.");

    const candidatos = envoltura.results
      .filter((candidato): candidato is ResultadoCrudo =>
        esRegistro(candidato) &&
        (candidato.media_type === "movie" || candidato.media_type === "tv")
      )
      .slice(0, 12);
    const mapeados = await Promise.all(candidatos.map(async (candidato) => {
      let coleccion: DetalleDePelicula["belongs_to_collection"];
      if (candidato.media_type === "movie" && typeof candidato.id === "number") {
        try {
          const datosDetalle = await pedirJson(
            `https://api.themoviedb.org/3/movie/${candidato.id}?language=es-MX`,
            token,
          );
          if (esRegistro(datosDetalle)) {
            const detalle = datosDetalle as DetalleDePelicula;
            coleccion = detalle.belongs_to_collection;
          }
        } catch {
          // La película sigue siendo un resultado válido si falla el adorno de colección.
        }
      }
      return mapearResultadoDeBusqueda(candidato, coleccion);
    }));

    return mapeados.filter((titulo) => titulo !== null);
  },
});

export const coleccion = action({
  args: { salaId: v.id("salas"), coleccionId: v.number() },
  returns: v.object({ nombre: v.string(), partes: v.array(tituloEncontrado) }),
  handler: async (ctx, { salaId, coleccionId }) => {
    await ctx.runQuery(internal.tmdb.validarSala, { salaId });
    if (!Number.isSafeInteger(coleccionId) || coleccionId <= 0) {
      throw new Error("La colección solicitada no es válida.");
    }

    const token = tokenDeTmdb();
    const datos = await pedirJson(
      `https://api.themoviedb.org/3/collection/${coleccionId}?language=es-MX`,
      token,
    );
    if (!esRegistro(datos)) throw new Error("TMDB devolvió una colección inválida.");
    const detalle = datos as DetalleDeColeccion;
    if (typeof detalle.name !== "string" || !detalle.name.trim() || !Array.isArray(detalle.parts)) {
      throw new Error("TMDB devolvió una colección inválida.");
    }

    const nombre = detalle.name.trim();
    const referencia = { id: coleccionId, nombre };
    const partes = detalle.parts
      .filter((parte): parte is ParteCruda => esRegistro(parte))
      .map((parte) => mapearParteDeColeccion(parte, referencia))
      .filter((parte) => parte !== null);
    return { nombre, partes };
  },
});
