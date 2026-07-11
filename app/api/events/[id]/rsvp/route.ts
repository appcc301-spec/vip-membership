import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { upsertRsvp } from "@/lib/events-data";
import { type EventRsvp } from "@/lib/data";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: eventId } = await params;
    const body = await request.json();
    const status = body.status as EventRsvp["status"];
    if (!["going", "interested", "not_going"].includes(status)) {
      return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
    }
    const now = new Date().toISOString();
    // Use deterministic ID so ON CONFLICT always fires — avoids stale in-memory read
    const deterministicId = `rsvp-${session.id}-${eventId}`;
    await upsertRsvp({
      id: deterministicId,
      memberId: session.id,
      eventId,
      status,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to RSVP" }, { status: 500 });
  }
}
