"use client";

import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function ShareSheet({
  attemptId,
  archetype,
  overallScore,
  authorHandle,
  open,
  onOpenChange,
}: {
  attemptId: string;
  archetype: string;
  overallScore: number;
  authorHandle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const shareUrl = `${origin}/play/${attemptId}`;
  const isAnonAuthor = authorHandle === "anonymous";
  const challengeUrl = `${origin}/play?ref=${authorHandle}`;
  const downloadUrl = `/api/share-card/${attemptId}`;
  const text = `I scored ${overallScore}/100 as ${archetype} on ProdSim. Take a PM scenario:`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="text-left">
          <SheetTitle>Share your result</SheetTitle>
          <SheetDescription>
            {archetype} · {overallScore}/100
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-3 px-4">
          <Button asChild variant="outline" size="lg" className="h-12">
            <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
              Post to X
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12">
            <a href={linkedInUrl} target="_blank" rel="noopener noreferrer">
              Post to LinkedIn
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12"
            onClick={() => copy(shareUrl, "Link")}
          >
            Copy link
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12">
            <a href={downloadUrl} download={`prodsim-${attemptId}.png`}>
              Download PNG
            </a>
          </Button>
        </div>

        {!isAnonAuthor ? (
          <div className="mx-4 mt-5 flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Challenge a friend
            </span>
            <p className="text-sm leading-6">
              They&rsquo;ll see your card and play the same scenario.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => copy(challengeUrl, "Challenge link")}
            >
              Copy challenge link
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
