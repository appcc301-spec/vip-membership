import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

function getUploadDir(): string {
  const baseDir = process.env.FLY_VOLUME_PATH
    ? process.env.FLY_VOLUME_PATH
    : process.env.RENDER_DISK_PATH
      ? process.env.RENDER_DISK_PATH
      : path.join(process.cwd(), "data");
  return path.join(baseDir, "uploads");
}

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const fileName = pathSegments.join("/");

    // Reject paths that try to escape the upload directory
    if (fileName.includes("..") || fileName.includes("\\")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const uploadDir = getUploadDir();
    const filePath = path.join(uploadDir, fileName);
    const resolved = path.resolve(filePath);
    const resolvedDir = path.resolve(uploadDir);

    if (!resolved.startsWith(resolvedDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const buffer = await readFile(filePath);
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("[uploads] Failed to serve file:", error);
    return new NextResponse("Not found", { status: 404 });
  }
}
