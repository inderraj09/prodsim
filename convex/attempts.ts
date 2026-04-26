import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { incrementPlayUsage } from "./playWindows";
import { istDayOf, daysBetweenIST } from "./lib/timeIST";
import { levelForTotalXP } from "./lib/xp";

const LONG_MIN_WORDS = 10;
const LONG_MAX_WORDS = 500;
const MCQ_MIN_WORDS = 5;
const MCQ_MAX_WORDS = 30;
const VALID_MCQ_LETTERS = ["A", "B", "C", "D"];

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const submitGuest = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    answer: v.string(),
    mode: v.optional(
      v.union(v.literal("long-form"), v.literal("mcq")),
    ),
    mcqChoice: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const started = Date.now();

    let sessionToken: string;
    if (args.sessionToken) {
      if (!UUID_V4_RE.test(args.sessionToken)) {
        throw new Error("Invalid session token");
      }
      sessionToken = args.sessionToken;
    } else {
      sessionToken = crypto.randomUUID();
    }

    const prior = await ctx.db
      .query("attempts")
      .withIndex("by_session", (q) => q.eq("sessionToken", sessionToken))
      .take(2);
    if (prior.length === 1 && prior[0].status === "pending") {
      // Network retry / double-tap idempotency.
      return { attemptId: prior[0]._id, sessionToken };
    }
    if (prior.length > 0) {
      throw new Error("Sign up to play more.");
    }

    const mode = args.mode ?? "long-form";
    const words = countWords(args.answer);
    if (mode === "long-form") {
      if (words < LONG_MIN_WORDS) {
        throw new Error(
          `Answer is too short — at least ${LONG_MIN_WORDS} words.`,
        );
      }
      if (words > LONG_MAX_WORDS) {
        throw new Error(
          `Answer is too long — keep it under ${LONG_MAX_WORDS} words.`,
        );
      }
    } else {
      if (words < MCQ_MIN_WORDS) {
        throw new Error(`Why is too short — at least ${MCQ_MIN_WORDS} words.`);
      }
      if (words > MCQ_MAX_WORDS) {
        throw new Error(`Why is too long — keep it under ${MCQ_MAX_WORDS} words.`);
      }
      if (!args.mcqChoice || !VALID_MCQ_LETTERS.includes(args.mcqChoice)) {
        throw new Error("Pick one of A, B, C, or D.");
      }
    }

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) throw new Error("Scenario not found");
    if (scenario.hidden) throw new Error("Scenario unavailable");
    if (scenario.isBossScenario) {
      throw new Error("Boss scenarios require an account.");
    }
    if (mode === "mcq" && (!scenario.options || scenario.options.length === 0)) {
      throw new Error("This scenario doesn't support MCQ mode.");
    }

    const attemptId = await ctx.db.insert("attempts", {
      scenarioId: args.scenarioId,
      answer: args.answer,
      status: "pending",
      mode,
      ...(mode === "mcq" && args.mcqChoice
        ? { mcqChoice: args.mcqChoice }
        : {}),
      sessionToken,
    });

    await ctx.scheduler.runAfter(0, internal.judge.run, { attemptId });

    console.log("attempts.submitGuest", {
      sessionToken,
      scenarioId: args.scenarioId,
      attemptId,
      mode,
      durationMs: Date.now() - started,
    });

    return { attemptId, sessionToken };
  },
});

export const claimGuestAttempt = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("Finish onboarding first");

    const candidates = await ctx.db
      .query("attempts")
      .withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken))
      .take(10);

    let claimed = 0;
    const claimedAttemptIds: typeof candidates[number]["_id"][] = [];
    for (const attempt of candidates) {
      if (attempt.userId !== undefined) continue;

      // Patch first so subsequent queries include this attempt under the user.
      await ctx.db.patch(attempt._id, {
        userId: user._id,
        sessionToken: undefined,
      });
      claimed++;
      claimedAttemptIds.push(attempt._id);

      // Only scored attempts roll up into user state. Pending → judge's
      // writeScore handles the rollup when it lands. Error → nothing to add.
      if (
        attempt.status !== "scored" ||
        attempt.xpAwarded === undefined ||
        attempt.xpAwarded === null
      ) {
        continue;
      }

      // Re-fetch user (state may have shifted across iterations) and recent
      // attempts (now includes the just-claimed one).
      const fresh = await ctx.db.get(user._id);
      if (!fresh) continue;

      const recent = await ctx.db
        .query("attempts")
        .withIndex("by_user", (q) => q.eq("userId", fresh._id))
        .order("desc")
        .take(20);

      const prevScored = recent.find(
        (a) => a._id !== attempt._id && a.status === "scored",
      );
      const claimedIST = istDayOf(attempt._creationTime);

      let newStreak = 1;
      if (prevScored) {
        const prevIST = istDayOf(prevScored._creationTime);
        if (prevIST === claimedIST) {
          newStreak = fresh.streak;
        } else {
          const gap = daysBetweenIST(prevIST, claimedIST);
          newStreak = gap === 1 ? fresh.streak + 1 : 1;
        }
      }

      const newTotalXP = fresh.totalXP + attempt.xpAwarded;

      // Level: anon attempts never trigger boss (rate-limited to 1, no boss
      // scenarios served to anon). Apply the standard freeze for L1/L2.
      let newLevel = fresh.level;
      const potentialLevel = levelForTotalXP(newTotalXP);
      if (potentialLevel > fresh.level && fresh.level >= 3) {
        newLevel = potentialLevel;
      }

      // Archetype mode over last 5 scored — recent already includes the claim.
      const lastFive = recent
        .filter((a) => a.status === "scored" && a.archetype)
        .slice(0, 5);
      const counts = new Map<string, number>();
      for (const a of lastFive) {
        if (a.archetype) counts.set(a.archetype, (counts.get(a.archetype) ?? 0) + 1);
      }
      let modeArchetype: string | undefined;
      let maxCount = 0;
      for (const a of lastFive) {
        if (!a.archetype) continue;
        const c = counts.get(a.archetype)!;
        if (c > maxCount) {
          maxCount = c;
          modeArchetype = a.archetype;
        }
      }

      await ctx.db.patch(fresh._id, {
        streak: newStreak,
        longestStreak: Math.max(fresh.longestStreak, newStreak),
        totalXP: newTotalXP,
        level: newLevel,
        ...(modeArchetype !== undefined
          ? {
              currentArchetype:
                modeArchetype as Doc<"users">["currentArchetype"],
            }
          : {}),
      });
    }

    return { claimed, claimedAttemptIds };
  },
});

export const isReplay = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return false;
    if (!attempt.userId) return false;
    const userId = attempt.userId;
    const userAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);
    return userAttempts.some(
      (a) =>
        a._id !== attempt._id &&
        a.scenarioId === attempt.scenarioId &&
        a._creationTime < attempt._creationTime,
    );
  },
});

export const guestHasPlayed = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("attempts")
      .withIndex("by_session", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    return existing !== null;
  },
});

export const getGuest = query({
  args: {
    attemptId: v.id("attempts"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    if (attempt.sessionToken !== args.sessionToken) return null;
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

export const submit = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    answer: v.string(),
    mode: v.optional(
      v.union(v.literal("long-form"), v.literal("mcq")),
    ),
    mcqChoice: v.optional(v.string()),
    referrerHandle: v.optional(v.string()),
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

    const mode = args.mode ?? "long-form";
    const words = countWords(args.answer);
    if (mode === "long-form") {
      if (words < LONG_MIN_WORDS) {
        throw new Error(
          `Answer is too short — at least ${LONG_MIN_WORDS} words.`,
        );
      }
      if (words > LONG_MAX_WORDS) {
        throw new Error(
          `Answer is too long — keep it under ${LONG_MAX_WORDS} words.`,
        );
      }
    } else {
      if (words < MCQ_MIN_WORDS) {
        throw new Error(
          `Why is too short — at least ${MCQ_MIN_WORDS} words.`,
        );
      }
      if (words > MCQ_MAX_WORDS) {
        throw new Error(
          `Why is too long — keep it under ${MCQ_MAX_WORDS} words.`,
        );
      }
      if (!args.mcqChoice || !VALID_MCQ_LETTERS.includes(args.mcqChoice)) {
        throw new Error("Pick one of A, B, C, or D.");
      }
    }

    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) throw new Error("Scenario not found");
    if (scenario.hidden) throw new Error("Scenario unavailable");
    if (mode === "mcq" && (!scenario.options || scenario.options.length === 0)) {
      throw new Error("This scenario doesn't support MCQ mode.");
    }

    let challengerUserId: typeof user._id | undefined;
    if (args.referrerHandle && args.referrerHandle.length > 0) {
      const normalized = args.referrerHandle.trim().toLowerCase();
      const challenger = await ctx.db
        .query("users")
        .withIndex("by_handle", (q) => q.eq("handle", normalized))
        .unique();
      if (challenger && challenger._id !== user._id) {
        challengerUserId = challenger._id;
      }
    }

    const attemptId = await ctx.db.insert("attempts", {
      userId: user._id,
      scenarioId: args.scenarioId,
      answer: args.answer,
      status: "pending",
      mode,
      ...(mode === "mcq" && args.mcqChoice
        ? { mcqChoice: args.mcqChoice }
        : {}),
      ...(challengerUserId
        ? { challengeContext: { challengerUserId } }
        : {}),
    });

    if (challengerUserId) {
      await ctx.db.insert("challenges", {
        challengerUserId,
        challengedUserId: user._id,
        attemptId,
        accepted: true,
      });
    }

    await incrementPlayUsage(ctx, user._id);

    await ctx.scheduler.runAfter(0, internal.judge.run, { attemptId });

    console.log("attempts.submit", {
      userId: user._id,
      scenarioId: args.scenarioId,
      attemptId,
      challengerUserId: challengerUserId ?? null,
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

    const author = attempt.userId ? await ctx.db.get(attempt.userId) : null;

    const { answer: _redacted, ...attemptSansAnswer } = attempt;

    return {
      attempt: attemptSansAnswer,
      scenario: {
        title: scenario.title,
        body: scenario.body,
        difficulty: scenario.difficulty,
      },
      author: author
        ? {
            handle: author.handle,
            displayName: author.showRealName ? (author.name ?? null) : null,
            level: author.level,
          }
        : null,
    };
  },
});
