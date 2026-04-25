import type { Doc } from "@/convex/_generated/dataModel";
import { LEVEL_THRESHOLDS } from "@/convex/lib/xp";
import { Progress } from "@/components/ui/progress";

export function TopBar({ user }: { user: Doc<"users"> }) {
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
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold">
          {initial}
        </div>
        <span className="truncate text-sm font-medium">{user.handle}</span>
      </div>
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
