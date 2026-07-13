import "server-only";
import { v4 as uuid } from "uuid";
import { fetchTicketmasterEvents } from "./ticketmaster";
import { fetchBandsintownEvents } from "./bandsintown";
import { getAllEvents, upsertEvents, recordSyncStatus, deleteImportedEvents } from "./events-data";
import { getActiveArtists } from "./members";
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
 * Sync upcoming events for all active artists into the database.
 * Uses Ticketmaster keyword search for each active artist when available.
 * Falls back to Bandsintown for the primary artist if no Ticketmaster key is set.
 */
export async function syncEventsFromBandsintown(): Promise<SyncResult> {
  const hasTm = !!process.env.TICKETMASTER_API_KEY;
  const hasBit = !!process.env.BANDSINTOWN_APP_ID;

  const activeArtists = await getActiveArtists();
  const primaryArtist = activeArtists[0];

  // No API keys configured — record disabled state
  if (!hasTm && !hasBit) {
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

  // Try Ticketmaster for every active artist
  if (hasTm) {
    const allEvents: PlatformEvent[] = [];
    let lastEndpoint = "";
    let lastApiStatus: number | undefined;
    let anyError = "";

    for (const artist of activeArtists) {
      const fetched = await fetchTicketmasterEvents(artist.name);
      lastEndpoint = fetched.endpoint;
      lastApiStatus = fetched.apiStatus;
      if (fetched.errorMessage) {
        anyError = fetched.errorMessage;
        continue;
      }
      for (const event of fetched.events) {
        allEvents.push({ ...event, artistId: artist.id });
      }
    }

    if (allEvents.length > 0) {
      return persistAndRecord(allEvents, lastEndpoint, "ticketmaster", lastApiStatus);
    }

    if (activeArtists.length > 0) {
      return recordError(lastEndpoint, "Ticketmaster", lastApiStatus, anyError || "No events found", false);
    }
  }

  // Fall back to Bandsintown for the primary artist (requires artist account key)
  if (hasBit && primaryArtist) {
    const fetched = await fetchBandsintownEvents();
    if (!fetched.errorMessage) {
      const eventsWithArtist = fetched.events.map((e) => ({ ...e, artistId: primaryArtist.id }));
      return persistAndRecord(eventsWithArtist, fetched.endpoint, "bandsintown_api", fetched.apiStatus);
    }
    return recordError(fetched.endpoint, "Bandsintown", fetched.apiStatus, fetched.errorMessage!, false);
  }

  // No active artists and no usable APIs
  const tmFetched = await fetchTicketmasterEvents();
  return recordError(tmFetched.endpoint, "Ticketmaster", tmFetched.apiStatus, tmFetched.errorMessage!, false);
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
