import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { incrementPlayUsage } from "./playWindows";

const MIN_WORDS = 10;
const MAX_WORDS = 500;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

export const submit = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const started = Date.now();

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("Finish onboarding first");

    const words = countWords(args.answer);
    if (words < MIN_WORDS) {
      throw new Error(`Answer is too short — at least ${MIN_WORDS} words.`);
    }
    if (words > MAX_WORDS) {
      throw new Error(`Answer is too long — keep it under ${MAX_WORDS} words.`);
    }

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) throw new Error("Scenario not found");
    if (scenario.hidden) throw new Error("Scenario unavailable");

    const attemptId = await ctx.db.insert("attempts", {
      userId: user._id,
      scenarioId: args.scenarioId,
      answer: args.answer,
      status: "pending",
    });

    await incrementPlayUsage(ctx, user._id);

    await ctx.scheduler.runAfter(0, internal.judge.run, { attemptId });

    console.log("attempts.submit", {
      userId: user._id,
      scenarioId: args.scenarioId,
      attemptId,
      durationMs: Date.now() - started,
    });

    return attemptId;
  },
});

export const get = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    if (attempt.userId !== user._id) return null;

    const scenario = await ctx.db.get(attempt.scenarioId);
    if (!scenario) return null;

    return {
      attempt,
      scenario: {
        title: scenario.title,
        body: scenario.body,
        difficulty: scenario.difficulty,
        isBossScenario: scenario.isBossScenario,
      },
    };
  },
});

export const getPublic = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    if (attempt.status !== "scored") return null;

    const scenario = await ctx.db.get(attempt.scenarioId);
    if (!scenario) return null;

    const author = await ctx.db.get(attempt.userId);
    if (!author) return null;

    const { answer: _redacted, ...attemptSansAnswer } = attempt;

    return {
      attempt: attemptSansAnswer,
      scenario: {
        title: scenario.title,
        body: scenario.body,
        difficulty: scenario.difficulty,
      },
      author: {
        handle: author.handle,
        displayName: author.showRealName ? (author.name ?? null) : null,
        level: author.level,
      },
    };
  },
});
