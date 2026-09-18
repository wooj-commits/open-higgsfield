import { requireIdAndSecret } from "./credentials";

export type GenerationEnv = {
  baseUrl: string;
  apiKey: string;
};

export function readGenerationEnv(): GenerationEnv | { missing: string[] } {
  const missing: string[] = [];
  const baseUrl = process.env.HF_API_BASE_URL?.trim() ?? "";
  const apiKey = process.env.HF_API_KEY?.trim() ?? "";
  if (!baseUrl) missing.push("HF_API_BASE_URL");
  if (!apiKey) missing.push("HF_API_KEY");
  if (missing.length) return { missing };
  try {
    requireIdAndSecret(apiKey);
  } catch {
    missing.push("HF_API_KEY");
    return { missing };
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

export function generationIsReady(): boolean {
  return !("missing" in readGenerationEnv());
}

export function blobToken(): string | null {
  const token = process.env.OPEN_HIGGSFIELD_READ_WRITE_TOKEN?.trim();
  return token || null;
}

export function uploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || "/tmp/open-higgsfield-uploads";
}

export function publicOriginFromEnv(): string | null {
  const origin = process.env.PUBLIC_ORIGIN?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return origin ? origin.replace(/\/+$/, "") : null;
}

export function resolvePublicOrigin(request: Request): string {
  const configured = publicOriginFromEnv();
  if (configured) return configured;
  const host = request.headers.get("host");
  if (!host) return "http://127.0.0.1:3000";
  const proto =
    process.env.TRUST_PROXY === "1"
      ? (request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http")
      : process.env.NODE_ENV === "production"
        ? "https"
        : "http";
  return `${proto}://${host}`;
}
