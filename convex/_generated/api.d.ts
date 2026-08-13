/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as altas_logica from "../altas_logica.js";
import type * as cartelera from "../cartelera.js";
import type * as catalogo_inicial from "../catalogo_inicial.js";
import type * as codigo from "../codigo.js";
import type * as disponibilidad from "../disponibilidad.js";
import type * as disponibilidad_logica from "../disponibilidad_logica.js";
import type * as funciones from "../funciones.js";
import type * as funciones_logica from "../funciones_logica.js";
import type * as noche from "../noche.js";
import type * as noches from "../noches.js";
import type * as noches_logica from "../noches_logica.js";
import type * as salas from "../salas.js";
import type * as siembra from "../siembra.js";
import type * as siembra_catalogo from "../siembra_catalogo.js";
import type * as taquilla from "../taquilla.js";
import type * as taquilla_logica from "../taquilla_logica.js";
import type * as titulos from "../titulos.js";
import type * as titulos_logica from "../titulos_logica.js";
import type * as tmdb from "../tmdb.js";
import type * as tmdb_logica from "../tmdb_logica.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  altas_logica: typeof altas_logica;
  cartelera: typeof cartelera;
  catalogo_inicial: typeof catalogo_inicial;
  codigo: typeof codigo;
  disponibilidad: typeof disponibilidad;
  disponibilidad_logica: typeof disponibilidad_logica;
  funciones: typeof funciones;
  funciones_logica: typeof funciones_logica;
  noche: typeof noche;
  noches: typeof noches;
  noches_logica: typeof noches_logica;
  salas: typeof salas;
  siembra: typeof siembra;
  siembra_catalogo: typeof siembra_catalogo;
  taquilla: typeof taquilla;
  taquilla_logica: typeof taquilla_logica;
  titulos: typeof titulos;
  titulos_logica: typeof titulos_logica;
  tmdb: typeof tmdb;
  tmdb_logica: typeof tmdb_logica;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
