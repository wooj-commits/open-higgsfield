import { NextResponse } from "next/server";

import { authIsConfigured } from "@/auth/config";
import { generationIsReady } from "@/generation/env";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      authConfigured: authIsConfigured(),
      generationConfigured: generationIsReady(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
