"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

function WelcomeSkeleton() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </main>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomeSkeleton />}>
      <WelcomeForm />
    </Suspense>
  );
}

function WelcomeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const playTarget = ref ? `/play?ref=${encodeURIComponent(ref)}` : "/play";
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const me = useQuery(api.users.getMe, isSignedIn ? {} : "skip");
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [handle, setHandle] = useState("");
  const [debounced, setDebounced] = useState("");
  const [showRealName, setShowRealName] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (clerkLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [clerkLoaded, isSignedIn, router]);

  useEffect(() => {
    if (me) {
      router.replace(playTarget);
    }
  }, [me, router, playTarget]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(handle.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [handle]);

  const normalized = useMemo(() => handle.trim().toLowerCase(), [handle]);
  const regexOk = HANDLE_REGEX.test(normalized);

  const availability = useQuery(
    api.users.isHandleAvailable,
    regexOk && debounced === normalized ? { handle: normalized } : "skip",
  );

  const ready = clerkLoaded && isSignedIn && me === null;

  if (!ready) {
    return <WelcomeSkeleton />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regexOk) {
      toast.error("Handle must be 3–20 chars — lowercase, numbers, or _");
      return;
    }
    if (availability === false) {
      toast.error("That handle is taken");
      return;
    }
    setSubmitting(true);
    try {
      await completeOnboarding({ handle: normalized, showRealName });
      router.replace(playTarget);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something broke";
      toast.error(message);
      setSubmitting(false);
    }
  };

  const statusLine = (() => {
    if (!handle) return "3–20 chars. lowercase, numbers, or _";
    if (!regexOk) return "Must be 3–20 chars: lowercase, numbers, or _";
    if (availability === undefined) return "Checking…";
    if (availability === false) return "Taken";
    return "Available";
  })();

  const statusTone =
    !handle || !regexOk || availability === undefined
      ? "text-muted-foreground"
      : availability
        ? "text-emerald-400"
        : "text-destructive";

  const canSubmit = regexOk && availability === true && !submitting;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Step 1 of 1
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome. Pick your handle.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            You start as a PM Intern at Loomly, a B2C app with 2M users. Every
            scenario is a real situation. Answer honestly — the AI rewards
            judgment, not buzzwords.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="handle">Handle</Label>
          <Input
            id="handle"
            name="handle"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="e.g. marty_c"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="h-11"
            disabled={submitting}
          />
          <span className={`text-xs ${statusTone}`}>{statusLine}</span>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <Checkbox
            checked={showRealName}
            onCheckedChange={(v) => setShowRealName(v === true)}
            disabled={submitting}
            className="mt-0.5"
          />
          <span className="leading-5">
            Show my real name on my public profile.
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="h-12 rounded-full text-base"
          disabled={!canSubmit}
        >
          {submitting ? "Starting…" : "Start as Intern →"}
        </Button>
      </form>
    </main>
  );
}
