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

export const getTodaysScenario = query({
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

    const today = currentISTDate();
    const active = await ctx.db
      .query("scenarios")
      .withIndex("by_date", (q) => q.eq("activeDate", today))
      .take(20);

    const match = active.find(
      (s) => s.level === user.level && !s.hidden && !s.isBossScenario,
    );
    if (match) return match;

    const candidates = await ctx.db
      .query("scenarios")
      .withIndex("by_level_difficulty", (q) => q.eq("level", user.level))
      .take(20);
    return (
      candidates.find((s) => !s.hidden && !s.isBossScenario) ?? null
    );
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
