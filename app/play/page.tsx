"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function PlayPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
        PM Intern · Level 1
      </p>
      <p className="max-w-xs text-base">
        The real Inbox ships in Step 7.
      </p>
      <SignOutButton>
        <Button variant="outline">Sign out</Button>
      </SignOutButton>
    </main>
  );
}
