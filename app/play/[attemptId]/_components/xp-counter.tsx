"use client";

import { useEffect, useState } from "react";

export function XPCounter({ xp }: { xp: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(xp * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [xp]);

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        XP gained
      </span>
      <span className="text-3xl font-semibold tabular-nums">+{display}</span>
    </div>
  );
}
