type DimensionKey =
  | "productSense"
  | "analyticalExecution"
  | "strategicThinking"
  | "communication";

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  productSense: "Product Sense",
  analyticalExecution: "Analytical Execution",
  strategicThinking: "Strategic Thinking",
  communication: "Communication",
};

export function RubricGrid({
  scores,
}: {
  scores: Record<DimensionKey, number>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((key) => {
        const score = scores[key];
        return (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm">{DIMENSION_LABELS[key]}</span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`size-3 rounded-sm ${
                      i < score ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="w-7 text-right text-sm tabular-nums text-muted-foreground">
                {score}/5
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
