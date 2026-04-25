import { query } from "./_generated/server";

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
