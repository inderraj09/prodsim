import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const IST = "Asia/Kolkata";
const HALF_DAY_MS = 12 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function istDayOf(tsMs: number): string {
  return formatInTimeZone(tsMs, IST, "yyyy-MM-dd");
}

export function daysBetweenIST(prevIsoDate: string, curIsoDate: string): number {
  const a = new Date(`${prevIsoDate}T00:00:00Z`).getTime();
  const b = new Date(`${curIsoDate}T00:00:00Z`).getTime();
  return Math.round((b - a) / DAY_MS);
}

function todayMidnightISTInUTC(now: number): number {
  const istDate = formatInTimeZone(now, IST, "yyyy-MM-dd");
  return fromZonedTime(`${istDate} 00:00:00`, IST).getTime();
}

export function currentWindowStart(now: number): number {
  const midnight = todayMidnightISTInUTC(now);
  const noon = midnight + HALF_DAY_MS;
  if (now >= noon) return noon;
  if (now >= midnight) return midnight;
  return midnight - HALF_DAY_MS;
}

export function nextResetAt(now: number): number {
  const midnight = todayMidnightISTInUTC(now);
  const noon = midnight + HALF_DAY_MS;
  if (now < noon) return noon;
  return midnight + 2 * HALF_DAY_MS;
}
