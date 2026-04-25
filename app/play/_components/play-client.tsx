"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { TopBar } from "./top-bar";
import { PlayWindowIndicator } from "./play-window-indicator";
import { ScenarioCard } from "./scenario-card";
import { AnswerForm } from "./answer-form";

export function PlayClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Capture ref handle once on mount; survives URL changes after submit.
  const [referrerHandle] = useState(() => searchParams.get("ref"));
  const me = useQuery(api.users.getMe);
  const scenario = useQuery(api.scenarios.getTodaysScenario);
  const cap = useQuery(api.playWindows.canPlay);
  const submit = useMutation(api.attempts.submit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (me === null) router.replace("/welcome");
  }, [me, router]);

  const loading =
    me === undefined || scenario === undefined || cap === undefined;
  if (loading || me === null || cap === null) {
    return <PlaySkeleton />;
  }

  if (scenario === null) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-10">
        <TopBar user={me} />
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
      const attemptId = await submit({
        scenarioId: scenario._id,
        answer,
        ...(referrerHandle ? { referrerHandle } : {}),
      });
      router.push(`/play/${attemptId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't submit.";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-10">
      <TopBar user={me} />
      <PlayWindowIndicator cap={cap} />
      <ScenarioCard scenario={scenario} />
      <AnswerForm
        onSubmit={handleSubmit}
        cap={cap}
        submitting={submitting}
      />
    </main>
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
