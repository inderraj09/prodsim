import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TOP_N = 50;
const RANK_SCAN_CAP = 500;

type Row = {
  userId: Id<"users">;
  handle: string;
  displayName: string | null;
  level: number;
  currentArchetype: string | null;
  xp: number;
};

export const topByXP = query({
  args: {},
  handler: async (ctx): Promise<Row[]> => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_totalXP")
      .order("desc")
      .take(TOP_N);
    return users.map((u) => ({
      userId: u._id,
      handle: u.handle,
      displayName: u.showRealName ? (u.name ?? null) : null,
      level: u.level,
      currentArchetype: u.currentArchetype ?? null,
      xp: u.totalXP,
    }));
  },
});

export const topThisWeek = query({
  args: {},
  handler: async (ctx): Promise<Row[]> => {
    const since = Date.now() - WEEK_MS;
    const recent = await ctx.db
      .query("attempts")
      .order("desc")
      .take(1000);
    const totals = new Map<Id<"users">, number>();
    for (const a of recent) {
      if (a.status !== "scored") continue;
      if (a._creationTime < since) continue;
      if (!a.userId) continue; // anon attempts don't roll up to leaderboard
      const prev = totals.get(a.userId) ?? 0;
      totals.set(a.userId, prev + (a.xpAwarded ?? 0));
    }
    const sortedUserIds = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N);

    const rows: Row[] = [];
    for (const [userId, weeklyXP] of sortedUserIds) {
      const u = await ctx.db.get(userId);
      if (!u) continue;
      rows.push({
        userId,
        handle: u.handle,
        displayName: u.showRealName ? (u.name ?? null) : null,
        level: u.level,
        currentArchetype: u.currentArchetype ?? null,
        xp: weeklyXP,
      });
    }
    return rows;
  },
});

export const myRank = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ rank: number; capped: boolean; xp: number } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const me = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!me) return null;

    const above = await ctx.db
      .query("users")
      .withIndex("by_totalXP", (q) => q.gt("totalXP", me.totalXP))
      .take(RANK_SCAN_CAP);
    const capped = above.length >= RANK_SCAN_CAP;
    return { rank: above.length + 1, capped, xp: me.totalXP };
  },
});
