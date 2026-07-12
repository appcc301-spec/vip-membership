import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMemberById, updateMember, removeMember, seedDatabase } from "@/lib/members";
import { type MembershipStatus, type StatusHistoryEntry } from "@/lib/data";

const VALID_STATUSES: MembershipStatus[] = [
  "pending", "pending-24h", "pending-48h", "active", "dormant", "cancelled", "expired", "suspended",
];

function pendingExpiresAt(status: MembershipStatus): string | undefined {
  if (status === "pending-24h") return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  if (status === "pending-48h") return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  return undefined;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await seedDatabase();
    const session = await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const existing = await getMemberById(id);
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const membership = { ...existing.membership };
    const card = { ...existing.card };

    if (body.status && VALID_STATUSES.includes(body.status as MembershipStatus)) {
      const newStatus = body.status as MembershipStatus;
      const historyEntry: StatusHistoryEntry = {
        status: newStatus,
        changedAt: new Date().toISOString(),
        changedBy: "admin",
        note: body.note,
      };
      membership.status = newStatus;
      membership.statusHistory = [...(existing.membership.statusHistory || []), historyEntry];
      membership.pendingExpiresAt = pendingExpiresAt(newStatus);
      if (newStatus !== "pending-24h" && newStatus !== "pending-48h") {
        membership.pendingExpiresAt = undefined;
      }
      if (newStatus === "dormant") membership.dormantAt = new Date().toISOString();
      if (newStatus === "active") { membership.dormantAt = undefined; }
      card.status = newStatus;
    }

    if (body.tier) membership.tier = body.tier;
    if (body.expirationDate) {
      membership.expirationDate = body.expirationDate;
      card.expirationDate = body.expirationDate;
    }
    if (body.startDate) membership.startDate = body.startDate;
    if (body.notes !== undefined) membership.notes = body.notes;
    if (body.theme) card.theme = body.theme;

    const personal = { ...existing.personal };
    if (body.firstName !== undefined) personal.firstName = body.firstName;
    if (body.lastName !== undefined) personal.lastName = body.lastName;
    if (body.email !== undefined) personal.email = body.email;
    if (body.phone !== undefined) personal.phone = body.phone;
    if (body.country !== undefined) personal.country = body.country;
    if (body.address !== undefined) personal.address = body.address;
    if (body.dateOfBirth !== undefined) personal.dateOfBirth = body.dateOfBirth;
    if (body.profilePhoto !== undefined) personal.profilePhoto = body.profilePhoto;

    const artistId = body.artistId !== undefined ? (body.artistId || undefined) : existing.artistId;

    const updated = await updateMember(id, { personal, membership, card, artistId });
    return NextResponse.json({ member: updated });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized — please log in again" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      console.warn("[members:patch] Forbidden activation attempt:", error.message);
      return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 });
    }
    console.error("[members:patch] Failed to update member:", error);
    return NextResponse.json({ error: error.message || "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await seedDatabase();
    await requireAuth("admin");
    const { id } = await params;
    const existing = await getMemberById(id);
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    await removeMember(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized — please log in again" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to delete member" }, { status: 500 });
  }
}
