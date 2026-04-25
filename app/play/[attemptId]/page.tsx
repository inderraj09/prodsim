import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { AttemptView } from "./_components/attempt-view";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { attemptId } = await params;
  return <AttemptView attemptId={attemptId as Id<"attempts">} />;
}
