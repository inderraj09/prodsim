import { Suspense } from "react";
import { PlayClient } from "./_components/play-client";

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <PlayClient />
    </Suspense>
  );
}
