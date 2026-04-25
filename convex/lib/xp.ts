export type Difficulty = "easy" | "medium" | "hard" | "boss";

const BASE_XP: Record<Difficulty, number> = {
  easy: 100,
  medium: 200,
  hard: 400,
  boss: 800,
};

export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 300, 800, 1800, 3600, 6500, 11000, 18000,
] as const;

export function baseXPFor(difficulty: Difficulty): number {
  return BASE_XP[difficulty];
}

export function streakMultiplierFor(streak: number): number {
  if (streak >= 30) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

export function computeXPAward(args: {
  overallScore: number;
  difficulty: Difficulty;
  streak: number;
}): number {
  const base = baseXPFor(args.difficulty);
  const clamped = Math.max(0, Math.min(100, args.overallScore));
  const mult = streakMultiplierFor(args.streak);
  return Math.round(base * (clamped / 100) * mult);
}

export function levelForTotalXP(totalXP: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}
