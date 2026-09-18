import { NextResponse } from "next/server";

import { getSession, unauthorizedJson } from "@/auth/guard";

export const dynamic = "force-dynamic";

/** Former client-token blob issuer. Uploads go through the authenticated /api/upload route. */
export async function POST() {
  const session = await getSession();
  if (!session) return unauthorizedJson();
  return NextResponse.json(
    { error: "Use POST /api/upload" },
    { status: 410 },
  );
}
