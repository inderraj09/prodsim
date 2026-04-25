"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArchetypeHeadline } from "./archetype-headline";
import { RubricGrid } from "./rubric-grid";

const LEVEL_TITLES: Record<number, string> = {
  1: "PM Intern",
  2: "PM I",
  3: "PM II",
  4: "Senior PM",
  5: "Staff PM",
  6: "Principal PM",
  7: "Director",
  8: "CPO",
};

type PublicData = {
  attempt: {
    overallScore?: number;
    dimensionScores?: {
      productSense: number;
      analyticalExecution: number;
      strategicThinking: number;
      communication: number;
    };
    archetype?: string;
    roast?: string;
    coachingNote?: string;
    whatWouldMakeThisA5?: string;
  };
  scenario: { title: string; body: string; difficulty: string };
  author: {
    handle: string;
    displayName: string | null;
    level: number;
  } | null;
};

export function PublicAttemptView({
  data,
  signedIn,
}: {
  data: PublicData;
  signedIn: boolean;
}) {
  const { attempt, scenario, author } = data;
  if (
    attempt.overallScore === undefined ||
    attempt.dimensionScores === undefined ||
    attempt.archetype === undefined ||
    attempt.roast === undefined
  ) {
    return null;
  }

  const challengeHref = author
    ? signedIn
      ? `/play?ref=${encodeURIComponent(author.handle)}`
      : `/sign-in?ref=${encodeURIComponent(author.handle)}`
    : "/sign-in";
  const title = author
    ? (LEVEL_TITLES[author.level] ?? `L${author.level}`)
    : "PM Intern";
  const display = author
    ? (author.displayName ?? `@${author.handle}`)
    : "Anonymous PM";
  const ctaLabel = author
    ? `Challenge @${author.handle} →`
    : "Take this kind of scenario →";

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-10">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col gap-1"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {display} · {title}
        </span>
        <ArchetypeHeadline archetype={attempt.archetype} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        <Card className="flex flex-col gap-2 p-5">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Scenario
          </span>
          <h3 className="text-base font-semibold">{scenario.title}</h3>
          <Badge variant="secondary" className="self-start capitalize">
            {scenario.difficulty}
          </Badge>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      >
        <Card className="flex flex-col gap-2 p-5">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tabular-nums">
              {attempt.overallScore}
            </span>
            <span className="text-base text-muted-foreground">/ 100</span>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="flex flex-col gap-4 p-5">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Rubric
          </span>
          <RubricGrid scores={attempt.dimensionScores} />
        </Card>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-base italic leading-7 text-foreground/90"
      >
        &ldquo;{attempt.roast}&rdquo;
      </motion.p>

      {attempt.coachingNote ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="flex flex-col gap-3 p-5">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Coaching note
            </span>
            <p className="text-sm leading-6">{attempt.coachingNote}</p>
            {attempt.whatWouldMakeThisA5 ? (
              <>
                <div className="my-1 h-px bg-border" />
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  What would make this a 5
                </span>
                <p className="text-sm leading-6">
                  {attempt.whatWouldMakeThisA5}
                </p>
              </>
            ) : null}
          </Card>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-2 flex flex-col gap-3"
      >
        <Button asChild size="lg" className="h-12 rounded-full text-base">
          <Link href={challengeHref}>{ctaLabel}</Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Take the same kind of scenario. AI grades you against the same
          rubric.
        </p>
      </motion.div>
    </main>
  );
}
