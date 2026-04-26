import type { Doc } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NPC_BY_LEVEL: Record<number, { name: string; role: string }> = {
  1: { name: "Priya", role: "Eng Manager" },
  2: { name: "Marcus", role: "Senior PM" },
  3: { name: "Aisha", role: "Director, Product" },
  4: { name: "Jordan", role: "VP Engineering" },
  5: { name: "Lena", role: "Head of Strategy" },
  6: { name: "Sam", role: "VP Product" },
  7: { name: "Devika", role: "CPO" },
  8: { name: "Theo", role: "Board Member" },
};

export function ScenarioCard({
  scenario,
}: {
  scenario: Doc<"scenarios"> & { isReplay?: boolean };
}) {
  const isBoss = scenario.isBossScenario;
  const isReplay = scenario.isReplay === true;
  const npc = isBoss
    ? { name: "Sam", role: "skip-level VP" }
    : NPC_BY_LEVEL[scenario.level] ?? { name: "Anonymous", role: "PM" };

  return (
    <Card
      className={`flex flex-col gap-4 p-5 ${
        isBoss
          ? "border-destructive/50 bg-gradient-to-br from-destructive/10 via-destructive/5 to-card"
          : ""
      }`}
    >
      {isBoss ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-destructive">
          Boss Fight · L{scenario.level} → L{scenario.level + 1}
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            From: {npc.name}, {npc.role}
          </span>
          <h2 className="text-lg font-semibold leading-tight">
            {scenario.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isReplay && !isBoss ? (
            <Badge
              variant="outline"
              className="border-border/60 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              Replay
            </Badge>
          ) : null}
          <Badge
            variant={isBoss ? "destructive" : "secondary"}
            className="capitalize"
          >
            {scenario.difficulty}
          </Badge>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {scenario.body}
      </p>
      {isBoss ? (
        <p className="text-xs leading-6 text-destructive/90">
          Pass criteria: composite ≥14 / 20, no dimension below 3.
        </p>
      ) : null}
      {isReplay && !isBoss ? (
        <p className="text-xs leading-6 text-muted-foreground">
          You&rsquo;ve played this one. Submitting again will be graded fresh.
        </p>
      ) : null}
    </Card>
  );
}
