"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { ARCHETYPES, buildSystemPrompt, buildUserPrompt } from "./lib/prompts";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 800;
const TEMPERATURE = 0.1;
const TIMEOUT_MS = 10_000;

type Parsed = {
  overallScore: number;
  dimensionScores: {
    productSense: number;
    analyticalExecution: number;
    strategicThinking: number;
    communication: number;
  };
  archetype: (typeof ARCHETYPES)[number];
  roast: string;
  coachingNote: string;
  whatWouldMakeThisA5: string;
};

function parseJudgeResponse(raw: string): Parsed {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Judge response contained no JSON object");
  }
  const obj = JSON.parse(text.slice(first, last + 1));

  const dims = obj.dimensions;
  if (!dims || typeof dims !== "object") {
    throw new Error("Missing dimensions object");
  }
  const dimKeys = [
    "productSense",
    "analyticalExecution",
    "strategicThinking",
    "communication",
  ] as const;
  for (const k of dimKeys) {
    if (typeof dims[k] !== "number" || dims[k] < 1 || dims[k] > 5) {
      throw new Error(`Invalid dimension: ${k} = ${JSON.stringify(dims[k])}`);
    }
  }
  if (
    typeof obj.overallScore !== "number" ||
    obj.overallScore < 0 ||
    obj.overallScore > 100
  ) {
    throw new Error(`Invalid overallScore: ${JSON.stringify(obj.overallScore)}`);
  }
  if (!ARCHETYPES.includes(obj.archetype)) {
    throw new Error(`Unknown archetype: ${JSON.stringify(obj.archetype)}`);
  }
  for (const k of ["roast", "coachingNote", "whatWouldMakeThisA5"] as const) {
    if (typeof obj[k] !== "string" || obj[k].length === 0) {
      throw new Error(`Missing or empty string: ${k}`);
    }
  }

  const roundedDims = {
    productSense: Math.round(dims.productSense),
    analyticalExecution: Math.round(dims.analyticalExecution),
    strategicThinking: Math.round(dims.strategicThinking),
    communication: Math.round(dims.communication),
  };
  const computedOverall =
    (roundedDims.productSense +
      roundedDims.analyticalExecution +
      roundedDims.strategicThinking +
      roundedDims.communication) *
    5;

  return {
    overallScore: computedOverall,
    dimensionScores: roundedDims,
    archetype: obj.archetype,
    roast: obj.roast,
    coachingNote: obj.coachingNote,
    whatWouldMakeThisA5: obj.whatWouldMakeThisA5,
  };
}

export const run = internalAction({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    try {
      const context = await ctx.runQuery(
        internal.judgeInternal.loadContext,
        { attemptId: args.attemptId },
      );
      if (!context) {
        throw new Error("Attempt or scenario missing");
      }

      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        timeout: TIMEOUT_MS,
        maxRetries: 0,
      });

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: buildSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildUserPrompt({
              scenarioTitle: context.scenarioTitle,
              scenarioBody: context.scenarioBody,
              scenarioDifficulty: context.scenarioDifficulty,
              scenarioRubric: context.scenarioRubric,
              userAnswer: context.userAnswer,
              userLevel: context.userLevel,
              mode: context.mode,
              mcqOptions: context.mcqOptions,
              mcqChoice: context.mcqChoice,
            }),
          },
        ],
      });

      const first = response.content[0];
      const rawText = first && first.type === "text" ? first.text : "";
      if (!rawText) {
        throw new Error("Judge response had no text content");
      }

      const parsed = parseJudgeResponse(rawText);

      await ctx.runMutation(internal.judgeInternal.writeScore, {
        attemptId: args.attemptId,
        overallScore: parsed.overallScore,
        dimensionScores: parsed.dimensionScores,
        archetype: parsed.archetype,
        roast: parsed.roast,
        coachingNote: parsed.coachingNote,
        whatWouldMakeThisA5: parsed.whatWouldMakeThisA5,
      });

      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown judge error";
      console.error("judge.run failed", message);
      await ctx.runMutation(internal.judgeInternal.markError, {
        attemptId: args.attemptId,
        errorMessage: message,
      });
      return { ok: false, error: message };
    }
  },
});
