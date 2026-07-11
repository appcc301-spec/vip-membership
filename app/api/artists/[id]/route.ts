import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getArtistById, updateArtist, removeArtist } from "@/lib/members";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const artist = await getArtistById(id);
    if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    return NextResponse.json({ artist });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const updated = await updateArtist(id, body);
    if (!updated) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    return NextResponse.json({ artist: updated });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";
    const result = await removeArtist(id);
    if (!result.ok) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    if (!force && (result.memberCount > 0 || result.eventCount > 0)) {
      return NextResponse.json({
        requiresConfirmation: true,
        memberCount: result.memberCount,
        eventCount: result.eventCount,
      }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
