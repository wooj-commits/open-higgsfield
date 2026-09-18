/** Same-origin POST check. Rejects cross-site form posts. */

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const allowed = new Set<string>();
    const host = request.headers.get("host");
    if (host) allowed.add(host);
    const publicOrigin = process.env.PUBLIC_ORIGIN?.trim();
    if (publicOrigin) allowed.add(new URL(publicOrigin).host);
    return allowed.has(url.host);
  } catch {
    return false;
  }
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  if (value.includes("://")) return "/";
  return value;
}

export function clientAddress(request: Request): string {
  if (process.env.TRUST_PROXY === "1") {
    const forwarded = request.headers.get("x-forwarded-for");
    const first = forwarded?.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "local";
}
