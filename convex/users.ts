import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

function normalizeHandle(input: string): string {
  return input.trim().toLowerCase();
}

async function getUserByIdentity(
  ctx: QueryCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getUserByIdentity(ctx);
  },
});

export const isHandleAvailable = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizeHandle(args.handle);
    if (!HANDLE_REGEX.test(normalized)) return false;
    const existing = await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", normalized))
      .unique();
    return existing === null;
  },
});

export const completeOnboarding = mutation({
  args: {
    handle: v.string(),
    showRealName: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const normalized = normalizeHandle(args.handle);
    if (!HANDLE_REGEX.test(normalized)) {
      throw new Error(
        "Handle must be 3–20 characters, lowercase letters, numbers, or underscore.",
      );
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (existing) {
      throw new Error("Already onboarded");
    }

    const handleTaken = await ctx.db
      .query("users")
      .withIndex("by_handle", (q) => q.eq("handle", normalized))
      .unique();
    if (handleTaken) {
      throw new Error("That handle is taken.");
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      handle: normalized,
      email: identity.email ?? "",
      name: identity.name ?? undefined,
      showRealName: args.showRealName,
      level: 1,
      totalXP: 0,
      streak: 0,
      longestStreak: 0,
      badges: [],
    });

    return userId;
  },
});
