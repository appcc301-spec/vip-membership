import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import { createVipEvent } from "@/lib/events-data";
import { type PlatformEvent } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin");
    const body = await request.json();
    const now = new Date().toISOString();
    const event: PlatformEvent = {
      id: `vip-${uuidv4()}`,
      artistId: body.artistId || undefined,
      title: body.title,
      date: body.date,
      time: body.time || undefined,
      venue: body.venue,
      city: body.city,
      country: body.country,
      imageUrl: body.imageUrl || undefined,
      ticketUrl: body.ticketUrl || undefined,
      bandsintownUrl: undefined,
      type: "vip",
      status: body.status || "upcoming",
      featured: body.featured || false,
      visible: true,
      createdAt: now,
      updatedAt: now,
    };
    await createVipEvent(event);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 });
  }
}
