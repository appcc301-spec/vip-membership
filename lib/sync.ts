import "server-only";
import { v4 as uuid } from "uuid";
import { fetchTicketmasterEvents } from "./ticketmaster";
import { fetchBandsintownEvents } from "./bandsintown";
import { getAllEvents, upsertEvents, recordSyncStatus, deleteImportedEvents } from "./events-data";
import { type PlatformEvent, type SyncStatus } from "./data";

export interface SyncResult {
  imported: number;
  created: number;
  updated: number;
  endpoint: string;
  source: "ticketmaster" | "bandsintown_api";
  apiStatus?: number;
  errorMessage?: string;
}

/**
 * Sync upcoming Robert Plant events into the database.
 * Priority: Ticketmaster (free public API) → Bandsintown (requires artist key).
 * If neither key is configured, records a disabled status and returns 0 events.
 */
export async function syncEventsFromBandsintown(): Promise<SyncResult> {
  const hasTm = !!process.env.TICKETMASTER_API_KEY;
  const hasBit = !!process.env.BANDSINTOWN_APP_ID;

  // Try Ticketmaster first (no artist account needed)
  if (hasTm) {
    const fetched = await fetchTicketmasterEvents();
    if (!fetched.errorMessage) {
      return persistAndRecord(fetched.events, fetched.endpoint, "ticketmaster", fetched.apiStatus);
    }
  }

  // Fall back to Bandsintown (requires artist account key)
  if (hasBit) {
    const fetched = await fetchBandsintownEvents();
    if (!fetched.errorMessage) {
      return persistAndRecord(fetched.events, fetched.endpoint, "bandsintown_api", fetched.apiStatus);
    }
    // Both configured but both failed — record the Bandsintown error
    const result = await recordError(fetched.endpoint, "Bandsintown", fetched.apiStatus, fetched.errorMessage!, false);
    return result;
  }

  // No API keys configured — record disabled state
  const tmFetched = await fetchTicketmasterEvents();
  const result = await recordError(
    tmFetched.endpoint,
    "Ticketmaster",
    undefined,
    tmFetched.errorMessage!,
    true
  );
  return { ...result, source: "ticketmaster" };
}

async function persistAndRecord(
  events: PlatformEvent[],
  endpoint: string,
  source: "ticketmaster" | "bandsintown_api",
  apiStatus?: number
): Promise<SyncResult> {
  const existing = await getAllEvents();
  const existingMap = new Map(existing.map((e) => [e.id, e]));

  let created = 0;
  let updated = 0;

  const merged: PlatformEvent[] = events.map((event) => {
    const current = existingMap.get(event.id);
    if (!current) {
      created++;
      return event;
    }
    updated++;
    return {
      ...event,
      featured: current.featured,
      visible: current.visible,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
  });

  await deleteImportedEvents();
  await upsertEvents(merged);

  const result: SyncResult = {
    imported: events.length,
    created,
    updated,
    endpoint,
    source,
    apiStatus,
  };

  const status: SyncStatus = {
    id: uuid(),
    source: source === "ticketmaster" ? "Ticketmaster" : "Bandsintown",
    status: "success",
    endpoint,
    importedCount: result.imported,
    createdCount: result.created,
    updatedCount: result.updated,
    apiStatus,
    errorMessage: undefined,
    isDemoData: false,
    syncedAt: new Date().toISOString(),
  };

  await recordSyncStatus(status);
  return result;
}

async function recordError(
  endpoint: string,
  sourceName: string,
  apiStatus: number | undefined,
  errorMessage: string,
  isDisabled: boolean
): Promise<SyncResult> {
  const status: SyncStatus = {
    id: uuid(),
    source: sourceName,
    status: isDisabled ? "disabled" : "error",
    endpoint,
    importedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    apiStatus,
    errorMessage,
    isDemoData: false,
    syncedAt: new Date().toISOString(),
  };
  await recordSyncStatus(status);
  return {
    imported: 0,
    created: 0,
    updated: 0,
    endpoint,
    source: "ticketmaster",
    apiStatus,
    errorMessage,
  };
}
