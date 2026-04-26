"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import type { Doc } from "@/convex/_generated/dataModel";
import { LEVEL_THRESHOLDS } from "@/convex/lib/xp";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar({ user }: { user: Doc<"users"> }) {
  const { signOut } = useClerk();
  const initial = user.handle.charAt(0).toUpperCase();
  const isMaxLevel = user.level >= LEVEL_THRESHOLDS.length;
  const prev = LEVEL_THRESHOLDS[user.level - 1] ?? 0;
  const next = isMaxLevel ? user.totalXP : LEVEL_THRESHOLDS[user.level];
  const span = Math.max(1, next - prev);
  const progress = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, ((user.totalXP - prev) / span) * 100));

  return (
    <div className="flex items-center justify-between gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="-m-1 flex min-w-0 items-center gap-3 rounded-full p-1 transition hover:bg-accent/50 active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold">
              {initial}
            </div>
            <span className="truncate text-sm font-medium">{user.handle}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem asChild>
            <Link href="/welcome">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ redirectUrl: "/" })}
            className="text-destructive focus:text-destructive"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            L{user.level}
          </span>
          <Progress value={progress} className="h-1.5 w-16" />
        </div>
        <span className="flex items-center gap-1 text-sm tabular-nums">
          🔥 {user.streak}
        </span>
      </div>
    </div>
  );
}
