import { NextResponse } from "next/server";
import { testTicketmasterConnection } from "@/lib/ticketmaster";
import { testBandsintownConnection } from "@/lib/bandsintown";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth("admin");

    const hasTm = !!process.env.TICKETMASTER_API_KEY;
    const hasBit = !!process.env.BANDSINTOWN_APP_ID;

    if (hasTm) {
      const result = await testTicketmasterConnection();
      return NextResponse.json({ success: result.ok, source: "ticketmaster", result });
    }

    if (hasBit) {
      const result = await testBandsintownConnection();
      return NextResponse.json({ success: result.ok, source: "bandsintown", result });
    }

    const result = await testTicketmasterConnection();
    return NextResponse.json({ success: false, source: "none", result });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to test connection" }, { status: 500 });
  }
}
