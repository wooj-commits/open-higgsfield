import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSession, unauthorizedJson } from "@/auth/guard";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_OPTIONS,
  blobPathname,
  mintDeviceId,
  resolveDeviceId,
} from "@/generation/device";
import { blobToken, resolvePublicOrigin, uploadDir } from "@/generation/env";

export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "audio/wav",
  "audio/x-wav",
]);

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorizedJson();
  return NextResponse.json({
    mode: blobToken() ? "blob" : "local",
    maxBytes: MAX_BYTES,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorizedJson();

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 25 MB" }, { status: 413 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "That file type is not allowed" }, { status: 415 });
  }

  const jar = await cookies();
  const device = resolveDeviceId(jar.get(DEVICE_COOKIE)?.value);
  const pathname = blobPathname(device.deviceId, file.name);
  const token = blobToken();

  let url: string;
  if (token) {
    const blob = await put(pathname, file, { access: "public", token, addRandomSuffix: true });
    url = blob.url;
  } else {
    const id = mintDeviceId();
    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    const stored = `${id}-${safeName(file.name)}`;
    await writeFile(join(dir, stored), Buffer.from(await file.arrayBuffer()));
    url = `${resolvePublicOrigin(request)}/api/media/${encodeURIComponent(stored)}`;
  }

  const response = NextResponse.json({ url });
  if (device.minted) {
    response.cookies.set(DEVICE_COOKIE, device.deviceId, DEVICE_COOKIE_OPTIONS);
  }
  return response;
}

function safeName(filename: string): string {
  const base = filename.replaceAll("\\", "/").split("/").pop() ?? "file";
  return base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^\.+/, "").slice(0, 80) || "file";
}
