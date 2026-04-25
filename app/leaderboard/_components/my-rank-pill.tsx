"use client";

import { motion } from "motion/react";

export function MyRankPill({
  rank,
  capped,
  xp,
}: {
  rank: number;
  capped: boolean;
  xp: number;
}) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-5 bottom-5 flex items-center justify-between gap-3 rounded-full border border-border bg-card/95 px-4 py-3 text-sm shadow-lg backdrop-blur"
    >
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Your rank
      </span>
      <span className="font-semibold tabular-nums">
        #{capped ? `${rank}+` : rank}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {xp.toLocaleString()} XP
      </span>
    </motion.div>
  );
}
