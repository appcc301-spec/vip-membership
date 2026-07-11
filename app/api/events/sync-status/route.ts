import { NextResponse } from "next/server";
import { getLatestSyncStatus } from "@/lib/events-data";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth("admin");
    const status = await getLatestSyncStatus();
    return NextResponse.json({ status: status || null });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to fetch sync status" }, { status: 500 });
  }
}
