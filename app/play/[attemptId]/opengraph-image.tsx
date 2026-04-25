import { ImageResponse } from "next/og";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
  ["productSense", "Product"],
  ["analyticalExecution", "Analytical"],
  ["strategicThinking", "Strategy"],
  ["communication", "Comms"],
];

function FallbackCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #6b21a8 0%, #06b6d4 50%, #ec4899 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        ProdSim
      </div>
    ),
    { ...size },
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return FallbackCard();

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
    return FallbackCard();
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
            "linear-gradient(135deg, #6b21a8 0%, #06b6d4 50%, #ec4899 100%)",
          padding: 56,
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            opacity: 0.75,
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
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            {attempt.archetype} {emoji}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 500,
              opacity: 0.92,
            }}
          >
            @{author.handle} · {title} · {attempt.overallScore}/100
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontStyle: "italic",
              opacity: 0.85,
              marginTop: 8,
              maxWidth: 980,
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
          }}
        >
          <div style={{ display: "flex", gap: 24 }}>
            {DIMENSION_LABELS.map(([key, label]) => {
              const score = dims[key as keyof typeof dims] ?? 0;
              return (
                <div
                  key={key}
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      opacity: 0.75,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
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
              fontSize: 22,
              opacity: 0.85,
              fontWeight: 500,
            }}
          >
            prodsim.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
