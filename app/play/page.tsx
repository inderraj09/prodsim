import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PlayClient } from "./_components/play-client";

export default async function PlayPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <PlayClient />;
}
