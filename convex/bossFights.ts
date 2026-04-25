import { v } from "convex/values";
import { query } from "./_generated/server";

export const getForAttempt = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    const candidates = await ctx.db
      .query("bossFights")
      .withIndex("by_user", (q) => q.eq("userId", attempt.userId))
      .take(20);
    const match = candidates.find((bf) => bf.attemptId === args.attemptId);
    if (!match) return null;
    return {
      bossFightId: match._id,
      fromLevel: match.fromLevel,
      toLevel: match.toLevel,
      passed: match.passed,
      retryAvailableAt: match.retryAvailableAt ?? null,
    };
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;

    const candidates = await ctx.db
      .query("bossFights")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
    const active = candidates.find((bf) => !bf.passed);
    if (!active) return null;

    const now = Date.now();
    const inCooldown =
      active.retryAvailableAt !== undefined && active.retryAvailableAt > now;

    return {
      bossFightId: active._id,
      fromLevel: active.fromLevel,
      toLevel: active.toLevel,
      scenarioId: active.scenarioId,
      retryAvailableAt: active.retryAvailableAt ?? null,
      inCooldown,
      attempted: active.attemptId !== undefined,
    };
  },
});
