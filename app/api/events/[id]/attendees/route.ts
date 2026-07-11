import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRsvpsWithMemberDetails } from "@/lib/events-data";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: eventId } = await params;
    const rsvps = await getRsvpsWithMemberDetails(eventId);
    const going = rsvps.filter((r) => r.status === "going");
    const interested = rsvps.filter((r) => r.status === "interested");
    const notGoing = rsvps.filter((r) => r.status === "not_going");
    return NextResponse.json({ going, interested, notGoing, total: rsvps.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch attendees" }, { status: 500 });
  }
}
