import { v } from "convex/values";
import { query } from "./_generated/server";

export const listMyChallengers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const me = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!me) return null;

    const rows = await ctx.db
      .query("challenges")
      .withIndex("by_challenged", (q) => q.eq("challengedUserId", me._id))
      .order("desc")
      .take(50);

    const out = [];
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.challengerUserId)) continue;
      seen.add(row.challengerUserId);
      const challenger = await ctx.db.get(row.challengerUserId);
      if (!challenger) continue;
      out.push({
        userId: challenger._id,
        handle: challenger.handle,
        displayName: challenger.showRealName ? (challenger.name ?? null) : null,
        level: challenger.level,
        currentArchetype: challenger.currentArchetype ?? null,
        challengedAt: row._creationTime,
      });
    }
    return out;
  },
});

export const getChallengerLatest = query({
  args: { challengerUserId: v.id("users") },
  handler: async (ctx, args) => {
    const challenger = await ctx.db.get(args.challengerUserId);
    if (!challenger) return null;
    const recent = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", args.challengerUserId))
      .order("desc")
      .take(20);
    const scored = recent.find(
      (a) => a.status === "scored" && a.overallScore !== undefined,
    );
    if (!scored) return null;
    return {
      handle: challenger.handle,
      displayName: challenger.showRealName ? (challenger.name ?? null) : null,
      attemptId: scored._id,
      overallScore: scored.overallScore!,
      archetype: scored.archetype ?? null,
    };
  },
});
