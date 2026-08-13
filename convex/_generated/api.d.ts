/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as catalogo_inicial from "../catalogo_inicial.js";
import type * as codigo from "../codigo.js";
import type * as siembra from "../siembra.js";
import type * as siembra_catalogo from "../siembra_catalogo.js";
import type * as taquilla from "../taquilla.js";
import type * as taquilla_logica from "../taquilla_logica.js";
import type * as titulos from "../titulos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  catalogo_inicial: typeof catalogo_inicial;
  codigo: typeof codigo;
  siembra: typeof siembra;
  siembra_catalogo: typeof siembra_catalogo;
  taquilla: typeof taquilla;
  taquilla_logica: typeof taquilla_logica;
  titulos: typeof titulos;
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
