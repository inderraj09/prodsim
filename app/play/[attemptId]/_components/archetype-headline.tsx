const EMOJI: Record<string, string> = {
  "The Discovery Nerd": "🔍",
  "The Ship-It Machine": "🚢",
  "The Roadmap Romantic": "🗺️",
  "The Metrics Assassin": "📊",
  "The Feature Factory Foreman": "🏭",
  "The Zero-to-One Founder": "🌱",
  "The Enterprise Operator": "🏢",
  "The Design-Led PM": "🎨",
};

export function ArchetypeHeadline({ archetype }: { archetype: string }) {
  const emoji = EMOJI[archetype] ?? "🎯";
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        You are
      </span>
      <h1 className="text-balance text-3xl font-semibold leading-tight">
        {archetype} <span className="ml-1">{emoji}</span>
      </h1>
    </div>
  );
}
