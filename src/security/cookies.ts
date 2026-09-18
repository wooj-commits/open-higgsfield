/** Cookie Secure flag: on for HTTPS, off for local HTTP. Never guessed from NODE_ENV alone when PUBLIC_ORIGIN is http. */

export function cookieSecure(): boolean {
  const explicit = process.env.AUTH_COOKIE_SECURE?.trim();
  if (explicit === "0") return false;
  if (explicit === "1") return true;
  const origin = (process.env.PUBLIC_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (origin.startsWith("https://")) return true;
  if (origin.startsWith("http://")) return false;
  return process.env.NODE_ENV === "production";
}
