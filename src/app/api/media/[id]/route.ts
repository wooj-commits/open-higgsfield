import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

import { NextResponse } from "next/server";

import { uploadDir } from "@/generation/env";

export const dynamic = "force-dynamic";

const NAME = /^[A-Za-z0-9._-]+$/;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!NAME.test(id)) return new NextResponse("Not found", { status: 404 });

  const root = resolve(uploadDir());
  const filePath = resolve(join(root, id));
  if (!filePath.startsWith(`${root}/`) && filePath !== root) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType(id),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

function contentType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".wav")) return "audio/wav";
  return "image/jpeg";
}
