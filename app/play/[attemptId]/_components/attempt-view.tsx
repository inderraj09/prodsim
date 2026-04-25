"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { JudgingState } from "./judging-state";
import { ResultScreen } from "./result-screen";
import { PublicAttemptView } from "./public-attempt-view";

export function AttemptView({ attemptId }: { attemptId: Id<"attempts"> }) {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("s");

  const ownerData = useQuery(api.attempts.get, { attemptId });
  const guestData = useQuery(
    api.attempts.getGuest,
    sessionToken ? { attemptId, sessionToken } : "skip",
  );
  const publicData = useQuery(api.attempts.getPublic, { attemptId });
  const me = useQuery(api.users.getMe);

  if (
    ownerData === undefined ||
    publicData === undefined ||
    me === undefined ||
    (sessionToken !== null && guestData === undefined)
  ) {
    return <ViewSkeleton />;
  }

  // Authed owner — signed-in viewer is the attempt's author.
  if (ownerData !== null && me !== null) {
    const { attempt, scenario } = ownerData;
    if (attempt.status === "pending") {
      return <JudgingState attempt={attempt} scenario={scenario} />;
    }
    if (attempt.status === "error") {
      return (
        <ErrorState
          message={
            attempt.errorMessage ??
            "The Principal is on lunch. Try again — this one's free."
          }
        />
      );
    }
    return <ResultScreen attempt={attempt} scenario={scenario} user={me} />;
  }

  // Anon owner — sessionToken in URL matches the attempt's stored token.
  if (guestData) {
    const { attempt, scenario } = guestData;
    if (attempt.status === "pending") {
      return <JudgingState attempt={attempt} scenario={scenario} />;
    }
    if (attempt.status === "error") {
      return (
        <ErrorState
          message={
            attempt.errorMessage ??
            "The Principal is on lunch. Try again — this one's free."
          }
        />
      );
    }
    return (
      <ResultScreen attempt={attempt} scenario={scenario} user={null} />
    );
  }

  // Public viewer — no owner match, but a scored attempt exists.
  if (publicData !== null) {
    return <PublicAttemptView data={publicData} signedIn={me !== null} />;
  }

  return <NotFoundState />;
}

function ViewSkeleton() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-10">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </main>
  );
}

function NotFoundState() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
        Not found
      </span>
      <p className="max-w-xs text-base">
        This attempt either doesn&rsquo;t exist or hasn&rsquo;t been scored
        yet.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
        The Principal is on lunch
      </span>
      <p className="max-w-sm text-base text-muted-foreground">{message}</p>
      <Button asChild>
        <Link href="/play">Try again — this one&rsquo;s free</Link>
      </Button>
    </main>
  );
}
