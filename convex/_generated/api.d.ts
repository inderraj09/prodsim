/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attempts from "../attempts.js";
import type * as bossFights from "../bossFights.js";
import type * as challenges from "../challenges.js";
import type * as crons from "../crons.js";
import type * as judge from "../judge.js";
import type * as judgeInternal from "../judgeInternal.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lib_prompts from "../lib/prompts.js";
import type * as lib_timeIST from "../lib/timeIST.js";
import type * as lib_xp from "../lib/xp.js";
import type * as playWindows from "../playWindows.js";
import type * as scenarios from "../scenarios.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attempts: typeof attempts;
  bossFights: typeof bossFights;
  challenges: typeof challenges;
  crons: typeof crons;
  judge: typeof judge;
  judgeInternal: typeof judgeInternal;
  leaderboard: typeof leaderboard;
  "lib/prompts": typeof lib_prompts;
  "lib/timeIST": typeof lib_timeIST;
  "lib/xp": typeof lib_xp;
  playWindows: typeof playWindows;
  scenarios: typeof scenarios;
  seed: typeof seed;
  users: typeof users;
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
