const NAME = "prodsim_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getSessionCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )prodsim_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
