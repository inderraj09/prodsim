"use client";

import { motion } from "motion/react";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";

export function JudgingState({
  attempt,
  scenario,
}: {
  attempt: Doc<"attempts">;
  scenario: {
    title: string;
    body: string;
    difficulty: string;
    isBossScenario: boolean;
  };
}) {
  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-10">
      <motion.div
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm"
      >
        <motion.span
          aria-hidden
          className="size-2 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        The Principal is reading your answer…
      </motion.div>

      <Card className="flex flex-col gap-3 p-5">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {scenario.title}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Your answer
        </span>
        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/55">
          {attempt.answer}
        </p>
      </Card>
    </main>
  );
}
