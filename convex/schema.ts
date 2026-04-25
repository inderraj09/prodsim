import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const archetypeValidator = v.union(
  v.literal("The Discovery Nerd"),
  v.literal("The Ship-It Machine"),
  v.literal("The Roadmap Romantic"),
  v.literal("The Metrics Assassin"),
  v.literal("The Feature Factory Foreman"),
  v.literal("The Zero-to-One Founder"),
  v.literal("The Enterprise Operator"),
  v.literal("The Design-Led PM"),
);

export const difficultyValidator = v.union(
  v.literal("easy"),
  v.literal("medium"),
  v.literal("hard"),
  v.literal("boss"),
);

export const attemptStatusValidator = v.union(
  v.literal("pending"),
  v.literal("scored"),
  v.literal("error"),
);

export const attemptModeValidator = v.union(
  v.literal("long-form"),
  v.literal("mcq"),
);

const dimensionScoresValidator = v.object({
  productSense: v.number(),
  analyticalExecution: v.number(),
  strategicThinking: v.number(),
  communication: v.number(),
});

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    handle: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    showRealName: v.boolean(),
    level: v.number(),
    totalXP: v.number(),
    streak: v.number(),
    longestStreak: v.number(),
    currentArchetype: v.optional(archetypeValidator),
    badges: v.optional(v.array(v.string())),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_handle", ["handle"])
    .index("by_totalXP", ["totalXP"]),

  scenarios: defineTable({
    title: v.string(),
    body: v.string(),
    rubric: v.string(),
    level: v.number(),
    difficulty: difficultyValidator,
    octalysisDrive: v.optional(v.string()),
    activeDate: v.optional(v.string()),
    isBossScenario: v.boolean(),
    hidden: v.boolean(),
    options: v.optional(v.array(v.string())),
  })
    .index("by_date", ["activeDate"])
    .index("by_level_difficulty", ["level", "difficulty"]),

  attempts: defineTable({
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
    scenarioId: v.id("scenarios"),
    answer: v.string(),
    mode: v.optional(attemptModeValidator),
    mcqChoice: v.optional(v.string()),
    status: attemptStatusValidator,
    overallScore: v.optional(v.number()),
    dimensionScores: v.optional(dimensionScoresValidator),
    archetype: v.optional(archetypeValidator),
    roast: v.optional(v.string()),
    coachingNote: v.optional(v.string()),
    whatWouldMakeThisA5: v.optional(v.string()),
    xpAwarded: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    bossFightId: v.optional(v.id("bossFights")),
    challengeContext: v.optional(
      v.object({ challengerUserId: v.id("users") }),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_scenario_score", ["scenarioId", "overallScore"])
    .index("by_session", ["sessionToken"]),

  bossFights: defineTable({
    userId: v.id("users"),
    fromLevel: v.number(),
    toLevel: v.number(),
    scenarioId: v.id("scenarios"),
    attemptId: v.optional(v.id("attempts")),
    passed: v.boolean(),
    retryAvailableAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  playWindows: defineTable({
    userId: v.id("users"),
    windowStart: v.number(),
    playsUsed: v.number(),
  }).index("by_user_window", ["userId", "windowStart"]),

  challenges: defineTable({
    challengerUserId: v.id("users"),
    challengedUserId: v.id("users"),
    attemptId: v.id("attempts"),
    accepted: v.boolean(),
    resultAttemptId: v.optional(v.id("attempts")),
  })
    .index("by_challenged", ["challengedUserId"])
    .index("by_challenger", ["challengerUserId"]),
});
