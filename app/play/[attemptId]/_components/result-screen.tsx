"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { levelForTotalXP } from "@/convex/lib/xp";
import { ArchetypeHeadline } from "./archetype-headline";
import { RubricGrid } from "./rubric-grid";
import { XPCounter } from "./xp-counter";
import { LevelUpBanner } from "./level-up-banner";

export function ResultScreen({
  attempt,
  scenario,
  user,
}: {
  attempt: Doc<"attempts">;
  scenario: { title: string; body: string; difficulty: string };
  user: Doc<"users">;
}) {
  if (
    attempt.overallScore === undefined ||
    attempt.dimensionScores === undefined ||
    attempt.archetype === undefined ||
    attempt.roast === undefined ||
    attempt.coachingNote === undefined ||
    attempt.whatWouldMakeThisA5 === undefined ||
    attempt.xpAwarded === undefined
  ) {
    return null;
  }

  const oldTotalXP = user.totalXP - attempt.xpAwarded;
  const oldLevel = levelForTotalXP(oldTotalXP);
  const justLeveledUp = user.level > oldLevel && oldLevel >= 3;

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-10">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <ArchetypeHeadline archetype={attempt.archetype} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
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
              <Badge variant="secondary" className="ml-auto capitalize">
                {scenario.difficulty}
              </Badge>
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
            <div className="my-1 h-px bg-border" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              What would make this a 5
            </span>
            <p className="text-sm leading-6">{attempt.whatWouldMakeThisA5}</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-end justify-between gap-4"
        >
          <XPCounter xp={attempt.xpAwarded} />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Streak
            </span>
            <span className="text-2xl tabular-nums">🔥 {user.streak}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 flex flex-col gap-3"
        >
          <Button asChild size="lg" className="h-12 rounded-full text-base">
            <Link href="/play">Play next →</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full text-base"
          >
            <Link href="/leaderboard">See leaderboard</Link>
          </Button>
        </motion.div>
      </main>

      {justLeveledUp ? <LevelUpBanner newLevel={user.level} /> : null}
    </>
  );
}
