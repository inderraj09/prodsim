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
  options: [string, string, string, string];
};

const SCENARIOS: SeedScenario[] = [
  {
    level: 1,
    difficulty: "easy",
    title: "Feature spec review",
    body: "Priya, the EM, drops a one-pager for a new notification feature into your inbox and wants your first take by EOD. Reply with three specific concerns you'd raise before greenlighting any work, and what you'd need to know before agreeing to a v1.",
    options: [
      "Ask Priya for the user research, success metric, and rollback plan before any commit.",
      "Approve and unblock — Priya knows the team better than I do; my job isn't to gatekeep her spec.",
      "Suggest a 30-min sync with Priya and the design lead before the team picks up tickets.",
      "Counter-propose: skip the spec entirely, ship a 2-week prototype to 5% of users instead.",
    ],
  },
  {
    level: 1,
    difficulty: "easy",
    title: "Copy tweak, no data",
    body: "Marketing wants to change the onboarding CTA from 'Start your free trial' to 'Try it free'. They have no data — just vibes. Reply with what you'd say in #product-copy to either agree or push back, and what you'd measure either way.",
    options: [
      "Push back — no data, no change. Set up a 2-week A/B with the new copy as variant first.",
      "Approve — copy iteration is cheap, vibes are a valid signal at this scale.",
      "Loop in design + growth, run a 30-min review of the funnel hypothesis before deciding.",
      "Reframe — propose three copy variants and pick the winner via a 7-day test.",
    ],
  },
  {
    level: 2,
    difficulty: "easy",
    title: "Sunsetting a feature",
    body: "Your PM lead asks you to sunset a rarely-used share-to-email feature that still has about 600 WAU. Reply with your deprecation plan: what you tell users, what data you'd collect first, and what you'd do with the engineers it frees up.",
    options: [
      "Run a 4-week deprecation window with email warnings; only kill if usage drops below 100 WAU.",
      "Sunset on the announced date — 600 WAU isn't a strategic line, the eng time is.",
      "Survey the 600 users first, build a kill-or-keep recommendation from their answers.",
      "Migrate the 600 to a lighter version of the same feature — keep value, free engineers.",
    ],
  },
  {
    level: 2,
    difficulty: "medium",
    title: "P0 on Android",
    body: "P0 bug: users on Android 14 can't submit payments. Eng lead says three-day fix minimum. Support is flooded. Reply with what you communicate to customers, the support team, and the rest of the product org — in that order.",
    options: [
      "Acknowledge to customers immediately, give support a script, don't promise an ETA tighter than 3 days.",
      "Override eng — pull two engineers off the current sprint to ship a hotfix in 24 hours.",
      "Run an incident channel; sync hourly with eng/support/marketing until shipped.",
      "Communicate by tier: top customers get a personal email, others get an in-app notice.",
    ],
  },
  {
    level: 3,
    difficulty: "medium",
    title: "Experiment call",
    body: "Your pricing-page A/B test ran for two weeks. Variant B shows +4% conversion, p = 0.11. Your boss wants to ship. The design lead wants to wait. Reply with your call and your reasoning.",
    options: [
      "Don't ship — p=0.11 is below the 0.05 bar. Keep running for 2 more weeks.",
      "Ship — +4% conversion on a pricing page is real money. The bar should be effect size, not p.",
      "Bring it to the experiment review committee Friday; let the org's calibration decide, not yours.",
      "Ship to 50% as a phased rollout — keep monitoring, kill if effect flattens.",
    ],
  },
  {
    level: 3,
    difficulty: "medium",
    title: "Roadmap ranking",
    body: "You have three months of eng capacity and four competing initiatives: a retention fix (~$400k ARR at risk), a sales-asked enterprise feature (~$1M pipeline), a developer API (cost savings), and an engineer-proposed refactor (unblocks speed). Reply with your ranking and why.",
    options: [
      "Retention fix first ($400k at risk, defensive), then enterprise, then API, then refactor.",
      "Enterprise first — $1M pipeline beats $400k risk; the retention fix can wait one quarter.",
      "Run a half-day prioritization workshop with eng, sales, and the team — let the numbers argue.",
      "Refactor first — the speed unlock makes everything else 30% faster downstream.",
    ],
  },
  {
    level: 4,
    difficulty: "medium",
    title: "48 hours to resolve",
    body: "Design wants to redesign the signup flow. Eng says the backend won't support the new flow without a rewrite. Sales is pushing for a demo-ready version next month. Reply with how you'd resolve this in 48 hours, and who gets the first conversation.",
    options: [
      "1:1 with eng lead first — without their buy-in, no plan ships.",
      "Decision by EOD: design's redesign, eng's rewrite gated to next quarter, sales gets the demo build.",
      "Joint working session with all three Friday afternoon — leave with a signed plan.",
      "Push the demo by 4 weeks — buy time to do this right, not fast.",
    ],
  },
  {
    level: 4,
    difficulty: "hard",
    title: "North Star for onboarding",
    body: "Your team is picking a North Star for the self-serve onboarding flow. Eng wants 'completion rate'. Marketing wants 'activated accounts'. Support wants 'week-1 tickets avoided'. Reply with your North Star, why, and what guardrails you'd set.",
    options: [
      "Activation — owns the funnel and isn't gameable by support hiding tickets.",
      "Completion rate — eng and design can move it, marketing can't game it.",
      "Run a 1-week shadow track for all three; pick the one that correlates with day-30 retention.",
      "Compose: 'activated accounts who avoid week-1 tickets' — captures all three.",
    ],
  },
  {
    level: 5,
    difficulty: "medium",
    title: "Consolidating notifications",
    body: "Four product teams are each building their own notification system. Infra proposes consolidating into one shared service. Every team is resistant. Reply with how you'd frame the tradeoff in the next exec review, in 200 words.",
    options: [
      "Frame as quarterly tax: each team gives 1 engineer for 6 weeks, infra owns from there.",
      "Hard call: consolidate. The eng cost of 4 codebases is bigger than the autonomy cost.",
      "Pilot with one willing team for a quarter; let the result decide for the others.",
      "Reframe: don't consolidate code, consolidate the spec — shared schema, separate implementations.",
    ],
  },
  {
    level: 5,
    difficulty: "hard",
    title: "New AI feature launch",
    body: "Your team built a new AI feature. Marketing wants a big press launch. Sales wants to limit it to top 50 existing accounts first. Finance is worried about cost per query. Reply with your launch strategy and the single risk that would make you delay.",
    options: [
      "Sales' top-50 first; learn cost economics for 4 weeks before press.",
      "Big launch — momentum windows are short; the cost concern is post-hoc rationalization.",
      "Phased: top-50 in week 1, GA in week 4, press in week 6 — match risk to confidence.",
      "Don't launch publicly — make it a paid premium tier, charge for cost, learn willingness-to-pay.",
    ],
  },
  {
    level: 6,
    difficulty: "hard",
    title: "New entrant eating mid-market",
    body: "A new AI entrant is eating your mid-market. They have half your features, a third your price, and ten times the hype. Your CEO asks what you'd change about the roadmap. Reply.",
    options: [
      "Don't change the roadmap — chasing them is reactive; double down on enterprise where you win.",
      "Cut three roadmap items, ship a pricing-and-speed-focused 90-day response.",
      "Get in front of 20 mid-market customers next week; let the diagnosis come from them.",
      "Acquire the entrant or partner — your distribution + their product = faster than building.",
    ],
  },
  {
    level: 6,
    difficulty: "hard",
    title: "Moving to usage-based pricing",
    body: "You're considering moving from per-seat to usage-based pricing. Existing customers are a mix of happy and skeptical. Sales is nervous. Reply with your rollout plan and the top three risks you'd sequence for.",
    options: [
      "Grandfather all existing customers at current pricing for 12 months; new logos only on usage.",
      "Cut over now. Migration pain in Q1 is worth the alignment with value capture.",
      "Pilot usage-based with 5 willing customers for 90 days, then commit or revert.",
      "Hybrid — offer both pricing models for 18 months, let customers self-select.",
    ],
  },
  {
    level: 7,
    difficulty: "hard",
    title: "One team underperforming",
    body: "You have eight PMs across four product areas. One area is underperforming against every metric and has been for two quarters. Reply with your options and your call.",
    options: [
      "Replace the PM lead — two quarters is enough signal.",
      "Disband the team, redistribute the 8 PMs, sunset the product line.",
      "Run a 30-day diagnostic with the PM lead and skip-level — fix root cause or move them.",
      "Move the team's product into another team's portfolio; let the strongest org take over.",
    ],
  },
  {
    level: 7,
    difficulty: "hard",
    title: "Two PM finalists",
    body: "You need to hire a Senior PM for a new platform team. You have two finalists: one is a platform-first generalist with six years; one is a former engineer turned PM with three years and sharp technical instincts. Reply with your call and what tipped it.",
    options: [
      "Hire the platform-first generalist — 6 years > 3, breadth matches the role.",
      "Hire the engineer-turned-PM — technical depth is the platform team's missing axis.",
      "Run a 90-day contract with each before deciding; no pure-interview hiring at this level.",
      "Don't hire either — the role description is wrong if both feel close, redo the loop.",
    ],
  },
  {
    level: 8,
    difficulty: "hard",
    title: "Evaluating an acquisition",
    body: "Your CEO is evaluating acquiring a 40-person AI startup that overlaps about 30% with your roadmap. Reply with the three questions you'd want answered before saying yes, and what you'd want as the integration plan.",
    options: [
      "What does their team look like 12 months in? — culture first, IP second.",
      "What's our integration cost vs. building the same in 18 months?",
      "Whose customers do we lose if we buy them, and is that worth their book?",
      "What signals would tell us in 6 months it was the wrong call — define the kill criteria up-front.",
    ],
  },
  {
    level: 8,
    difficulty: "hard",
    title: "Q3 board narrative",
    body: "Q3 board prep. Revenue is flat, engagement is down 6%, but NPS is up 12. You have one slide to tell the story. Reply with your slide title, your three bullets, and the one question you want the board to leave with.",
    options: [
      "Title: 'Engagement is a leading indicator.' Frame revenue as lagging, NPS as leading.",
      "Title: 'We have a retention problem.' Name the cause, the fix, and the cost.",
      "Title: 'Revenue flat, cohort up.' Dig into NPS gain and ARR steady-state.",
      "Title: 'We're at the inflection.' Show the prior 4 quarters, the pivot, the Q4 bet.",
    ],
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
        options: [...s.options],
      });
    }
    return { inserted: SCENARIOS.length };
  },
});

const BOSS_RUBRIC_L1 = `This is a boss-fight gate. Score 5 only when the answer demonstrates ALL of:
- Product Sense: names the actual tradeoff in one sentence — not a vague reframe.
- Analytical Execution: cites a metric, threshold, or measurable proxy. Acknowledges what they'd be wrong about.
- Strategic Thinking: commits to a specific recommendation; does not present three balanced options to the VP.
- Communication: tight, decisive, scannable on a phone in 30 seconds. No hedging.
A 4 is good but missing one of the above for that dimension. A 3 is a clear point of view but a real gap. Below 3 is not Senior-ready.`;

const BOSS_RUBRIC_L2 = `This is the senior-PM gate. Score 5 only when the answer:
- Product Sense: names the actual decision (not avoidance), with the false-dichotomy or accepted tradeoff stated explicitly.
- Analytical Execution: sequences the work — what ships first, what's sacrificed, with rough numbers (eng-weeks, ARR at risk, not just "soon").
- Strategic Thinking: states priors, names the data they'd want, takes ownership of being wrong.
- Communication: reads like Sam can copy-paste it upward to her boss. No qualifiers on every sentence.
A 4 means strong but missing rigor on one axis. A 3 is a real call with execution gaps. The bar is high — this scenario gates promotion to PM II.`;

type BossSeed = {
  level: 1 | 2;
  title: string;
  body: string;
  rubric: string;
  options: [string, string, string, string];
};

const BOSS_SCENARIOS: BossSeed[] = [
  {
    level: 1,
    title: "Sam wants your call by 10am",
    body: "Six weeks ago you shipped a tiny notification feature as an Intern. Marketing started using it for promo notifications and DAU is up 3%, but week-2 retention dropped 1.5pp and support volume is up 22%. Engineering wants to roll it back. Marketing says it's the most successful feature this quarter. The CEO asked Sam (your skip-level VP) what's going on, and Sam wants your written take by 10am tomorrow. You have 15 minutes. Sam doesn't want a recap — she wants your recommendation, your reasoning, the risk you're taking on, and what you'd need to be wrong about. This is your shot at PM I.",
    rubric: BOSS_RUBRIC_L1,
    options: [
      "Roll back. The 22% support spike + 1.5pp retention drop outweighs 3% DAU. Wrong if retention drop is a 1-week artifact.",
      "Keep on, throttle to 2 notifications/user/day. Wrong if throttling kills engagement entirely.",
      "Run an opt-in prompt for 2 weeks; if opt-in cohorts retain, keep, else roll back. Wrong on selection bias.",
      "Default off, opt-in for power users only. Wrong if power users were the ones churning.",
    ],
  },
  {
    level: 2,
    title: "The platform decision",
    body: "Your team has been building point features for a year. Three different product lines now have variations of the same notification, search, and onboarding logic. Engineering Director Aisha wants to consolidate into a shared platform team — 8 engineers reorged out of feature teams for 6 months. Marketing is panicking because the Q4 roadmap commits 3 user-visible features that depend on those engineers. Sam wants your recommendation by Friday. The choice is yours. The wrong answer in either direction is fine; the wrong reasoning is not. This is the PM II gate.",
    rubric: BOSS_RUBRIC_L2,
    options: [
      "Consolidate. 6-month tax now beats 24-month tech debt. 4 engineers in Q1, 4 in Q2; Q4 features delayed 4 weeks.",
      "Don't consolidate yet. 3 user-visible features matter more than internal tidiness this quarter. Revisit at year-end.",
      "Hybrid: 4 engineers form the platform team in Q1; Q4 roadmap unchanged; gradual migration over 4 quarters.",
      "Reframe: the duplication IS the tax. Pay it one more quarter, ship Q4, then consolidate hard in H1.",
    ],
  },
];

export const runBosses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("scenarios")
      .withIndex("by_level_difficulty", (q) =>
        q.eq("level", 1).eq("difficulty", "boss"),
      )
      .first();
    if (existing) {
      return { skipped: true, reason: "Boss scenarios already exist" };
    }
    for (const s of BOSS_SCENARIOS) {
      await ctx.db.insert("scenarios", {
        title: s.title,
        body: s.body,
        rubric: s.rubric,
        level: s.level,
        difficulty: "boss",
        isBossScenario: true,
        hidden: false,
        options: [...s.options],
      });
    }
    return { inserted: BOSS_SCENARIOS.length };
  },
});

export const migrateAddOptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allScenarios = await ctx.db.query("scenarios").take(200);
    const optionsByTitle = new Map<string, string[]>();
    for (const s of SCENARIOS) optionsByTitle.set(s.title, [...s.options]);
    for (const s of BOSS_SCENARIOS) optionsByTitle.set(s.title, [...s.options]);

    let patched = 0;
    let alreadyHadOptions = 0;
    let unmatched: string[] = [];
    for (const row of allScenarios) {
      if (row.options && row.options.length > 0) {
        alreadyHadOptions++;
        continue;
      }
      const opts = optionsByTitle.get(row.title);
      if (!opts) {
        unmatched.push(row.title);
        continue;
      }
      await ctx.db.patch(row._id, { options: opts });
      patched++;
    }
    return { patched, alreadyHadOptions, unmatched };
  },
});
