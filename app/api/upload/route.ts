import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function getUploadDir(): string {
  // Store uploads on the persistent volume so they survive redeploys/restarts.
  const baseDir = process.env.FLY_VOLUME_PATH
    ? process.env.FLY_VOLUME_PATH
    : process.env.RENDER_DISK_PATH
      ? process.env.RENDER_DISK_PATH
      : path.join(process.cwd(), "data");
  return path.join(baseDir, "uploads");
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF, and SVG files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);

    // Serve through the API so files work in production regardless of static/public constraints.
    const url = `/api/uploads/${safeName}`;
    console.log("[upload] Saved file to:", path.join(uploadDir, safeName), "URL:", url);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[upload] Upload failed:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
