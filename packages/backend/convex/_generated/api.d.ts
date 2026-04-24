/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as collections_index from "../collections/index.js";
import type * as collections_mutations from "../collections/mutations.js";
import type * as collections_queries from "../collections/queries.js";
import type * as http from "../http.js";
import type * as links_actions from "../links/actions.js";
import type * as links_mutations from "../links/mutations.js";
import type * as links_queries from "../links/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as utils_clerk from "../utils/clerk.js";
import type * as utils_extractorClient from "../utils/extractorClient.js";
import type * as utils_html from "../utils/html.js";
import type * as utils_links from "../utils/links.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "collections/index": typeof collections_index;
  "collections/mutations": typeof collections_mutations;
  "collections/queries": typeof collections_queries;
  http: typeof http;
  "links/actions": typeof links_actions;
  "links/mutations": typeof links_mutations;
  "links/queries": typeof links_queries;
  "users/mutations": typeof users_mutations;
  "utils/clerk": typeof utils_clerk;
  "utils/extractorClient": typeof utils_extractorClient;
  "utils/html": typeof utils_html;
  "utils/links": typeof utils_links;
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
