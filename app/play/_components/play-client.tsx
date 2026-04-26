"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  getSessionCookie,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/session-cookie";
import { TopBar } from "./top-bar";
import { PlayWindowIndicator } from "./play-window-indicator";
import { ScenarioCard } from "./scenario-card";
import { AnswerForm } from "./answer-form";

const GUEST_CAP = {
  allowed: true,
  playsLeft: 1,
  playsUsed: 0,
  playsPerWindow: 1,
  windowStart: 0,
  nextResetAt: Date.now() + 24 * 60 * 60 * 1000,
};

export function PlayClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referrerHandle] = useState(() => searchParams.get("ref"));
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const [cookieToken] = useState<string | null>(() => getSessionCookie());

  const me = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const scenario = useQuery(api.scenarios.getTodaysScenario);
  const cap = useQuery(api.playWindows.canPlay, isSignedIn ? {} : "skip");
  const guestPlayed = useQuery(
    api.attempts.guestHasPlayed,
    !isSignedIn && cookieToken ? { sessionToken: cookieToken } : "skip",
  );

  const submit = useMutation(api.attempts.submit);
  const submitGuest = useMutation(api.attempts.submitGuest);
  const claimGuest = useMutation(api.attempts.claimGuestAttempt);
  const syncFromIdentity = useMutation(api.users.syncFromIdentity);
  const [submitting, setSubmitting] = useState(false);

  // Signed-in but Convex user row missing (post-Clerk-signup, pre-onboarding).
  useEffect(() => {
    if (clerkLoaded && isSignedIn && me === null) {
      router.replace("/welcome");
    }
  }, [clerkLoaded, isSignedIn, me, router]);

  // Email backfill (Step 12 fix) — only meaningful when signed in.
  useEffect(() => {
    if (me && (!me.email || me.email.length === 0)) {
      syncFromIdentity().catch(() => {});
    }
  }, [me, syncFromIdentity]);

  // Stale-cookie claim: signed-in user landing on /play with a leftover
  // anon cookie reassigns any orphan attempt to their account. Clear the
  // cookie immediately so the effect doesn't re-fire on subsequent renders.
  useEffect(() => {
    if (!isSignedIn || !me) return;
    const stale = getSessionCookie();
    if (!stale) return;
    clearSessionCookie();
    claimGuest({ sessionToken: stale })
      .then((result) => {
        if (result.claimed > 0) {
          toast.success("Saved your earlier result ✓");
        }
      })
      .catch(() => {});
  }, [isSignedIn, me, claimGuest]);

  if (!clerkLoaded) return <PlaySkeleton />;

  // Loading branches per auth state.
  if (isSignedIn) {
    if (me === undefined || scenario === undefined || cap === undefined) {
      return <PlaySkeleton />;
    }
    if (me === null || cap === null) {
      // useEffect above handles redirect to /welcome.
      return <PlaySkeleton />;
    }
  } else {
    if (scenario === undefined) return <PlaySkeleton />;
    // Returning guest: cookie present, soft-gate while we check.
    if (cookieToken && guestPlayed === undefined) return <PlaySkeleton />;
    if (cookieToken && guestPlayed === true) {
      return <GuestAlreadyPlayed />;
    }
  }

  if (scenario === null) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-10">
        {isSignedIn && me ? <TopBar user={me} /> : <GuestHeader />}
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <span className="text-sm text-muted-foreground">
            No scenario today.
          </span>
          <span className="text-base">
            Come back tomorrow — fresh case at midnight IST.
          </span>
        </div>
      </main>
    );
  }

  const handleSubmit = async (answer: string) => {
    setSubmitting(true);
    try {
      if (isSignedIn) {
        const attemptId = await submit({
          scenarioId: scenario._id,
          answer,
          ...(referrerHandle ? { referrerHandle } : {}),
        });
        router.push(`/play/${attemptId}`);
      } else {
        const existingToken = getSessionCookie();
        const result = await submitGuest({
          scenarioId: scenario._id,
          answer,
          ...(existingToken ? { sessionToken: existingToken } : {}),
        });
        setSessionCookie(result.sessionToken);
        router.push(
          `/play/${result.attemptId}?s=${encodeURIComponent(result.sessionToken)}`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't submit.";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-10">
      {isSignedIn && me ? <TopBar user={me} /> : <GuestHeader />}
      {isSignedIn && cap ? <PlayWindowIndicator cap={cap} /> : null}
      <ScenarioCard scenario={scenario} />
      <AnswerForm
        onSubmit={handleSubmit}
        cap={isSignedIn && cap ? cap : GUEST_CAP}
        submitting={submitting}
      />
      {!isSignedIn ? (
        <p className="text-center text-xs text-muted-foreground">
          Playing as guest. One free play, no signup.{" "}
          <Link href="/sign-in" className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          to save your streak.
        </p>
      ) : null}
    </main>
  );
}

function GuestAlreadyPlayed() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-10">
      <GuestHeader />
      <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          You&rsquo;ve used your free play
        </span>
        <p className="max-w-xs text-base leading-6">
          Sign up to bank your XP, see your rank, and play more scenarios.
        </p>
        <Button asChild size="lg" className="h-12 rounded-full">
          <Link href="/sign-in">Sign up to play more →</Link>
        </Button>
      </div>
    </main>
  );
}

function GuestHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        ProdSim
      </Link>
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Playing as guest
      </span>
    </div>
  );
}

function PlaySkeleton() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </main>
  );
}
