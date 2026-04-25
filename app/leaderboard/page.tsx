import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LeaderboardClient } from "./_components/leaderboard-client";

export default async function LeaderboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <LeaderboardClient />;
}
