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

type RealScenario = {
  level: number;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  body: string;
  rubric: string;
  options: [string, string, string, string];
};

const REAL_SCENARIOS: RealScenario[] = [
  {
    level: 1,
    difficulty: "easy",
    title: "Spec review before standup",
    body: "Priya (EM) just shared a spec for a notification batching feature and asked for your eyes before standup in 25 minutes. You read it. The feature is solid but the rollout plan says 'enable for 100% of users on launch day.' Last quarter a similar feature went out at 100% and caused a support ticket spike that took the on-call eng three days to dig out of. Priya is senior, has been at the company 4 years, and you've been here 6 weeks. Sam (your skip) is in the standup. You can comment in the doc, raise it in standup, or DM Priya privately first. What do you do?",
    rubric:
      "Product Sense 5 = recognizes the rollout risk specifically (not generic 'be careful'), and weighs Priya's tenure vs the real risk; 3 = vague 'I'd raise concerns.' Analytical Execution 5 = proposes a concrete alternative (staged rollout %, kill-switch, monitoring); 3 = says 'staged rollout' without specifics. Strategic Thinking 5 = picks a path that builds the relationship with Priya rather than ambushing her in standup; 3 = doesn't consider relational cost. Communication 5 = direct but humble framing given seniority gap; 3 = either too deferential or too forward.",
    options: [
      "DM Priya now with the past incident link and suggest a staged rollout",
      "Raise the rollout concern in standup so Sam hears the thinking",
      "Comment in the doc with questions and let Priya decide before standup",
      "Approve the spec; Priya is senior and probably already considered it",
    ],
  },
  {
    level: 1,
    difficulty: "easy",
    title: "User interview went sideways",
    body: "You're shadowing a user research session Maya set up. The user — a small business owner — spends 40 of the 45 minutes complaining about a billing bug that's unrelated to the feature you're researching. Maya keeps trying to redirect; the user keeps coming back to billing. After the call, Maya says 'sorry that was a wash, let's reschedule with someone else.' You suspect the billing complaint might actually matter — three of the last five users mentioned billing friction in passing. Maya is already moving on. Sam asked for a research summary by EOD tomorrow. What do you do?",
    rubric:
      "Product Sense 5 = sees the pattern across 3/5 sessions as a signal worth surfacing, even if off-topic; 3 = treats it as noise because it's off the research goal. Analytical Execution 5 = proposes a lightweight way to verify (pull billing support tickets, check NPS comments) before escalating; 3 = jumps to 'we should fix billing.' Strategic Thinking 5 = doesn't undermine Maya's framing publicly; 3 = goes around Maya. Communication 5 = the EOD summary mentions both the original research finding AND the billing pattern as a separate observation; 3 = picks one or buries the other.",
    options: [
      "Write the summary on the original topic; flag billing as a separate observation to Sam",
      "Tell Maya you think billing is the real story and suggest pivoting the research",
      "Skip the summary and pull billing support tickets to confirm the pattern first",
      "Summarize as Maya framed it — a wash — and reschedule the next session",
    ],
  },
  {
    level: 2,
    difficulty: "easy",
    title: "Two designs, one week to ship",
    body: "You own onboarding for a new export feature shipping next Tuesday. Maya sent two designs Friday afternoon: Option A is a 3-step wizard (clear, but adds 2 days of eng work and Aisha already said the team is at capacity). Option B is a single screen with smart defaults (ships on time, but Maya thinks ~15% of users will hit a confusing edge case on first use). Rohan wants the launch on time because it's tied to a partner announcement. You have one weekend to decide. Maya's in her opinions. Aisha is firm on capacity. What do you ship?",
    rubric:
      "Product Sense 5 = engages with the 15% edge case specifically — what is it, can it be mitigated cheaply (tooltip, doc link, in-app help)?; 3 = picks A or B without examining whether the 15% is a hard wall or a soft one. Analytical Execution 5 = proposes a falsifiable check (instrument the edge case, set a threshold for hotfix); 3 = ships and hopes. Strategic Thinking 5 = weighs the partner announcement value vs onboarding quality honestly; 3 = treats the deadline as untouchable or treats it as ignorable. Communication 5 = a clear note to Maya, Aisha, and Rohan with the call and the reasoning; 3 = decides without bringing the three along.",
    options: [
      "Ship B with a tooltip on the edge case and instrument it for a fast follow-up",
      "Ship A and ask Aisha to pull capacity from a lower-priority feature",
      "Ship B as-is; 85% is good enough for a launch, fix the edge case in v2",
      "Schedule a Monday meeting with Maya, Aisha, and Rohan to decide together",
    ],
  },
  {
    level: 2,
    difficulty: "easy",
    title: "Sam wants a one-pager by Friday",
    body: "Sam slacked: 'Write me a one-pager on whether we should build a public API for the templates feature. Friday EOD. Keep it tight.' You have no prior context on this. You spend Tuesday looking around: Rohan wants the API because two enterprise prospects asked for it; Aisha says the templates data model is mid-refactor and an external API now would lock in choices the team will regret; one competitor shipped a similar API last month. You have until Friday. The one-pager will probably go to Chen. How do you structure the page and what's your recommendation?",
    rubric:
      "Product Sense 5 = the recommendation engages with the data-model timing problem, not just the demand signal; 3 = recommends building because customers want it. Analytical Execution 5 = quantifies something (deal size of the 2 prospects, cost of refactor delay, competitor's traction); 3 = stays qualitative. Strategic Thinking 5 = either 'wait 1 quarter for refactor' with explicit cost, or 'build minimal v1 now' with explicit risk — picks a side; 3 = 'it depends.' Communication 5 = one-pager has a recommendation in the first paragraph; 3 = buries the recommendation or doesn't make one.",
    options: [
      "Recommend building a minimal API now; the deal value justifies the lock-in risk",
      "Recommend waiting 1 quarter for the refactor; offer prospects a workaround",
      "Lay out three options with pros/cons and let Sam decide — it's above your level",
      "Recommend building now and refactoring the API in 6 months as a v2",
    ],
  },
  {
    level: 3,
    difficulty: "medium",
    title: "Aisha's promised feature is slipping",
    body: "Aisha just slacked: the recommendation engine she promised for Q4 will slip 6 weeks because two engineers are leaving. Rohan committed it to Alex (a tier-1 customer doing $1.2M ARR) in an email last month — you weren't on the thread. Alex's renewal is in February. You have a call with Alex in 20 minutes that was supposed to be a feature preview. Aisha will not commit to the original date no matter what. Rohan is on PTO until Monday. What do you say on the Alex call?",
    rubric:
      "Product Sense 5 = does not over-promise to save the call; names the slip clearly; 3 = vague 'we're refining the timeline.' Analytical Execution 5 = comes with something concrete to offer Alex (early access to a partial cut, a different feature that solves part of their problem, a credit); 3 = just delivers the bad news. Strategic Thinking 5 = considers what this means for the February renewal, not just the call; 3 = treats it as a one-meeting problem. Communication 5 = direct, takes accountability without throwing Rohan or Aisha under the bus; 3 = either covers for the team unconvincingly or blames internally.",
    options: [
      "Tell Alex the date is slipping ~6 weeks; offer early access to a partial version and a working session on their use case",
      "Hold the original date on the call and figure out internally how to make it work after",
      "Reschedule the call until Monday when Rohan is back and you have a unified story",
      "Tell Alex the timeline is being 'refined' and you'll have an update next week",
    ],
  },
  {
    level: 3,
    difficulty: "medium",
    title: "Cut a feature or cut quality",
    body: "Six weeks into an eight-week sprint for a redesigned dashboard. Priya (EM) tells you the team will hit the deadline only if they skip the keyboard-shortcut layer Maya designed (power users love these). Cutting it saves 9 days. The alternative is shipping a week late, which means missing the customer advisory board demo where Chen has been hyping the redesign. Maya is already pissed about prior cuts this quarter and has hinted she might escalate to her own director if shortcuts get cut. What's your call?",
    rubric:
      "Product Sense 5 = engages with whether keyboard shortcuts are actually load-bearing for the demo audience (likely not — CAB is execs, not power users); 3 = treats Maya's pushback as the deciding factor. Analytical Execution 5 = proposes shipping without shortcuts AND a concrete plan to add them in the next sprint with a date; 3 = cuts and moves on. Strategic Thinking 5 = treats Maya's relationship as a real cost worth managing, not a tax to absorb; 3 = either capitulates to Maya or steamrolls her. Communication 5 = talks to Maya before the decision lands, not after; 3 = informs Maya as a fait accompli.",
    options: [
      "Cut shortcuts, talk to Maya first, commit to a dated fast-follow next sprint",
      "Slip a week to keep shortcuts; Chen can re-pitch the demo or show a recording",
      "Ship on time without shortcuts and tell Maya it'll come back 'soon'",
      "Ask Priya to find 9 days somewhere else — pull from QA or docs",
    ],
  },
  {
    level: 4,
    difficulty: "medium",
    title: "Kill the project you championed",
    body: "Nine months ago you pitched and got funded a self-serve onboarding flow that was supposed to cut sales-assisted deals by 30%. Two quarters in: self-serve conversion is 1.4%, well below the 4% you projected. The team (5 engineers, 1 designer) is burning ~$2M/yr. Your read: the ICP we're getting on self-serve is fundamentally different from sales-led, and we'd need 6+ more months and a different pricing page to know if it can work. Sam asked for a recommendation by Monday. Killing it means redirecting the team and admitting your bet was wrong. What do you recommend, and how do you frame it?",
    rubric:
      "Product Sense 5 = takes a clear position (kill, pivot, or extend) with a falsifiable reason; 3 = hedges. Analytical Execution 5 = engages with the specific gap (1.4% vs 4%) — what would have to be true for it to close, and whether that's likely; 3 = recommends without showing the math. Strategic Thinking 5 = considers the team (5 engineers' careers, morale of admitting failure) AND the $2M, not just the metrics; 3 = focuses only on numbers. Communication 5 = takes ownership of the original projection without excessive self-flagellation; 3 = either blames external factors or over-apologizes.",
    options: [
      "Recommend killing it; redirect the team and write a post-mortem on the projection error",
      "Recommend a 1-quarter pivot to a different ICP with a clear kill criterion if conversion stays below 2.5%",
      "Recommend continuing — 9 months isn't enough data and you've learned a lot",
      "Recommend handing it to a different PM with fresh eyes for one more quarter",
    ],
  },
  {
    level: 4,
    difficulty: "medium",
    title: "Hire the strong generalist or the domain expert",
    body: "You have one open Senior PM headcount on your team of 4. Two finalists. Candidate A: 8 years at consumer companies, no enterprise experience, references describe them as 'the strongest product thinker I've worked with.' Candidate B: 5 years at direct competitors of yours, knows your customer segment cold, references describe them as 'reliable, ships, not flashy.' Your team is going to spend the next 18 months pushing into enterprise — a segment nobody on the team has worked in before. Aisha (whose team partners with this PM) has a soft preference for B. You have to make an offer this week. Who do you pick and why?",
    rubric:
      "Product Sense 5 = engages with the 18-month enterprise push as the deciding factor — not 'who is better in the abstract'; 3 = compares candidates without anchoring to the strategy. Analytical Execution 5 = identifies what a wrong hire costs (ramp time, team morale, opportunity cost on enterprise) and reasons under that; 3 = picks based on vibes. Strategic Thinking 5 = takes Aisha's preference as data but not as the decision; 3 = either defers to Aisha or ignores her. Communication 5 = can articulate the decision to the rejected finalist without burning the bridge; 3 = treats this only as an internal call.",
    options: [
      "Hire B — domain knowledge compounds faster than general product skill in a new segment",
      "Hire A — strong product thinkers learn segments; segment experts don't always learn product",
      "Hire neither, reopen the search for someone with both",
      "Ask Aisha to break the tie since her team works most closely with this PM",
    ],
  },
  {
    level: 5,
    difficulty: "hard",
    title: "Two PMs want the same scope",
    body: "You manage 6 PMs. Two of them — Jordan and Priya (different Priya, your direct report) — both have credible claims on owning a new payments-platform initiative the company just funded. Jordan has been on payments-adjacent work for 14 months and was promised 'the next big payments thing' at his last review. Priya is stronger but newer, joined 5 months ago, and has been crushing on a smaller workflow surface. Chen wants the kickoff in 3 weeks with a named PM lead. Whichever way you go, the other will likely interview elsewhere within the quarter. Aisha is watching how you handle this. What do you do?",
    rubric:
      "Product Sense 5 = picks the PM who'll execute best on payments, not the one whose feelings are easier to manage; 3 = optimizes for retention over outcome. Analytical Execution 5 = considers concrete restructuring options (split scope into platform vs surface, give Jordan a different big bet on a clear timeline); 3 = treats it as binary. Strategic Thinking 5 = takes the 'one will leave' risk seriously without letting it dictate the call; 3 = either ignores attrition or capitulates to it. Communication 5 = the conversation with the non-chosen PM is direct, names what they did well, and offers a real path; 3 = vague 'next time' framing.",
    options: [
      "Pick Priya for payments; give Jordan a separate, named big bet with a 90-day kickoff",
      "Pick Jordan — the promise was made and the org watches whether managers keep them",
      "Split the initiative: Jordan owns platform, Priya owns the customer-facing surface",
      "Hire externally for the lead role to avoid choosing between them",
    ],
  },
  {
    level: 5,
    difficulty: "hard",
    title: "Public commitment you can't keep",
    body: "At last quarter's all-hands, Chen told the company your group would ship multi-region support by end of Q2. You weren't in the room when the date was set; Sam committed to it on your behalf. It's now week 4 of the quarter. Aisha just walked you through the plan: realistically Q3, possibly early Q4. You have a leadership offsite in 9 days where Chen will ask for an update. Sam is still publicly saying Q2 in customer calls. Telling Chen privately means Sam looks bad; saying nothing means the company keeps making external commitments on a date you know is wrong. What's your move?",
    rubric:
      "Product Sense 5 = recognizes that the cost of letting wrong dates leak externally compounds weekly; 3 = treats this as an internal political problem. Analytical Execution 5 = comes with a re-baselined plan and a confidence interval, not just a slip; 3 = says 'it'll be late' without a new date. Strategic Thinking 5 = handles Sam directly first, before Chen, without making it adversarial; 3 = either goes around Sam or stays silent to protect Sam. Communication 5 = direct conversation with Sam this week, framed as 'I need your help re-baselining'; 3 = email or vague hint.",
    options: [
      "Talk to Sam this week with a re-baselined plan; agree on how to brief Chen at the offsite",
      "Stay silent until the offsite and let Chen ask — answer honestly when asked",
      "Go directly to Chen now; the customer-call commitments are too costly to delay",
      "Push the team hard to hit Q2 anyway — multi-region is mostly done if everyone sprints",
    ],
  },
  {
    level: 6,
    difficulty: "hard",
    title: "Acquire the team or build it",
    body: "Chen forwarded you a deck. A 9-person team at a struggling competitor — 2 PMs, 5 engineers, 2 designers — would join for ~$14M acqui-hire. They'd plug directly into the AI-infrastructure gap you've been trying to hire for. You've been hiring for 8 months and filled 3 of 11 roles. Alternative: keep hiring, accept the slower pace, save the cash. The acquired team's product will be sunset; their tech is mediocre, the people are the asset. Their lead PM is reportedly 'difficult' (two reference calls confirmed). Board meeting is in 11 days and Chen wants your recommendation. What do you tell him?",
    rubric:
      "Product Sense 5 = engages with the 'difficult' PM as a real risk, not a footnote — at this size, one bad senior IC can cost more than the deal value; 3 = waves it off. Analytical Execution 5 = compares $14M / 9 people / time-to-productivity vs the run-rate cost of 8 more months of slow hiring; 3 = stays qualitative. Strategic Thinking 5 = considers integration risk, retention cliffs (typical 1-2 yr lockup), and what happens to your existing team's morale; 3 = treats it as a hiring shortcut. Communication 5 = clear recommendation with the conditions under which you'd reverse it; 3 = lists pros and cons without a call.",
    options: [
      "Recommend the acquisition contingent on the lead PM not joining or joining in an IC role",
      "Recommend the acquisition as-is; the time savings outweigh one difficult hire",
      "Recommend declining; keep hiring and revisit in 6 months if the gap persists",
      "Recommend a smaller deal — try to acqui-hire just the engineers and designers",
    ],
  },
  {
    level: 6,
    difficulty: "hard",
    title: "Partnership with a frenemy",
    body: "Microsoft's product team reached out about a deep integration: your data, their distribution. The TAM expansion is real — their estimate is 4-7x reach in your category over 18 months. The catch: the integration would require exposing parts of your data model that, if Microsoft ever decided to build a competing feature, would make it trivial for them to copy you. Their PM swears this isn't the plan. Their track record on similar partnerships is mixed (you've read three case studies). Chen wants a recommendation before the next board meeting. Rohan wants the deal badly. What do you recommend, and what conditions?",
    rubric:
      "Product Sense 5 = engages with the specific copy-risk surface — what data, how reversible — not generic 'partnership risk'; 3 = treats it as a yes/no on the deal. Analytical Execution 5 = proposes specific contractual or technical guardrails (rate limits, data scope limits, exclusivity windows, kill switches); 3 = relies on trust. Strategic Thinking 5 = thinks about what your company looks like in 24 months under both outcomes (deal works / deal turns adversarial); 3 = optimizes for the next 6 months. Communication 5 = the recommendation acknowledges Rohan's pressure as data without being driven by it; 3 = either defers to Rohan or dismisses him.",
    options: [
      "Pursue the deal with strict data-scope limits and a 24-month exclusivity window",
      "Decline; the copy risk is asymmetric and Microsoft's track record warrants caution",
      "Pursue the deal as proposed; the distribution gain is too large to walk away from",
      "Counter with a smaller-scope pilot for 6 months before any deep integration",
    ],
  },
  {
    level: 7,
    difficulty: "hard",
    title: "Bet the company on AI-native rebuild",
    body: "You're VP Product. Chen and the board are aligned that the next 24 months are existential — three AI-native startups in your category have raised $40M+ each in the last 6 months. Your eng leadership is split: Aisha wants to rebuild the core product as AI-native (18-month bet, dilutes current roadmap, risks customer churn during migration); the CTO wants to bolt AI onto the existing product (faster, less risky, but may not be enough to compete in 24 months). Current ARR is $180M, growing 35% YoY. You have to make the recommendation at next month's board meeting. The recommendation defines the next two years of the company. What do you recommend, and how do you de-risk it?",
    rubric:
      "Product Sense 5 = takes a position on whether AI is a feature or a substrate in your category — that's the actual decision; 3 = treats it as a build-vs-buy question. Analytical Execution 5 = proposes phased gates with kill criteria — what does month-6 look like under each path; 3 = picks a path without checkpoints. Strategic Thinking 5 = engages with $180M ARR as both a moat (customers, distribution) and a constraint (migration risk); 3 = treats the ARR as background. Communication 5 = the board recommendation has one sentence the chair could repeat to an investor; 3 = nuanced but not memorable.",
    options: [
      "Recommend the rebuild; gate it with 6-month checkpoints and a parallel track that keeps the current product on life support",
      "Recommend bolting AI on; revisit a rebuild in 12 months when the AI-native space has shaken out",
      "Recommend a 90-day deep dive with both paths prototyped before committing",
      "Recommend acquiring one of the AI-native startups instead of building either path",
    ],
  },
  {
    level: 7,
    difficulty: "hard",
    title: "Repricing for the enterprise era",
    body: "Your pricing has been seat-based ($25/user/mo) since founding. It worked when buyers were teams. Now 60% of new ARR comes from enterprise deals where seat-based pricing is leaving money on the table — usage data shows your top 20 customers would pay 2-3x more on a usage or value-based model. But repricing risks: existing $130M ARR base, possible churn on renegotiation, sales team's comp plan rewrite, finance's forecasting model. CFO is cautious. Sales VP wants to move now. Chen asked you to lead the recommendation. The window before next year's renewals is 4 months. What do you propose?",
    rubric:
      "Product Sense 5 = engages with what 'value' actually is in your product — the hard part of value-based pricing; 3 = picks usage-based without defining the unit. Analytical Execution 5 = proposes a phased migration (new logos on new pricing first, existing on renewal, grandfather edge cases) with revenue modeling; 3 = recommends 'switch.' Strategic Thinking 5 = takes the CFO's caution as a real signal about forecastability, not just risk-aversion; 3 = dismisses finance. Communication 5 = the proposal is concrete enough that sales, finance, and customer success can each see their next 90 days in it; 3 = stays at the strategy layer.",
    options: [
      "New logos on hybrid (platform fee + usage) starting next quarter; existing customers migrate at renewal with grandfathering",
      "Switch all customers to usage-based at next renewal; absorb the churn risk for the upside",
      "Stay seat-based; introduce enterprise tiers with custom pricing for the top 20 to capture value without disrupting the base",
      "Run a 6-month pilot with 10 willing customers on value-based before committing org-wide",
    ],
  },
  {
    level: 8,
    difficulty: "hard",
    title: "Replace yourself",
    body: "You've been CPO for 4 years. Chen pulled you aside Monday: the board wants succession planning visible by end of next quarter. Three internal candidates: Sam (your VP Product, strongest operator, weak on vision), Maya (now your VP Design, strongest taste, no P&L experience), and an external hire Chen has been quietly courting (ex-CPO of a public company, unknown culture fit). The org's next chapter is platform expansion — you've been pushing this strategy for 18 months and only Sam fully understands the playbook. Whoever you pick will be running the org by next year. Chen wants your recommendation in two weeks. What do you do?",
    rubric:
      "Product Sense 5 = recognizes that 'fit for the next 3 years' is the question, not 'who is best today'; 3 = ranks candidates against current job. Analytical Execution 5 = proposes development paths or trial scopes for the internal candidates that would make the choice clearer in the 2-week window; 3 = picks based on current state. Strategic Thinking 5 = engages honestly with the platform-strategy continuity risk under each candidate; 3 = treats all three as interchangeable on strategy. Communication 5 = the recommendation gives Chen a clear pick AND a defensible alternative path; 3 = ranks all three.",
    options: [
      "Recommend Sam, with a 6-month bridge where you stay involved on vision while he runs operations",
      "Recommend the external hire; fresh leadership for a new chapter and avoids internal politics",
      "Recommend Maya with a finance and platform crash course over the next 6 months",
      "Recommend Chen run a 90-day trial period with Sam and the external candidate sharing scope",
    ],
  },
  {
    level: 8,
    difficulty: "hard",
    title: "Define the org for the next 5 years",
    body: "You're rebuilding the product org from the ground up. Today: 47 PMs across 9 product lines, organized by feature areas. The strategy for the next 5 years is platform + 3 vertical applications on top. Two structural options on the table. Option A: keep feature-area teams, add a thin platform layer (faster, less disruptive, but bakes in the current shape). Option B: reorganize into platform + vertical pods, each with their own engineering and design (slower, ~6 months of org churn, ~15% PM attrition expected, but matches the next 5 years). Chen is leaning B but wants your call. Half your senior PMs prefer A. The reorg announcement, whichever way, lands at the all-hands in 5 weeks. What do you decide?",
    rubric:
      "Product Sense 5 = engages with Conway's law — the org shape determines what gets built — as the actual decision; 3 = treats it as a process question. Analytical Execution 5 = takes the 15% attrition number seriously and identifies who you can't afford to lose, with retention specifics; 3 = treats attrition as an aggregate. Strategic Thinking 5 = picks a structure that matches the 5-year strategy even at near-term cost, OR explicitly argues the strategy is wrong; 3 = picks A to preserve harmony. Communication 5 = has a story for the all-hands that makes the reorg feel like the strategy, not a reshuffle; 3 = announces structure without narrative.",
    options: [
      "Go with B; identify the 8-10 senior PMs you can't lose and lock in retention before the announcement",
      "Go with A; the platform layer can demonstrate value before forcing a full reorg",
      "Hybrid: reorg the platform side now, leave verticals as feature teams for 12 months, then revisit",
      "Delay the all-hands by a quarter to do deeper org design and reduce the 15% attrition risk",
    ],
  },
];

export const runReal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("scenarios").take(500);
    const nonBossTitles = new Set(
      all.filter((s) => !s.isBossScenario).map((s) => s.title),
    );
    let inserted = 0;
    for (const s of REAL_SCENARIOS) {
      if (nonBossTitles.has(s.title)) continue;
      await ctx.db.insert("scenarios", {
        title: s.title,
        body: s.body,
        rubric: s.rubric,
        level: s.level,
        difficulty: s.difficulty,
        isBossScenario: false,
        hidden: false,
        options: [...s.options],
      });
      inserted++;
    }
    return { inserted };
  },
});

export const archivePlaceholders = internalMutation({
  args: {},
  handler: async (ctx) => {
    // The 16 placeholder titles from SCENARIOS above.
    const placeholderTitles = new Set(SCENARIOS.map((s) => s.title));
    const all = await ctx.db.query("scenarios").take(500);
    let archived = 0;
    for (const row of all) {
      if (row.isBossScenario) continue;
      if (row.hidden) continue;
      if (!placeholderTitles.has(row.title)) continue;
      await ctx.db.patch(row._id, { hidden: true, activeDate: undefined });
      archived++;
    }
    return { archived };
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
