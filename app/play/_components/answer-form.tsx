"use client";

import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MIN_WORDS = 10;
const MAX_WORDS = 500;

type Cap = {
  allowed: boolean;
  playsLeft: number;
  playsPerWindow: number;
  nextResetAt: number;
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

function resetLabelFor(nextResetAt: number): string {
  const istHour = Number(formatInTimeZone(nextResetAt, "Asia/Kolkata", "H"));
  return istHour === 12 ? "12pm IST" : "12am IST";
}

export function AnswerForm({
  onSubmit,
  cap,
  submitting,
}: {
  onSubmit: (answer: string) => void;
  cap: Cap;
  submitting: boolean;
}) {
  const [text, setText] = useState("");
  const words = countWords(text);
  const inRange = words >= MIN_WORDS && words <= MAX_WORDS;
  const tone =
    words === 0
      ? "text-muted-foreground"
      : !inRange
        ? "text-destructive"
        : "text-emerald-400";

  if (!cap.allowed) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-5 text-center text-sm">
        Come back at {resetLabelFor(cap.nextResetAt)} for {cap.playsPerWindow}{" "}
        more 🔥
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (inRange && !submitting) onSubmit(text);
      }}
      className="flex flex-col gap-3"
    >
      <Textarea
        placeholder={`Your answer (${MIN_WORDS}–${MAX_WORDS} words)…`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitting}
        rows={6}
        className="min-h-[140px] resize-none"
      />
      <div className="flex items-center justify-between text-xs tabular-nums">
        <span className={tone}>
          {words} {words === 1 ? "word" : "words"}
        </span>
        {words > 0 && !inRange ? (
          <span className="text-muted-foreground">
            {words < MIN_WORDS
              ? `${MIN_WORDS - words} more`
              : `${words - MAX_WORDS} over`}
          </span>
        ) : null}
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 rounded-full text-base"
        disabled={!inRange || submitting}
      >
        {submitting ? "Submitting…" : "Submit answer →"}
      </Button>
    </form>
  );
}
