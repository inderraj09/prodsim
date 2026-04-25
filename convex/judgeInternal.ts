import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { archetypeValidator } from "./schema";

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
    if (attempt.status !== "pending") {
      return;
    }
    await ctx.db.patch(args.attemptId, {
      status: "scored",
      overallScore: args.overallScore,
      dimensionScores: args.dimensionScores,
      archetype: args.archetype,
      roast: args.roast,
      coachingNote: args.coachingNote,
      whatWouldMakeThisA5: args.whatWouldMakeThisA5,
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
