import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

function currentISTDate(): string {
  return formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
}

function firstTwoSentences(body: string): string {
  const parts = body.split(/(?<=[.!?])\s+/).slice(0, 2);
  return parts.join(" ").trim();
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export const getTodaysScenario = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    let user = null;
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
    }
    const userLevel = user?.level ?? 1; // anon visitors get L1 (Intern)

    // Boss override: only for signed-in users with a pending non-cooldown boss.
    if (user) {
      const bossCandidates = await ctx.db
        .query("bossFights")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(10);
      const activeBoss = bossCandidates.find((bf) => !bf.passed);
      if (activeBoss) {
        const now = Date.now();
        const ready =
          activeBoss.retryAvailableAt === undefined ||
          activeBoss.retryAvailableAt <= now;
        if (ready) {
          const bossScenario = await ctx.db.get(activeBoss.scenarioId);
          if (bossScenario && !bossScenario.hidden) {
            return { ...bossScenario, isReplay: false as const };
          }
        }
      }
    }

    const candidates = await ctx.db
      .query("scenarios")
      .withIndex("by_level_difficulty", (q) => q.eq("level", userLevel))
      .take(100);
    const eligible = candidates.filter(
      (s) => !s.hidden && !s.isBossScenario,
    );
    if (eligible.length === 0) return null;

    const today = currentISTDate();

    if (user) {
      // Signed-in: skip scenarios this user has already attempted. Prefer
      // today's stamped scenario when it's still unattempted (Wordle-style
      // "Today's Case"); fall back to any unattempted at this level; then
      // surface today's stamped (or any eligible) flagged isReplay.
      const userAttempts = await ctx.db
        .query("attempts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(500);
      const attemptedIds = new Set(userAttempts.map((a) => a.scenarioId));
      const unattempted = eligible.filter((s) => !attemptedIds.has(s._id));

      if (unattempted.length > 0) {
        const stampedUnattempted = unattempted.find(
          (s) => s.activeDate === today,
        );
        const pick = stampedUnattempted ?? unattempted[0];
        return { ...pick, isReplay: false as const };
      }

      const stamped =
        eligible.find((s) => s.activeDate === today) ?? eligible[0];
      return { ...stamped, isReplay: true as const };
    }

    // Anon: deterministic pick keyed on the IST date so every anon visitor
    // today sees the same L1 scenario, and tomorrow's anons see a different
    // one. Wordle-feel without needing a per-day cron stamp.
    const seed = hashStr(today);
    const pick = eligible[seed % eligible.length];
    return { ...pick, isReplay: false as const };
  },
});

export const getPreview = query({
  args: {},
  handler: async (ctx) => {
    const today = currentISTDate();
    const active = await ctx.db
      .query("scenarios")
      .withIndex("by_date", (q) => q.eq("activeDate", today))
      .take(20);

    let scenario = active.find(
      (s) => s.level === 1 && !s.hidden && !s.isBossScenario,
    );
    if (!scenario) {
      const fallback = await ctx.db
        .query("scenarios")
        .withIndex("by_level_difficulty", (q) => q.eq("level", 1))
        .take(20);
      scenario = fallback.find((s) => !s.hidden && !s.isBossScenario);
    }
    if (!scenario) return null;

    return {
      title: scenario.title,
      preview: firstTwoSentences(scenario.body),
    };
  },
});

export const rotateDaily = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = currentISTDate();
    const rotations: { level: number; scenarioId: string }[] = [];

    for (let level = 1; level <= 8; level++) {
      const candidates = await ctx.db
        .query("scenarios")
        .withIndex("by_level_difficulty", (q) => q.eq("level", level))
        .take(100);
      const available = candidates.filter(
        (s) => !s.hidden && !s.isBossScenario,
      );
      if (available.length === 0) continue;

      const alreadyActive = available.find((s) => s.activeDate === today);
      if (alreadyActive) {
        rotations.push({ level, scenarioId: alreadyActive._id });
        continue;
      }

      const sorted = [...available].sort((a, b) => {
        const aDate = a.activeDate ?? "";
        const bDate = b.activeDate ?? "";
        return aDate.localeCompare(bDate);
      });
      const next = sorted[0];
      await ctx.db.patch(next._id, { activeDate: today });
      rotations.push({ level, scenarioId: next._id });
    }

    return { date: today, rotations };
  },
});
