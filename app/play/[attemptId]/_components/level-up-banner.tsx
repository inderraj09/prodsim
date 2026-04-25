"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const LEVEL_TITLES: Record<number, string> = {
  1: "Intern",
  2: "PM I",
  3: "PM II",
  4: "Senior PM",
  5: "Staff PM",
  6: "Principal PM",
  7: "Director",
  8: "CPO",
};

export function LevelUpBanner({ newLevel }: { newLevel: number }) {
  const [dismissed, setDismissed] = useState(false);
  const title = LEVEL_TITLES[newLevel] ?? `L${newLevel}`;

  return (
    <AnimatePresence>
      {!dismissed ? (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDismissed(true)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center backdrop-blur-sm"
        >
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
            className="text-7xl"
            aria-hidden
          >
            🫡
          </motion.span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Level up
          </span>
          <h2 className="text-balance text-3xl font-semibold">
            You are now a {title}
          </h2>
          <span className="mt-4 text-xs text-muted-foreground">
            Tap anywhere to continue
          </span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
