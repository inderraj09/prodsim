"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useQuery } from "convex/react";
import type { Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { levelForTotalXP } from "@/convex/lib/xp";
import { ArchetypeHeadline } from "./archetype-headline";
import { RubricGrid } from "./rubric-grid";
import { XPCounter } from "./xp-counter";
import { LevelUpBanner } from "./level-up-banner";
import { ShareSheet } from "./share-sheet";
import { BossFightBanner } from "./boss-fight-banner";

function formatHoursLeft(retryAvailableAt: number): string {
  const ms = retryAvailableAt - Date.now();
  if (ms <= 0) return "now";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  return `${hours}h`;
}

export function ResultScreen({
  attempt,
  scenario,
  user,
}: {
  attempt: Doc<"attempts">;
  scenario: {
    title: string;
    body: string;
    difficulty: string;
    isBossScenario: boolean;
  };
  user: Doc<"users"> | null;
}) {
  const isAnon = user === null;
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

  const bossForAttempt = useQuery(
    api.bossFights.getForAttempt,
    isAnon ? "skip" : { attemptId: attempt._id },
  );
  const pendingBoss = useQuery(
    api.bossFights.getPending,
    isAnon ? "skip" : {},
  );

  const challengerUserId = attempt.challengeContext?.challengerUserId;
  const challengerLatest = useQuery(
    api.challenges.getChallengerLatest,
    !isAnon && challengerUserId ? { challengerUserId } : "skip",
  );

  const oldTotalXP = user ? user.totalXP - attempt.xpAwarded : 0;
  const oldLevel = levelForTotalXP(oldTotalXP);
  const regularLevelUp =
    !!user &&
    !scenario.isBossScenario &&
    user.level > oldLevel &&
    oldLevel >= 3;
  const bossPassed =
    !!user &&
    scenario.isBossScenario &&
    bossForAttempt?.passed === true;
  const justLeveledUp = regularLevelUp || bossPassed;
  const levelUpToLevel = bossPassed
    ? (bossForAttempt?.toLevel ?? user?.level ?? 1)
    : (user?.level ?? 1);

  const bossFailed =
    !!user &&
    scenario.isBossScenario &&
    bossForAttempt?.passed === false;
  const showBossInvite =
    !isAnon &&
    !scenario.isBossScenario &&
    pendingBoss !== undefined &&
    pendingBoss !== null &&
    !pendingBoss.attempted &&
    !pendingBoss.inCooldown;

  const [shareOpen, setShareOpen] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/play/${attempt._id}`;
    const text = `I scored ${attempt.overallScore}/100 as ${attempt.archetype} on ProdSim`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "ProdSim", text, url });
        return;
      } catch {
        // user dismissed or share unsupported — fall through to custom sheet
      }
    }
    setShareOpen(true);
  }

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
          {user ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Streak
              </span>
              <span className="text-2xl tabular-nums">🔥 {user.streak}</span>
            </div>
          ) : null}
        </motion.div>

        {challengerLatest && attempt.overallScore !== undefined ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-primary/40 bg-primary/5 p-5 flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                Challenge from @{challengerLatest.handle}
              </span>
              <p className="text-sm leading-6">
                You scored{" "}
                <span className="font-semibold tabular-nums">
                  {attempt.overallScore}
                </span>
                . @{challengerLatest.handle} scored{" "}
                <span className="font-semibold tabular-nums">
                  {challengerLatest.overallScore}
                </span>
                .
              </p>
            </div>
            <Button asChild size="sm" variant="secondary" className="self-start">
              <Link href="/play">Rematch →</Link>
            </Button>
          </motion.div>
        ) : null}

        {bossFailed && bossForAttempt?.retryAvailableAt ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-destructive">
                Boss Fight · L{bossForAttempt.fromLevel} → L
                {bossForAttempt.toLevel}
              </span>
              <h3 className="text-base font-semibold">
                Sam wasn&rsquo;t convinced.
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Composite has to be ≥14 with no dimension below 3. Try again
                in {formatHoursLeft(bossForAttempt.retryAvailableAt)}.
              </p>
            </div>
          </motion.div>
        ) : null}

        {showBossInvite && pendingBoss ? (
          <BossFightBanner fromLevel={pendingBoss.fromLevel} />
        ) : null}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 flex flex-col gap-3"
        >
          <Button
            size="lg"
            className="h-12 rounded-full text-base"
            onClick={handleShare}
          >
            Share result →
          </Button>
          {isAnon ? (
            <>
              <Button
                asChild
                variant="default"
                size="lg"
                className="h-12 rounded-full text-base"
              >
                <Link href="/sign-up">
                  Bank these {attempt.xpAwarded} XP →
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 rounded-full text-base"
              >
                <Link href="/sign-up">See your rank on the leaderboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-full text-base"
              >
                <Link href="/play">Play next</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 rounded-full text-base"
              >
                <Link href="/leaderboard">See leaderboard</Link>
              </Button>
            </>
          )}
        </motion.div>
      </main>

      <ShareSheet
        attemptId={attempt._id}
        archetype={attempt.archetype}
        overallScore={attempt.overallScore}
        authorHandle={user?.handle ?? "anonymous"}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {justLeveledUp ? <LevelUpBanner newLevel={levelUpToLevel} /> : null}
    </>
  );
}
