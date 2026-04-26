"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// TODO: wire to real reactive queries post-MVP. For now hardcoded per Q7
//   so the seed-feel numbers don't depend on a healthy data state on day one.
const LIVE_PLAYERS = 47;
const LIVE_CPOS = 3;

// TODO: replace with real testers' quotes after Sunday playtest.
const TESTIMONIALS: Array<{ handle: string; quote: string }> = [
  {
    handle: "@maya_pm",
    quote: "It nailed the exact thing my last 1:1 was about.",
  },
  {
    handle: "@_jordan_",
    quote: "Most useful 5 minutes of my morning. The roast hits.",
  },
  {
    handle: "@sl0ane",
    quote: "I argued with the coaching note. Then I rewrote it.",
  },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const preview = useQuery(api.scenarios.getPreview);
  const top = useQuery(api.leaderboard.topByXP);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          ProdSim
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href={isSignedIn ? "/play" : "/sign-in"}>
            {isSignedIn ? "Continue →" : "Sign in"}
          </Link>
        </Button>
      </header>

      <section className="flex flex-col items-center gap-5 pt-4 text-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          ProdSim · Season 1
        </span>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Take 100 PM decisions before your next real one.
        </h1>
        <p className="max-w-md text-balance text-sm leading-6 text-muted-foreground sm:text-base">
          AI-graded career sim. 8 levels. Intern to CPO.
        </p>
        <Button asChild size="lg" className="mt-2 h-12 rounded-full text-base">
          <Link href="/play">Play today&rsquo;s case →</Link>
        </Button>
        <p className="text-xs tabular-nums text-muted-foreground">
          {LIVE_PLAYERS} PMs playing. {LIVE_CPOS} have reached CPO.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Today&rsquo;s Case
        </span>
        <Card className="relative flex flex-col gap-3 overflow-hidden p-5">
          {preview === undefined ? (
            <>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </>
          ) : preview === null ? (
            <p className="text-sm text-muted-foreground">
              No case today. Check back at midnight IST.
            </p>
          ) : (
            <>
              <h3 className="text-lg font-semibold leading-tight">
                {preview.title}
              </h3>
              <p className="select-none text-sm leading-6 text-foreground/80 blur-[2px]">
                {preview.preview}
              </p>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
            </>
          )}
        </Card>
        {!isSignedIn ? (
          <Button asChild variant="outline" className="self-start">
            <Link href="/play">Play this case →</Link>
          </Button>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Top PMs
        </span>
        {top === undefined ? (
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-12 w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one on the board yet — be first.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {top.slice(0, 10).map((row, idx) => (
              <li
                key={row.userId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-3 py-2 text-sm"
              >
                <span className="w-5 text-right tabular-nums text-muted-foreground">
                  {idx + 1}
                </span>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold">
                  {row.handle.charAt(0).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate">
                  {row.displayName ?? row.handle}
                </span>
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  L{row.level}
                </span>
                <span className="font-semibold tabular-nums">
                  {row.xp.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          What players are saying
        </span>
        <div className="grid gap-3 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.handle} className="flex flex-col gap-2 p-4">
              <p className="text-sm leading-6 italic">&ldquo;{t.quote}&rdquo;</p>
              <span className="text-xs text-muted-foreground">{t.handle}</span>
            </Card>
          ))}
        </div>
      </section>

      <footer className="flex flex-col items-center gap-1 pt-4 text-xs text-muted-foreground">
        <p>ProdSim · Season 1</p>
      </footer>
    </main>
  );
}
