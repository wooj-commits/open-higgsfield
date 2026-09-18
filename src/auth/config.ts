const MIN_SECRET = 32;
const MIN_PASSWORD = 12;

export const SESSION_COOKIE = "ohf_session";
export const SESSION_DAYS_DEFAULT = 7;

export type AuthConfig = {
  secret: string;
  username: string;
  password: string;
  sessionDays: number;
};

export function readAuthConfig(): AuthConfig | { missing: string[] } {
  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  const username = process.env.AUTH_USERNAME?.trim() ?? "";
  const password = process.env.AUTH_PASSWORD ?? "";
  const rawDays = process.env.AUTH_SESSION_DAYS?.trim();
  const sessionDays = rawDays ? Number(rawDays) : SESSION_DAYS_DEFAULT;

  const missing: string[] = [];
  if (!secret || secret.length < MIN_SECRET) missing.push("AUTH_SECRET");
  if (!username) missing.push("AUTH_USERNAME");
  if (!password || password.length < MIN_PASSWORD) missing.push("AUTH_PASSWORD");
  if (!Number.isFinite(sessionDays) || sessionDays < 1 || sessionDays > 90) {
    missing.push("AUTH_SESSION_DAYS");
  }

  if (missing.length) return { missing };

  return { secret, username, password, sessionDays };
}

export function authIsConfigured(): boolean {
  return !("missing" in readAuthConfig());
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
