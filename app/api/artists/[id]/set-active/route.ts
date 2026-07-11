import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setArtistActive } from "@/lib/members";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const artist = await setArtistActive(id);
    if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    return NextResponse.json({ artist });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to set active artist" }, { status: 500 });
  }
}
