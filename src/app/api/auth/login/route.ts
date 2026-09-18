import { NextResponse } from "next/server";

import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, readAuthConfig } from "@/auth/config";
import { clientAddress, isSameOrigin, safeNextPath } from "@/auth/origin";
import { resetAttempts, tooManyAttempts } from "@/auth/rate-limit";
import { signSession, verifyPassword } from "@/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const config = readAuthConfig();
  if ("missing" in config) {
    return NextResponse.json(
      {
        error: `Studio auth is not configured. Set ${config.missing.join(", ")} in the environment.`,
      },
      { status: 503 },
    );
  }

  const ip = clientAddress(request);
  if (tooManyAttempts(`login:${ip}`)) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body !== null && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const username = typeof record.username === "string" ? record.username : "";
  const password = typeof record.password === "string" ? record.password : "";
  if (!username || !password || password.length > 200 || username.length > 80) {
    return NextResponse.json({ error: "Enter a username and password" }, { status: 400 });
  }

  const ok = await verifyPassword(username, password);
  if (!ok) {
    return NextResponse.json({ error: "Those credentials do not match" }, { status: 401 });
  }

  resetAttempts(`login:${ip}`);
  const token = await signSession(config.username, config.sessionDays, config.secret);
  const response = NextResponse.json({ ok: true, next: safeNextPath(typeof record.next === "string" ? record.next : "/") });
  response.cookies.set(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: config.sessionDays * 24 * 60 * 60,
  });
  return response;
}
