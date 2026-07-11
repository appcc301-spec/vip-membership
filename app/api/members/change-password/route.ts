import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, createMemberSession } from "@/lib/auth";
import { getMemberById, updateMember } from "@/lib/members";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "member") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const member = await getMemberById(session.id);
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateMember(session.id, {
      credentials: {
        ...member.credentials,
        passwordHash,
        temporaryPassword: "",
        passwordUpdatedAt: new Date().toISOString(),
      },
    });

    // Refresh the session so the member stays authenticated after password change
    await createMemberSession(
      member.id,
      member.personal.email,
      `${member.personal.firstName} ${member.personal.lastName}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to change password" }, { status: 500 });
  }
}
