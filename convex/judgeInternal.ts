import { v } from "convex/values";
import { formatInTimeZone } from "date-fns-tz";
import { internalQuery, internalMutation } from "./_generated/server";
import { archetypeValidator } from "./schema";
import {
  computeXPAward,
  levelForTotalXP,
  type Difficulty,
} from "./lib/xp";

const IST = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

function istDayOf(tsMs: number): string {
  return formatInTimeZone(tsMs, IST, "yyyy-MM-dd");
}

function daysBetweenIST(prevIsoDate: string, curIsoDate: string): number {
  const a = new Date(`${prevIsoDate}T00:00:00Z`).getTime();
  const b = new Date(`${curIsoDate}T00:00:00Z`).getTime();
  return Math.round((b - a) / DAY_MS);
}

export const loadContext = internalQuery({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    const scenario = await ctx.db.get(attempt.scenarioId);
    if (!scenario) return null;
    const user = await ctx.db.get(attempt.userId);
    if (!user) return null;
    return {
      userAnswer: attempt.answer,
      userLevel: user.level,
      scenarioTitle: scenario.title,
      scenarioBody: scenario.body,
      scenarioDifficulty: scenario.difficulty as string,
      scenarioRubric: scenario.rubric,
    };
  },
});

export const writeScore = internalMutation({
  args: {
    attemptId: v.id("attempts"),
    overallScore: v.number(),
    dimensionScores: v.object({
      productSense: v.number(),
      analyticalExecution: v.number(),
      strategicThinking: v.number(),
      communication: v.number(),
    }),
    archetype: archetypeValidator,
    roast: v.string(),
    coachingNote: v.string(),
    whatWouldMakeThisA5: v.string(),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status !== "pending") return;

    const user = await ctx.db.get(attempt.userId);
    if (!user) throw new Error("User missing for attempt");

    const scenario = await ctx.db.get(attempt.scenarioId);
    if (!scenario) throw new Error("Scenario missing for attempt");

    const now = Date.now();
    const todayIST = istDayOf(now);

    // Streak — based on most recent PREVIOUS scored attempt (exclude this one)
    const recentForStreak = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    const prevScored = recentForStreak.find(
      (a) => a._id !== args.attemptId && a.status === "scored",
    );

    let newStreak: number;
    if (!prevScored) {
      newStreak = 1;
    } else {
      const prevIST = istDayOf(prevScored._creationTime);
      if (prevIST === todayIST) {
        newStreak = user.streak;
      } else {
        const gap = daysBetweenIST(prevIST, todayIST);
        newStreak = gap === 1 ? user.streak + 1 : 1;
      }
    }

    const xpAwarded = computeXPAward({
      overallScore: args.overallScore,
      difficulty: scenario.difficulty as Difficulty,
      streak: newStreak,
    });
    const newTotalXP = user.totalXP + xpAwarded;

    // Level auto-update — L3→L8 only. L1→L2 and L2→L3 are boss-gated in Step 10.
    const potentialLevel = levelForTotalXP(newTotalXP);
    let newLevel = user.level;
    if (potentialLevel > user.level && user.level >= 3) {
      newLevel = potentialLevel;
    }

    await ctx.db.patch(args.attemptId, {
      status: "scored",
      overallScore: args.overallScore,
      dimensionScores: args.dimensionScores,
      archetype: args.archetype,
      roast: args.roast,
      coachingNote: args.coachingNote,
      whatWouldMakeThisA5: args.whatWouldMakeThisA5,
      xpAwarded,
    });

    // Archetype — mode of last 5 scored attempts (ties → most recent)
    const recentForMode = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    const lastFive = recentForMode
      .filter((a) => a.status === "scored" && a.archetype)
      .slice(0, 5);

    const counts = new Map<string, number>();
    for (const a of lastFive) {
      if (a.archetype) counts.set(a.archetype, (counts.get(a.archetype) ?? 0) + 1);
    }
    let modeArchetype: typeof args.archetype | undefined;
    let maxCount = 0;
    for (const a of lastFive) {
      if (!a.archetype) continue;
      const c = counts.get(a.archetype)!;
      if (c > maxCount) {
        maxCount = c;
        modeArchetype = a.archetype;
      }
    }

    await ctx.db.patch(user._id, {
      streak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      totalXP: newTotalXP,
      level: newLevel,
      ...(modeArchetype !== undefined ? { currentArchetype: modeArchetype } : {}),
    });
  },
});

export const markError = internalMutation({
  args: {
    attemptId: v.id("attempts"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return;
    if (attempt.status !== "pending") return;
    await ctx.db.patch(args.attemptId, {
      status: "error",
      errorMessage: args.errorMessage,
    });
  },
});
