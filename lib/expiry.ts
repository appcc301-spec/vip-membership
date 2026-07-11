import "server-only";
import { getMemberRows, updateMemberRecord } from "./db";
import { type StatusHistoryEntry } from "./data";

let _lastRunAt = 0;
const RUN_INTERVAL_MS = 60_000; // run at most once per minute across the process

/**
 * Scans all members in pending-24h / pending-48h status.
 * Any whose pendingExpiresAt has passed are moved to "dormant".
 * Designed to be called on every request (admin/member layouts + API routes).
 * A simple in-memory debounce prevents hammering the DB.
 */
export async function processExpiredPendingMembers(): Promise<void> {
  const now = Date.now();
  if (now - _lastRunAt < RUN_INTERVAL_MS) return;
  _lastRunAt = now;

  try {
    const members = await getMemberRows();
    const nowIso = new Date().toISOString();

    for (const member of members) {
      const { status, pendingExpiresAt, statusHistory } = member.membership;
      if (status !== "pending-24h" && status !== "pending-48h") continue;
      if (!pendingExpiresAt) continue;
      if (new Date(pendingExpiresAt) > new Date()) continue;

      // Expired — move to dormant
      const entry: StatusHistoryEntry = {
        status: "dormant",
        changedAt: nowIso,
        changedBy: "system",
        note: `Auto-dormant: pending period expired at ${pendingExpiresAt}`,
      };

      await updateMemberRecord(member.id, {
        membership: {
          ...member.membership,
          status: "dormant",
          dormantAt: nowIso,
          pendingExpiresAt: undefined,
          statusHistory: [...(statusHistory || []), entry],
        },
        card: { ...member.card, status: "dormant" },
      });

      console.log(`[expiry] Member ${member.id} (${member.personal.email}) moved to dormant.`);
    }
  } catch (err) {
    console.error("[expiry] Error processing expired pending members:", err);
  }
}
