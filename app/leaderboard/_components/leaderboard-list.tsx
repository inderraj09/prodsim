"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

type Row = {
  userId: Id<"users">;
  handle: string;
  displayName: string | null;
  level: number;
  currentArchetype: string | null;
  xp: number;
};

export function LeaderboardList({
  rows,
  myUserId,
  unit,
}: {
  rows: Row[] | undefined;
  myUserId: Id<"users"> | null;
  unit: "this week" | "all time";
}) {
  if (rows === undefined) {
    return (
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <Skeleton className="h-14 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/30 px-6 py-12 text-center">
        <span className="text-sm text-muted-foreground">
          No one yet — be first.
        </span>
        <span className="text-xs text-muted-foreground">
          Score on a scenario to land on the {unit} board.
        </span>
      </div>
    );
  }

  return (
    <motion.ul layout className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {rows.map((row, idx) => (
          <motion.li
            key={row.userId}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              row.userId === myUserId
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card/30"
            }`}
          >
            <span className="w-7 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">
              {idx + 1}
            </span>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold">
              {row.handle.charAt(0).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                {row.displayName ?? row.handle}
              </span>
              {row.currentArchetype ? (
                <span className="truncate text-[11px] text-muted-foreground">
                  {row.currentArchetype}
                </span>
              ) : null}
            </div>
            <div className="ml-auto flex flex-col items-end gap-0.5">
              <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                L{row.level}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {row.xp.toLocaleString()} XP
              </span>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
