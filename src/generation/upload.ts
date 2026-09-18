export async function uploadMedia(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    let detail = "Upload failed";
    try {
      const payload = (await res.json()) as { error?: unknown };
      if (typeof payload.error === "string" && payload.error) detail = payload.error;
    } catch {
      /* keep default */
    }
    throw new Error(detail);
  }
  const payload = (await res.json()) as { url?: unknown };
  if (typeof payload.url !== "string" || !payload.url) throw new Error("Upload failed");
  return { url: payload.url };
}
