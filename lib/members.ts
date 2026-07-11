import "server-only";
import {
  createMemberRecord,
  getMemberRows,
  getMemberById as dbGetMemberById,
  getMemberByEmail as dbGetMemberByEmail,
  memberExistsByEmail,
  seedAdmin,
  getAdminByEmail,
  updateMemberRecord,
  deleteMemberRecord,
  getArtistRows,
  getArtistById as dbGetArtistById,
  createArtistRecord,
  updateArtistRecord,
  deleteArtistRecord,
  setArtistActiveRecord,
  getActiveArtistRecord,
} from "./db";
import { MOCK_ADMIN, MOCK_MEMBER, MEMBERSHIP_TIERS, type Member, type AdminUser, type Analytics, type Artist } from "./data";

export async function getMembers(): Promise<Member[]> {
  return getMemberRows();
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  return dbGetMemberById(id);
}

export async function getMemberByEmail(email: string): Promise<Member | undefined> {
  return dbGetMemberByEmail(email);
}

export async function addMember(member: Member): Promise<void> {
  return createMemberRecord(member);
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
  return updateMemberRecord(id, updates);
}

export async function removeMember(id: string): Promise<boolean> {
  return deleteMemberRecord(id);
}

export async function memberEmailExists(email: string): Promise<boolean> {
  return memberExistsByEmail(email);
}

let _seeded = false;

export async function seedDatabase(): Promise<void> {
  if (_seeded) return;
  await seedAdmin(MOCK_ADMIN);
  const exists = await memberEmailExists(MOCK_MEMBER.personal.email);
  if (!exists) {
    await createMemberRecord(MOCK_MEMBER);
  }
  _seeded = true;
}

export async function verifyAdminCredentials(email: string): Promise<AdminUser | undefined> {
  return getAdminByEmail(email);
}

export async function getArtists(): Promise<Artist[]> {
  return getArtistRows();
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  return dbGetArtistById(id);
}

export async function addArtist(artist: Artist): Promise<void> {
  return createArtistRecord(artist);
}

export async function updateArtist(id: string, updates: Partial<Artist>): Promise<Artist | undefined> {
  return updateArtistRecord(id, updates);
}

export async function removeArtist(id: string): Promise<{ ok: boolean; memberCount: number; eventCount: number }> {
  return deleteArtistRecord(id);
}

export async function setArtistActive(id: string): Promise<Artist | undefined> {
  return setArtistActiveRecord(id);
}

export async function getActiveArtist(): Promise<Artist | undefined> {
  return getActiveArtistRecord();
}

export async function getAnalytics(): Promise<Analytics> {
  const members = await getMembers();
  const active = members.filter((m) => m.membership.status === "active").length;
  const expired = members.filter((m) => m.membership.status === "expired").length;
  const revenue = members.reduce((sum, m) => {
    const tier = MEMBERSHIP_TIERS.find((t) => t.id === m.membership.tier);
    return sum + (tier?.price || 0);
  }, 0);
  return {
    totalMembers: members.length,
    activeMembers: active,
    expiredMemberships: expired,
    upcomingRenewals: 0,
    revenue,
    emailDeliveries: members.length,
    qrScans: 0,
    growth: 0,
  };
}
