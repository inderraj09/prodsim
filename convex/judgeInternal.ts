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
const BOSS_BADGE = "Cleared Boss: Sam";

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
    const user = attempt.userId ? await ctx.db.get(attempt.userId) : null;
    return {
      userAnswer: attempt.answer,
      userLevel: user?.level ?? 1,
      scenarioTitle: scenario.title,
      scenarioBody: scenario.body,
      scenarioDifficulty: scenario.difficulty as string,
      scenarioRubric: scenario.rubric,
      mode: (attempt.mode ?? "long-form") as "long-form" | "mcq",
      mcqOptions: scenario.options ?? [],
      mcqChoice: attempt.mcqChoice ?? undefined,
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

    const user = attempt.userId ? await ctx.db.get(attempt.userId) : null;

    const scenario = await ctx.db.get(attempt.scenarioId);
    if (!scenario) throw new Error("Scenario missing for attempt");

    const isBoss = scenario.isBossScenario;
    const now = Date.now();
    const todayIST = istDayOf(now);

    // ── Boss evaluation (only if this attempt has a user — anon never boss) ───
    let bossPassed = false;
    let bossToLevel: number | null = null;
    if (isBoss && user) {
      const candidates = await ctx.db
        .query("bossFights")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(10);
      const activeBoss = candidates.find((bf) => !bf.passed);
      if (activeBoss) {
        const d = args.dimensionScores;
        const composite =
          d.productSense +
          d.analyticalExecution +
          d.strategicThinking +
          d.communication;
        bossPassed =
          composite >= 14 &&
          d.productSense >= 3 &&
          d.analyticalExecution >= 3 &&
          d.strategicThinking >= 3 &&
          d.communication >= 3;

        if (bossPassed) {
          await ctx.db.patch(activeBoss._id, {
            passed: true,
            attemptId: args.attemptId,
            retryAvailableAt: undefined,
          });
          bossToLevel = activeBoss.toLevel;
        } else {
          await ctx.db.patch(activeBoss._id, {
            attemptId: args.attemptId,
            retryAvailableAt: now + DAY_MS,
          });
        }
      }
    }

    // ── Streak — only meaningful with a user ──────────────────────────
    let newStreak = 1;
    if (user) {
      const recentForStreak = await ctx.db
        .query("attempts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(20);
      const prevScored = recentForStreak.find(
        (a) => a._id !== args.attemptId && a.status === "scored",
      );
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
    }

    // ── XP — always computed for attempt.xpAwarded display ────────────
    const xpAwarded = computeXPAward({
      overallScore: args.overallScore,
      difficulty: scenario.difficulty as Difficulty,
      streak: newStreak,
    });
    const newTotalXP = user ? user.totalXP + xpAwarded : 0;

    // ── Level: boss-pass overrides; regular path keeps L1/L2 frozen ──
    let newLevel = user?.level ?? 1;
    if (user) {
      if (bossPassed && bossToLevel !== null) {
        newLevel = bossToLevel;
      } else if (!isBoss) {
        const potentialLevel = levelForTotalXP(newTotalXP);
        if (potentialLevel > user.level && user.level >= 3) {
          newLevel = potentialLevel;
        }
      }
    }

    // ── Patch attempt with score (always) ─────────────────────────────
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

    // Anon attempts stop here — no user doc to roll up into.
    if (!user) return;

    // ── Archetype mode of last 5 scored (includes this attempt) ───────
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

    // ── Badges (boss pass earns "Cleared Boss: Sam") ──────────────────
    let newBadges: string[] | undefined;
    if (bossPassed) {
      const existing = user.badges ?? [];
      if (!existing.includes(BOSS_BADGE)) {
        newBadges = [...existing, BOSS_BADGE];
      }
    }

    // ── Patch user atomically ─────────────────────────────────────────
    await ctx.db.patch(user._id, {
      streak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      totalXP: newTotalXP,
      level: newLevel,
      ...(modeArchetype !== undefined ? { currentArchetype: modeArchetype } : {}),
      ...(newBadges !== undefined ? { badges: newBadges } : {}),
    });

    // ── Threshold detection for regular attempts ──────────────────────
    if (!isBoss) {
      const fromLevel = user.level;
      const thresholdCrossed =
        (fromLevel === 1 && newTotalXP >= 300) ||
        (fromLevel === 2 && newTotalXP >= 800);
      if (thresholdCrossed) {
        const toLevel = fromLevel + 1;
        const existing = await ctx.db
          .query("bossFights")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(10);
        const hasPending = existing.some(
          (bf) => !bf.passed && bf.fromLevel === fromLevel,
        );
        if (!hasPending) {
          const bossScenarios = await ctx.db
            .query("scenarios")
            .withIndex("by_level_difficulty", (q) =>
              q.eq("level", fromLevel).eq("difficulty", "boss"),
            )
            .take(10);
          const bossScenario = bossScenarios.find(
            (s) => s.isBossScenario && !s.hidden,
          );
          if (bossScenario) {
            await ctx.db.insert("bossFights", {
              userId: user._id,
              fromLevel,
              toLevel,
              scenarioId: bossScenario._id,
              passed: false,
            });
          }
        }
      }
    }
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
