import type { Id } from "@/convex/_generated/dataModel";
import { AttemptView } from "./_components/attempt-view";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <AttemptView attemptId={attemptId as Id<"attempts">} />;
}
