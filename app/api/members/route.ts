import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { addMember, getMemberByEmail, seedDatabase } from "@/lib/members";
import { MEMBERSHIP_TIERS, type Member, type MembershipStatus } from "@/lib/data";
import { generateCardId, generateMembershipNumber, generateTemporaryPassword } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

const VALID_STATUSES: MembershipStatus[] = [
  "pending", "pending-24h", "pending-48h", "active", "dormant", "cancelled", "expired", "suspended",
];

function computePendingExpiresAt(status: MembershipStatus): string | undefined {
  if (status === "pending-24h") return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  if (status === "pending-48h") return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    await requireAuth("admin");

    const body = await request.json();
    const existing = await getMemberByEmail(body.email);
    if (existing) {
      return NextResponse.json({ error: "A member with this email already exists" }, { status: 409 });
    }

    const tempPassword = generateTemporaryPassword();
    const membershipNumber = generateMembershipNumber();
    const cardId = generateCardId();
    const tier = MEMBERSHIP_TIERS.find((t) => t.id === body.tier) || MEMBERSHIP_TIERS[0];

    const initialStatus: MembershipStatus =
      VALID_STATUSES.includes(body.status) ? body.status : "pending";

    const member: Member = {
      id: uuidv4(),
      artistId: body.artistId || undefined,
      role: "member",
      personal: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || "",
        country: body.country || "",
        address: body.address || "",
        dateOfBirth: body.dateOfBirth || "",
        profilePhoto: body.profilePhoto || `https://i.pravatar.cc/150?u=${body.email}`,
      },
      membership: {
        tier: tier.id,
        number: membershipNumber,
        startDate: body.startDate,
        expirationDate: body.expirationDate,
        status: initialStatus,
        notes: body.notes || "",
        pendingExpiresAt: computePendingExpiresAt(initialStatus),
        dormantAt: initialStatus === "dormant" ? new Date().toISOString() : undefined,
        statusHistory: [{
          status: initialStatus,
          changedAt: new Date().toISOString(),
          changedBy: "admin",
          note: "Member created",
        }],
      },
      card: {
        id: cardId,
        membershipNumber,
        theme: body.theme || "gold",
        issueDate: body.startDate,
        expirationDate: body.expirationDate,
        qrCodeUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${membershipNumber}`,
        status: "pending",
      },
      credentials: {
        username: body.email,
        passwordHash: await bcrypt.hash(tempPassword, 10),
        temporaryPassword: tempPassword,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addMember(member);

    // Trigger welcome email in the background so member creation returns fast.
    // On Render (persistent Node) the process keeps running and completes the send.
    const emailPromise = sendWelcomeEmail(member, tempPassword).then((result) => {
      if (result.success) {
        console.log("[members] Welcome email sent successfully to:", member.personal.email);
      } else {
        console.error("[members] Welcome email failed:", result.error);
      }
      return result;
    });

    // Give the email a short window to complete synchronously for immediate feedback,
    // but never block the response for more than 3 seconds.
    const emailResult = await Promise.race([
      emailPromise,
      new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => {
          // Keep the original promise running in the background so the email still attempts to send.
          emailPromise.then((result) => {
            if (!result.success) {
              console.error("[members] Background welcome email failed:", result.error);
            }
          });
          resolve({ success: false, error: "Email send timed out — will retry in background" });
        }, 3000)
      ),
    ]);

    return NextResponse.json(
      {
        member,
        welcome: {
          sent: emailResult.success,
          emailError: emailResult.error,
          temporaryPassword: tempPassword,
          loginLink: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Failed to create member" }, { status: 500 });
  }
}
