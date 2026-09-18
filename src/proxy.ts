import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/auth/config";
import { readSession } from "@/auth/session";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_OPTIONS,
  resolveDeviceId,
} from "@/generation/device";
import { applySecurityHeaders } from "@/security/headers";

const PUBLIC_EXACT = new Set(["/sign-in", "/api/health", "/api/auth/login", "/robots.txt", "/sitemap.xml"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (pathname.startsWith("/api/media/")) return true;
  if (pathname.startsWith("/model-icons/")) return true;
  return false;
}

function withSecurity(response: NextResponse): NextResponse {
  applySecurityHeaders(response.headers);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/sign-in" && session) {
    return withSecurity(NextResponse.redirect(new URL("/", request.url)));
  }

  if (!isPublic(pathname) && !session) {
    if (pathname.startsWith("/api/")) {
      return withSecurity(NextResponse.json({ error: "Sign in required" }, { status: 401 }));
    }
    const signIn = new URL("/sign-in", request.url);
    if (pathname !== "/") signIn.searchParams.set("next", pathname);
    return withSecurity(NextResponse.redirect(signIn));
  }

  const { deviceId, minted } = resolveDeviceId(request.cookies.get(DEVICE_COOKIE)?.value);
  const response = NextResponse.next();
  if (minted) response.cookies.set(DEVICE_COOKIE, deviceId, DEVICE_COOKIE_OPTIONS);
  return withSecurity(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
