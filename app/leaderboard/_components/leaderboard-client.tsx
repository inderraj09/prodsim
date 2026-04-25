"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LeaderboardList } from "./leaderboard-list";
import { MyRankPill } from "./my-rank-pill";

type TabKey = "week" | "all" | "challengers";

export function LeaderboardClient() {
  const [tab, setTab] = useState<TabKey>("week");
  const me = useQuery(api.users.getMe);
  const week = useQuery(api.leaderboard.topThisWeek);
  const allTime = useQuery(api.leaderboard.topByXP);
  const myRank = useQuery(api.leaderboard.myRank);
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
          <ChallengersLocked />
        </TabsContent>
      </Tabs>

      {tab !== "challengers" && myRank ? (
        <MyRankPill rank={myRank.rank} capped={myRank.capped} xp={myRank.xp} />
      ) : null}
    </main>
  );
}

function ChallengersLocked() {
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
