import { internalMutation } from "./_generated/server";

const RUBRIC = `Grade the answer on:
- Product Sense: does it name the real tradeoff, not a surface reframe?
- Analytical Execution: does it cite a number, metric, or proxy — or at least acknowledge the uncertainty?
- Strategic Thinking: does it make a specific call, not hedge everything?
- Communication: is it tight, specific, and readable in under 30 seconds?`;

type SeedScenario = {
  level: number;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  body: string;
};

const SCENARIOS: SeedScenario[] = [
  {
    level: 1,
    difficulty: "easy",
    title: "Feature spec review",
    body: "Priya, the EM, drops a one-pager for a new notification feature into your inbox and wants your first take by EOD. Reply with three specific concerns you'd raise before greenlighting any work, and what you'd need to know before agreeing to a v1.",
  },
  {
    level: 1,
    difficulty: "easy",
    title: "Copy tweak, no data",
    body: "Marketing wants to change the onboarding CTA from 'Start your free trial' to 'Try it free'. They have no data — just vibes. Reply with what you'd say in #product-copy to either agree or push back, and what you'd measure either way.",
  },
  {
    level: 2,
    difficulty: "easy",
    title: "Sunsetting a feature",
    body: "Your PM lead asks you to sunset a rarely-used share-to-email feature that still has about 600 WAU. Reply with your deprecation plan: what you tell users, what data you'd collect first, and what you'd do with the engineers it frees up.",
  },
  {
    level: 2,
    difficulty: "medium",
    title: "P0 on Android",
    body: "P0 bug: users on Android 14 can't submit payments. Eng lead says three-day fix minimum. Support is flooded. Reply with what you communicate to customers, the support team, and the rest of the product org — in that order.",
  },
  {
    level: 3,
    difficulty: "medium",
    title: "Experiment call",
    body: "Your pricing-page A/B test ran for two weeks. Variant B shows +4% conversion, p = 0.11. Your boss wants to ship. The design lead wants to wait. Reply with your call and your reasoning.",
  },
  {
    level: 3,
    difficulty: "medium",
    title: "Roadmap ranking",
    body: "You have three months of eng capacity and four competing initiatives: a retention fix (~$400k ARR at risk), a sales-asked enterprise feature (~$1M pipeline), a developer API (cost savings), and an engineer-proposed refactor (unblocks speed). Reply with your ranking and why.",
  },
  {
    level: 4,
    difficulty: "medium",
    title: "48 hours to resolve",
    body: "Design wants to redesign the signup flow. Eng says the backend won't support the new flow without a rewrite. Sales is pushing for a demo-ready version next month. Reply with how you'd resolve this in 48 hours, and who gets the first conversation.",
  },
  {
    level: 4,
    difficulty: "hard",
    title: "North Star for onboarding",
    body: "Your team is picking a North Star for the self-serve onboarding flow. Eng wants 'completion rate'. Marketing wants 'activated accounts'. Support wants 'week-1 tickets avoided'. Reply with your North Star, why, and what guardrails you'd set.",
  },
  {
    level: 5,
    difficulty: "medium",
    title: "Consolidating notifications",
    body: "Four product teams are each building their own notification system. Infra proposes consolidating into one shared service. Every team is resistant. Reply with how you'd frame the tradeoff in the next exec review, in 200 words.",
  },
  {
    level: 5,
    difficulty: "hard",
    title: "New AI feature launch",
    body: "Your team built a new AI feature. Marketing wants a big press launch. Sales wants to limit it to top 50 existing accounts first. Finance is worried about cost per query. Reply with your launch strategy and the single risk that would make you delay.",
  },
  {
    level: 6,
    difficulty: "hard",
    title: "New entrant eating mid-market",
    body: "A new AI entrant is eating your mid-market. They have half your features, a third your price, and ten times the hype. Your CEO asks what you'd change about the roadmap. Reply.",
  },
  {
    level: 6,
    difficulty: "hard",
    title: "Moving to usage-based pricing",
    body: "You're considering moving from per-seat to usage-based pricing. Existing customers are a mix of happy and skeptical. Sales is nervous. Reply with your rollout plan and the top three risks you'd sequence for.",
  },
  {
    level: 7,
    difficulty: "hard",
    title: "One team underperforming",
    body: "You have eight PMs across four product areas. One area is underperforming against every metric and has been for two quarters. Reply with your options and your call.",
  },
  {
    level: 7,
    difficulty: "hard",
    title: "Two PM finalists",
    body: "You need to hire a Senior PM for a new platform team. You have two finalists: one is a platform-first generalist with six years; one is a former engineer turned PM with three years and sharp technical instincts. Reply with your call and what tipped it.",
  },
  {
    level: 8,
    difficulty: "hard",
    title: "Evaluating an acquisition",
    body: "Your CEO is evaluating acquiring a 40-person AI startup that overlaps about 30% with your roadmap. Reply with the three questions you'd want answered before saying yes, and what you'd want as the integration plan.",
  },
  {
    level: 8,
    difficulty: "hard",
    title: "Q3 board narrative",
    body: "Q3 board prep. Revenue is flat, engagement is down 6%, but NPS is up 12. You have one slide to tell the story. Reply with your slide title, your three bullets, and the one question you want the board to leave with.",
  },
];

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("scenarios").take(1);
    if (existing.length > 0) {
      return { skipped: true, reason: "Scenarios already exist" };
    }
    for (const s of SCENARIOS) {
      await ctx.db.insert("scenarios", {
        title: s.title,
        body: s.body,
        rubric: RUBRIC,
        level: s.level,
        difficulty: s.difficulty,
        isBossScenario: false,
        hidden: false,
      });
    }
    return { inserted: SCENARIOS.length };
  },
});
