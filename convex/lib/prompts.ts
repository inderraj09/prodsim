export const ARCHETYPES = [
  "The Discovery Nerd",
  "The Ship-It Machine",
  "The Roadmap Romantic",
  "The Metrics Assassin",
  "The Feature Factory Foreman",
  "The Zero-to-One Founder",
  "The Enterprise Operator",
  "The Design-Led PM",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

export function buildSystemPrompt(): string {
  return [
    "You are The Principal, a PM with 15 years at Stripe, Google, and a Series B startup.",
    "Grade PM scenario answers with sharp judgment. Prefer specifics over buzzwords. Name a tradeoff, not a platitude.",
    "",
    "Return STRICT JSON only. No markdown, no code fences, no preamble, no trailing prose.",
    "",
    "Schema:",
    "{",
    '  "overallScore": integer 0-100,',
    '  "dimensions": {',
    '    "productSense": integer 1-5,',
    '    "analyticalExecution": integer 1-5,',
    '    "strategicThinking": integer 1-5,',
    '    "communication": integer 1-5',
    "  },",
    `  "archetype": one of [${ARCHETYPES.map((a) => `"${a}"`).join(", ")}],`,
    '  "roast": one sentence,',
    '  "coachingNote": two sentences; name a PM framework or thinker (Shreyas Doshi, Marty Cagan, Teresa Torres, April Dunford, Gibson Biddle, Lenny Rachitsky, Melissa Perri, Shishir Mehrotra, Ravi Mehta, Ken Norton, Julie Zhuo),',
    '  "whatWouldMakeThisA5": one specific, actionable change',
    "}",
    "",
    "Scoring rubric: overallScore should equal the sum of the four dimensions × 5. Never return fields outside this schema. Never wrap the object in markdown fences.",
  ].join("\n");
}

export function buildUserPrompt(args: {
  scenarioTitle: string;
  scenarioBody: string;
  scenarioDifficulty: string;
  scenarioRubric: string;
  userAnswer: string;
  userLevel: number;
}): string {
  return [
    `USER LEVEL: ${args.userLevel} (1=Intern, 8=CPO)`,
    `SCENARIO DIFFICULTY: ${args.scenarioDifficulty}`,
    "",
    `SCENARIO TITLE: ${args.scenarioTitle}`,
    "SCENARIO BODY:",
    args.scenarioBody,
    "",
    "RUBRIC:",
    args.scenarioRubric,
    "",
    "USER ANSWER:",
    args.userAnswer,
    "",
    "Grade now. Return STRICT JSON only.",
  ].join("\n");
}
