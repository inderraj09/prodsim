"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export function BossFightBanner({ fromLevel }: { fromLevel: number }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.5, type: "spring", stiffness: 180 }}
      className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-gradient-to-br from-destructive/15 via-destructive/5 to-background p-5"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-destructive">
          Boss Fight · L{fromLevel} → L{fromLevel + 1}
        </span>
        <h2 className="text-lg font-semibold leading-tight">
          Sam wants to see you prove yourself.
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Your skip-level VP. Composite ≥14, no dimension below 3. Fail and
          it&rsquo;s 24 hours before you can retry.
        </p>
      </div>
      {armed ? (
        <Button
          asChild
          variant="destructive"
          className="h-11 rounded-full"
        >
          <Link href="/play">Accept the fight →</Link>
        </Button>
      ) : (
        <Button
          variant="destructive"
          className="h-11 rounded-full opacity-70"
          disabled
        >
          Read carefully…
        </Button>
      )}
    </motion.div>
  );
}
