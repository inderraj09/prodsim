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

export function ScenarioCard({ scenario }: { scenario: Doc<"scenarios"> }) {
  const npc = NPC_BY_LEVEL[scenario.level] ?? { name: "Anonymous", role: "PM" };
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            From: {npc.name}, {npc.role}
          </span>
          <h2 className="text-lg font-semibold leading-tight">
            {scenario.title}
          </h2>
        </div>
        <Badge variant="secondary" className="shrink-0 capitalize">
          {scenario.difficulty}
        </Badge>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {scenario.body}
      </p>
    </Card>
  );
}
