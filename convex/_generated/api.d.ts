/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as callAdmission from "../callAdmission.js";
import type * as callAnalytics from "../callAnalytics.js";
import type * as callEvents from "../callEvents.js";
import type * as callbacks from "../callbacks.js";
import type * as calls from "../calls.js";
import type * as closing from "../closing.js";
import type * as customers from "../customers.js";
import type * as demoCalls from "../demoCalls.js";
import type * as evaluationRuns from "../evaluationRuns.js";
import type * as handoff from "../handoff.js";
import type * as http from "../http.js";
import type * as lib_accountContext from "../lib/accountContext.js";
import type * as lib_callAdmission from "../lib/callAdmission.js";
import type * as lib_callClosing from "../lib/callClosing.js";
import type * as lib_callHistory from "../lib/callHistory.js";
import type * as lib_callMetricValidators from "../lib/callMetricValidators.js";
import type * as lib_demoCallValidators from "../lib/demoCallValidators.js";
import type * as lib_evaluationRunValidators from "../lib/evaluationRunValidators.js";
import type * as lib_handoffEnding from "../lib/handoffEnding.js";
import type * as lib_seedAccounts from "../lib/seedAccounts.js";
import type * as lib_speakerContext from "../lib/speakerContext.js";
import type * as seed from "../seed.js";
import type * as teams from "../teams.js";
import type * as time from "../time.js";
import type * as vapiTools from "../vapiTools.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  callAdmission: typeof callAdmission;
  callAnalytics: typeof callAnalytics;
  callEvents: typeof callEvents;
  callbacks: typeof callbacks;
  calls: typeof calls;
  closing: typeof closing;
  customers: typeof customers;
  demoCalls: typeof demoCalls;
  evaluationRuns: typeof evaluationRuns;
  handoff: typeof handoff;
  http: typeof http;
  "lib/accountContext": typeof lib_accountContext;
  "lib/callAdmission": typeof lib_callAdmission;
  "lib/callClosing": typeof lib_callClosing;
  "lib/callHistory": typeof lib_callHistory;
  "lib/callMetricValidators": typeof lib_callMetricValidators;
  "lib/demoCallValidators": typeof lib_demoCallValidators;
  "lib/evaluationRunValidators": typeof lib_evaluationRunValidators;
  "lib/handoffEnding": typeof lib_handoffEnding;
  "lib/seedAccounts": typeof lib_seedAccounts;
  "lib/speakerContext": typeof lib_speakerContext;
  seed: typeof seed;
  teams: typeof teams;
  time: typeof time;
  vapiTools: typeof vapiTools;
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
