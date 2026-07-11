import { NextResponse } from "next/server";
import { syncEventsFromBandsintown } from "@/lib/sync";

export async function GET() {
  try {
    const result = await syncEventsFromBandsintown();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 });
  }
}
