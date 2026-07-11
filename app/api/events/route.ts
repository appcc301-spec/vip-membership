import { NextResponse } from "next/server";
import { getPublicEvents, getMemberEvents, getAllEvents } from "@/lib/events-data";
import { syncEventsFromBandsintown } from "@/lib/sync";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "public";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    if (scope === "admin") {
      await requireAuth("admin");
      const events = await getAllEvents();
      return NextResponse.json({ events });
    }

    if (scope === "member") {
      await requireAuth("member");
      const events = await getMemberEvents();
      return NextResponse.json({ events });
    }

    const events = await getPublicEvents(limit);
    return NextResponse.json({ events });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await requireAuth("admin");
    const result = await syncEventsFromBandsintown();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to sync events" }, { status: 500 });
  }
}
