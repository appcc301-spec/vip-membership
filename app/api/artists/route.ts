import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import { getArtists, addArtist } from "@/lib/members";
import { type Artist } from "@/lib/data";

export async function GET() {
  try {
    const artists = await getArtists();
    return NextResponse.json({ artists });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch artists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin");
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Artist name is required" }, { status: 400 });
    }

    const slug = body.slug?.trim() ||
      body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const now = new Date().toISOString();
    const artist: Artist = {
      id: uuidv4(),
      name: body.name.trim(),
      slug,
      logoUrl: body.logoUrl || undefined,
      bannerUrl: body.bannerUrl || undefined,
      description: body.description || undefined,
      contactEmail: body.contactEmail || undefined,
      primaryColor: body.primaryColor || "#c9a84c",
      status: body.status || "active",
      isActive: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    await addArtist(artist);
    return NextResponse.json({ artist }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to create artist" }, { status: 500 });
  }
}
