import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "./config";
import { readSession, type Session } from "./session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Sign in required");
    this.name = "UnauthorizedError";
  }
}

export async function requireSession(): Promise<Session> {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export function unauthorizedJson(): NextResponse {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}
