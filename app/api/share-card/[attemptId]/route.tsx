import { ImageResponse } from "next/og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const SIZE = { width: 1080, height: 1350 } as const;

const ARCHETYPE_EMOJI: Record<string, string> = {
  "The Discovery Nerd": "🔍",
  "The Ship-It Machine": "🚢",
  "The Roadmap Romantic": "🗺️",
  "The Metrics Assassin": "📊",
  "The Feature Factory Foreman": "🏭",
  "The Zero-to-One Founder": "🌱",
  "The Enterprise Operator": "🏢",
  "The Design-Led PM": "🎨",
};

const LEVEL_TITLES: Record<number, string> = {
  1: "PM Intern",
  2: "PM I",
  3: "PM II",
  4: "Senior PM",
  5: "Staff PM",
  6: "Principal PM",
  7: "Director",
  8: "CPO",
};

const DIMENSION_LABELS: Array<[string, string]> = [
  ["productSense", "Product Sense"],
  ["analyticalExecution", "Analytical Execution"],
  ["strategicThinking", "Strategic Thinking"],
  ["communication", "Communication"],
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return new Response("Misconfigured", { status: 500 });

  const client = new ConvexHttpClient(url);
  const data = await client.query(api.attempts.getPublic, {
    attemptId: attemptId as Id<"attempts">,
  });

  if (
    !data ||
    !data.attempt.archetype ||
    data.attempt.overallScore === undefined ||
    !data.attempt.dimensionScores ||
    !data.attempt.roast
  ) {
    return new Response("Not found", { status: 404 });
  }

  const { attempt, author } = data;
  const emoji = ARCHETYPE_EMOJI[attempt.archetype!] ?? "🎯";
  const title = LEVEL_TITLES[author.level] ?? `L${author.level}`;
  const dims = attempt.dimensionScores!;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(160deg, #6b21a8 0%, #06b6d4 55%, #ec4899 100%)",
          padding: 72,
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            opacity: 0.8,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          ProdSim — Season 1
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 102,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: -2,
            }}
          >
            {attempt.archetype} {emoji}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 500,
              opacity: 0.92,
            }}
          >
            @{author.handle} · {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 156,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            {attempt.overallScore}
            <span
              style={{
                fontSize: 64,
                fontWeight: 500,
                opacity: 0.65,
                marginLeft: 14,
                alignSelf: "flex-end",
                marginBottom: 18,
              }}
            >
              / 100
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {DIMENSION_LABELS.map(([key, label]) => {
              const score = dims[key as keyof typeof dims] ?? 0;
              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 500, opacity: 0.92 }}>
                    {label}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background:
                            i <= score
                              ? "white"
                              : "rgba(255,255,255,0.25)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontStyle: "italic",
              opacity: 0.9,
              marginTop: 16,
              lineHeight: 1.4,
            }}
          >
            &ldquo;{attempt.roast}&rdquo;
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          <span>Take the case at prodsim.com</span>
          <span>@{author.handle}</span>
        </div>
      </div>
    ),
    SIZE,
  );
}
