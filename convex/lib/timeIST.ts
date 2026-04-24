import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const IST = "Asia/Kolkata";
const HALF_DAY_MS = 12 * 60 * 60 * 1000;

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
