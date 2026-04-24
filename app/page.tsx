import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            ProdSim — Season 1
          </span>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Take 100 PM decisions before your next real one.
          </h1>
          <p className="text-balance text-sm leading-6 text-muted-foreground">
            AI-graded career sim. 8 levels. Intern to CPO.
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3">
          <Button asChild size="lg" className="h-12 rounded-full text-base">
            <Link href="/sign-in">Play today&rsquo;s case →</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Coming soon. Sign-in wires up in the next step.
          </p>
        </div>
      </div>
    </main>
  );
}
