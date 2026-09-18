import { SESSION_COOKIE, readAuthConfig } from "./config";
import { hmacSha256, timingSafeEqual } from "./crypto";

export type Session = {
  username: string;
  exp: number;
};

type TokenParts = {
  payload: string;
  signature: string;
};

function splitToken(token: string): TokenParts | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const payload = parts[1];
  const signature = parts[2];
  if (!payload || !signature) return null;
  return { payload, signature };
}

function decodePayload(payload: string): Session | null {
  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(payload.replaceAll("-", "+").replaceAll("_", "/")), (c) => c.charCodeAt(0)),
    );
    const parsed = JSON.parse(json) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const username = (parsed as { sub?: unknown }).sub;
    const exp = (parsed as { exp?: unknown }).exp;
    if (typeof username !== "string" || !username) return null;
    if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
    return { username, exp };
  } catch {
    return null;
  }
}

function encodePayload(session: Session): string {
  const json = JSON.stringify({ sub: session.username, exp: session.exp });
  return btoa(json).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function signSession(username: string, days: number, secret: string): Promise<string> {
  const exp = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = encodePayload({ username, exp });
  const signature = await hmacSha256(secret, `v1.${payload}`);
  return `v1.${payload}.${signature}`;
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const config = readAuthConfig();
  if ("missing" in config) return null;
  const parts = splitToken(token);
  if (!parts) return null;
  const expected = await hmacSha256(config.secret, `v1.${parts.payload}`);
  if (!timingSafeEqual(expected, parts.signature)) return null;
  const session = decodePayload(parts.payload);
  if (!session) return null;
  if (session.exp <= Date.now()) return null;
  if (!timingSafeEqual(session.username, config.username)) return null;
  return session;
}

export async function sessionFromCookieHeader(cookieHeader: string | null): Promise<Session | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(/;\s*/).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(SESSION_COOKIE.length + 1);
  return readSession(decodeURIComponent(value));
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const config = readAuthConfig();
  if ("missing" in config) return false;
  const userOk = timingSafeEqual(username, config.username);
  const passDigest = await hmacSha256(config.secret, `password:${password}`);
  const expectedDigest = await hmacSha256(config.secret, `password:${config.password}`);
  const passOk = timingSafeEqual(passDigest, expectedDigest);
  return userOk && passOk;
}
