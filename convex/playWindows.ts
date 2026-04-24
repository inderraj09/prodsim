import { query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { currentWindowStart, nextResetAt } from "./lib/timeIST";

const PLAYS_PER_WINDOW = 3;

export const canPlay = query({
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

    const now = Date.now();
    const windowStart = currentWindowStart(now);
    const reset = nextResetAt(now);

    const row = await ctx.db
      .query("playWindows")
      .withIndex("by_user_window", (q) =>
        q.eq("userId", user._id).eq("windowStart", windowStart),
      )
      .unique();

    const playsUsed = row?.playsUsed ?? 0;
    const playsLeft = Math.max(0, PLAYS_PER_WINDOW - playsUsed);

    return {
      allowed: playsLeft > 0,
      playsUsed,
      playsLeft,
      playsPerWindow: PLAYS_PER_WINDOW,
      windowStart,
      nextResetAt: reset,
    };
  },
});

export async function incrementPlayUsage(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<{ windowStart: number; playsUsed: number }> {
  const now = Date.now();
  const windowStart = currentWindowStart(now);

  const row = await ctx.db
    .query("playWindows")
    .withIndex("by_user_window", (q) =>
      q.eq("userId", userId).eq("windowStart", windowStart),
    )
    .unique();

  if (row) {
    if (row.playsUsed >= PLAYS_PER_WINDOW) {
      throw new Error("Play window cap reached. Come back at next reset.");
    }
    const next = row.playsUsed + 1;
    await ctx.db.patch(row._id, { playsUsed: next });
    return { windowStart, playsUsed: next };
  }

  await ctx.db.insert("playWindows", {
    userId,
    windowStart,
    playsUsed: 1,
  });
  return { windowStart, playsUsed: 1 };
}
