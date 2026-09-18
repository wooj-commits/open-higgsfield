import { NextResponse } from "next/server";

import { getSession } from "@/auth/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return NextResponse.json({ username: session.username });
}
