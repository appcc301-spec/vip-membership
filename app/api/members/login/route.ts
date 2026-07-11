import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getMemberByEmail, seedDatabase } from "@/lib/members";
import { createMemberSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    const { email, password } = await request.json();
    const member = await getMemberByEmail(email);
    if (!member) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const matches = await bcrypt.compare(password, member.credentials.passwordHash);
    const tempMatch = password === member.credentials.temporaryPassword;

    if (!matches && !tempMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createMemberSession(
      member.id,
      member.personal.email,
      `${member.personal.firstName} ${member.personal.lastName}`
    );

    return NextResponse.json({
      success: true,
      mustChangePassword: tempMatch,
      member: {
        id: member.id,
        name: `${member.personal.firstName} ${member.personal.lastName}`,
        email: member.personal.email,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
