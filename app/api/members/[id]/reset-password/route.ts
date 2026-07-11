import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMemberById, updateMember } from "@/lib/members";
import { generateTemporaryPassword } from "@/lib/utils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const member = await getMemberById(id);
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const newTempPassword = generateTemporaryPassword();
    await updateMember(id, {
      credentials: {
        ...member.credentials,
        temporaryPassword: newTempPassword,
        passwordUpdatedAt: undefined,
      },
    });

    return NextResponse.json({ temporaryPassword: newTempPassword });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to reset password" }, { status: 500 });
  }
}
