"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardList } from "./leaderboard-list";
import { MyRankPill } from "./my-rank-pill";

type TabKey = "week" | "all" | "challengers";

export function LeaderboardClient() {
  const [tab, setTab] = useState<TabKey>("week");
  const me = useQuery(api.users.getMe);
  const week = useQuery(api.leaderboard.topThisWeek);
  const allTime = useQuery(api.leaderboard.topByXP);
  const myRank = useQuery(api.leaderboard.myRank);
  const challengers = useQuery(api.challenges.listMyChallengers);
  const myUserId = me?._id ?? null;

  return (
    <main className="flex flex-1 flex-col gap-5 px-5 pt-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/play">← Back</Link>
        </Button>
        <h1 className="text-base font-semibold">Leaderboard</h1>
        <span className="w-12" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
          <TabsTrigger value="challengers">Challengers</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="mt-4">
          <LeaderboardList rows={week} myUserId={myUserId} unit="this week" />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <LeaderboardList rows={allTime} myUserId={myUserId} unit="all time" />
        </TabsContent>

        <TabsContent value="challengers" className="mt-4">
          <ChallengersTab challengers={challengers} />
        </TabsContent>
      </Tabs>

      {tab !== "challengers" && myRank ? (
        <MyRankPill rank={myRank.rank} capped={myRank.capped} xp={myRank.xp} />
      ) : null}
    </main>
  );
}

type Challenger = {
  userId: string;
  handle: string;
  displayName: string | null;
  level: number;
  currentArchetype: string | null;
  challengedAt: number;
};

function ChallengersTab({
  challengers,
}: {
  challengers: Challenger[] | null | undefined;
}) {
  if (challengers === undefined) {
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i}>
            <Skeleton className="h-14 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    );
  }
  if (challengers === null || challengers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/30 px-6 py-12 text-center">
        <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Locked
        </span>
        <p className="max-w-xs text-base">
          Unlocks when another PM challenges you to a scenario.
        </p>
        <p className="text-xs text-muted-foreground">
          Share your result card to invite challengers.
        </p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {challengers.map((c) => (
        <motion.li
          key={c.userId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-border bg-card/30 px-3 py-2.5"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold">
            {c.handle.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">
              {c.displayName ?? c.handle}
            </span>
            {c.currentArchetype ? (
              <span className="truncate text-[11px] text-muted-foreground">
                {c.currentArchetype}
              </span>
            ) : null}
          </div>
          <div className="ml-auto flex flex-col items-end gap-0.5">
            <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              L{c.level}
            </span>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
