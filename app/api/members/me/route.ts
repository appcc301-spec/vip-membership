import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMemberById } from "@/lib/members";

export async function GET() {
  try {
    const session = await requireAuth("member");
    const member = await getMemberById(session.id);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    return NextResponse.json({ member });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch member" }, { status: 500 });
  }
}
