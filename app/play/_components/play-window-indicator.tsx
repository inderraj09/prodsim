"use client";

import { useEffect, useState } from "react";

type Cap = {
  allowed: boolean;
  playsUsed: number;
  playsLeft: number;
  playsPerWindow: number;
  windowStart: number;
  nextResetAt: number;
};

function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function PlayWindowIndicator({ cap }: { cap: Cap }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dots = Array.from(
    { length: cap.playsPerWindow },
    (_, i) => i < cap.playsLeft,
  );
  const countdown = formatRemaining(cap.nextResetAt - now);

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Plays left</span>
        <span
          aria-label={`${cap.playsLeft} of ${cap.playsPerWindow} plays remaining`}
          className="text-base leading-none tracking-[0.25em]"
        >
          {dots.map((filled, i) => (
            <span key={i}>{filled ? "●" : "○"}</span>
          ))}
        </span>
      </div>
      <span className="text-muted-foreground tabular-nums">
        Next reset in {countdown}
      </span>
    </div>
  );
}
