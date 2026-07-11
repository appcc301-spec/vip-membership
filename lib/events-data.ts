import "server-only";
import { getDb, saveDb } from "./db";
import { type PlatformEvent, type EventRsvp, type SyncStatus } from "./data";


const DEMO_EVENTS: PlatformEvent[] = [
  {
    id: "demo-event-001",
    title: "Robert Plant & Saving Grace — Royal Albert Hall",
    date: "2026-09-12",
    time: "20:00",
    venue: "Royal Albert Hall",
    city: "London",
    country: "UK",
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop",
    ticketUrl: "https://www.royalalberthall.com",
    type: "imported",
    status: "upcoming",
    featured: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-event-002",
    title: "Robert Plant & Saving Grace — O2 Apollo",
    date: "2026-10-03",
    time: "19:30",
    venue: "O2 Apollo",
    city: "Manchester",
    country: "UK",
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&auto=format&fit=crop",
    ticketUrl: "https://www.o2apollomanchester.co.uk",
    type: "imported",
    status: "upcoming",
    featured: false,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-event-003",
    title: "VIP Members Evening — Private Acoustic Session",
    date: "2026-10-18",
    time: "19:00",
    venue: "The Roundhouse",
    city: "London",
    country: "UK",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop",
    type: "vip",
    status: "upcoming",
    featured: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-event-004",
    title: "Robert Plant & Saving Grace — 3Arena",
    date: "2026-11-07",
    time: "20:00",
    venue: "3Arena",
    city: "Dublin",
    country: "Ireland",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop",
    ticketUrl: "https://www.3arena.ie",
    type: "imported",
    status: "upcoming",
    featured: false,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-event-005",
    title: "Robert Plant & Saving Grace — Barrowland Ballroom",
    date: "2026-11-21",
    time: "19:30",
    venue: "Barrowland Ballroom",
    city: "Glasgow",
    country: "UK",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&auto=format&fit=crop",
    ticketUrl: "https://www.barrowland-ballroom.co.uk",
    type: "imported",
    status: "upcoming",
    featured: false,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function initEventsTables(existingDb?: import("sql.js").Database): Promise<import("sql.js").Database> {
  const db = existingDb ?? await getDb();
  try { db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      artist_id TEXT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      venue TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      image_url TEXT,
      ticket_url TEXT,
      bandsintown_url TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      visible INTEGER NOT NULL DEFAULT 1,
      synced_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `); } catch {}
  try { db.run(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(member_id, event_id)
    );
  `); } catch {}
  try { db.run(`
    CREATE TABLE IF NOT EXISTS sync_status (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      imported_count INTEGER NOT NULL DEFAULT 0,
      created_count INTEGER NOT NULL DEFAULT 0,
      updated_count INTEGER NOT NULL DEFAULT 0,
      api_status INTEGER,
      error_message TEXT,
      is_demo_data INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT NOT NULL
    );
  `); } catch {}
  try { db.run("ALTER TABLE events ADD COLUMN artist_id TEXT"); } catch {}
  await saveDb(db);
  return db;
}

export async function seedEventsIfEmpty(): Promise<void> {
  const db = await initEventsTables();
  const existing = db.exec("SELECT COUNT(*) as count FROM events");
  const count = (existing[0]?.values[0][0] as number) ?? 0;
  if (count > 0) return;
  for (const event of DEMO_EVENTS) {
    db.run(
      `INSERT OR IGNORE INTO events (
        id, title, date, time, venue, city, country, image_url, ticket_url, bandsintown_url,
        type, status, featured, visible, synced_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id, event.title, event.date, event.time ?? null,
        event.venue, event.city, event.country,
        event.imageUrl ?? null, event.ticketUrl ?? null, null,
        event.type, event.status, event.featured ? 1 : 0, event.visible ? 1 : 0,
        null, event.createdAt, event.updatedAt,
      ]
    );
  }
  await saveDb(db);
}

export function rowToEvent(row: Record<string, string | number | null>): PlatformEvent {
  return {
    id: row.id as string,
    artistId: (row.artist_id as string) || undefined,
    title: row.title as string,
    date: row.date as string,
    time: (row.time as string) || undefined,
    venue: row.venue as string,
    city: row.city as string,
    country: row.country as string,
    imageUrl: (row.image_url as string) || undefined,
    ticketUrl: (row.ticket_url as string) || undefined,
    bandsintownUrl: (row.bandsintown_url as string) || undefined,
    type: row.type as PlatformEvent["type"],
    status: row.status as PlatformEvent["status"],
    featured: Boolean(row.featured as number),
    visible: Boolean(row.visible as number),
    syncedAt: (row.synced_at as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getEventsByArtist(artistId: string): Promise<PlatformEvent[]> {
  const db = await initEventsTables();
  const result = db.exec("SELECT * FROM events WHERE artist_id = ? ORDER BY date ASC", [artistId]);
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const record: Record<string, string | number | null> = {};
    columns.forEach((col: string, i: number) => { record[col] = row[i]; });
    return rowToEvent(record);
  });
}

export async function getAllEvents(): Promise<PlatformEvent[]> {
  const db = await initEventsTables();
  const result = db.exec("SELECT * FROM events ORDER BY date ASC");
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const record: Record<string, string | number | null> = {};
    columns.forEach((col: string, i: number) => {
      record[col] = row[i] as string | number | null;
    });
    return rowToEvent(record);
  });
}

export async function getVisibleEvents(): Promise<PlatformEvent[]> {
  const events = await getAllEvents();
  const now = new Date().toISOString().split("T")[0];
  return events.filter((e) => e.visible && e.date >= now);
}

export async function getPublicEvents(limit?: number): Promise<PlatformEvent[]> {
  await seedEventsIfEmpty();
  let events = await getVisibleEvents();
  // Auto-sync from Ticketmaster if db is empty and an API key is available
  if (events.length === 0 && process.env.TICKETMASTER_API_KEY) {
    try {
      const { syncEventsFromBandsintown } = await import("./sync");
      await syncEventsFromBandsintown();
      events = await getVisibleEvents();
    } catch {
      // Sync failed — return empty gracefully
    }
  }
  const publicEvents = events.filter((e) => e.type === "imported" || e.featured);
  const sorted = publicEvents.sort((a, b) => a.date.localeCompare(b.date));
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getMemberEvents(): Promise<PlatformEvent[]> {
  await seedEventsIfEmpty();
  const events = await getVisibleEvents();
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getEventById(id: string): Promise<PlatformEvent | undefined> {
  const db = await initEventsTables();
  const result = db.exec("SELECT * FROM events WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const columns = result[0].columns;
  const record: Record<string, string | number | null> = {};
  columns.forEach((col: string, i: number) => {
    record[col] = result[0].values[0][i] as string | number | null;
  });
  return rowToEvent(record);
}

export async function upsertEvents(events: PlatformEvent[]): Promise<void> {
  const db = await initEventsTables();
  for (const event of events) {
    db.run(
      `
      INSERT INTO events (
        id, artist_id, title, date, time, venue, city, country, image_url, ticket_url, bandsintown_url,
        type, status, featured, visible, synced_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        date = excluded.date,
        time = excluded.time,
        venue = excluded.venue,
        city = excluded.city,
        country = excluded.country,
        image_url = excluded.image_url,
        ticket_url = excluded.ticket_url,
        bandsintown_url = excluded.bandsintown_url,
        status = excluded.status,
        synced_at = excluded.synced_at,
        updated_at = excluded.updated_at
      `,
      [
        event.id,
        event.artistId || null,
        event.title,
        event.date,
        event.time || null,
        event.venue,
        event.city,
        event.country,
        event.imageUrl || null,
        event.ticketUrl || null,
        event.bandsintownUrl || null,
        event.type,
        event.status,
        event.featured ? 1 : 0,
        event.visible ? 1 : 0,
        event.syncedAt || null,
        event.createdAt,
        event.updatedAt,
      ]
    );
  }
  await saveDb(db);
}

export async function updateEventVisibility(id: string, visible: boolean): Promise<PlatformEvent | undefined> {
  const db = await initEventsTables();
  db.run("UPDATE events SET visible = ?, updated_at = ? WHERE id = ?", [visible ? 1 : 0, new Date().toISOString(), id]);
  await saveDb(db);
  return getEventById(id);
}

export async function updateEventFeatured(id: string, featured: boolean): Promise<PlatformEvent | undefined> {
  const db = await initEventsTables();
  db.run("UPDATE events SET featured = ?, updated_at = ? WHERE id = ?", [featured ? 1 : 0, new Date().toISOString(), id]);
  await saveDb(db);
  return getEventById(id);
}

export async function createVipEvent(event: PlatformEvent): Promise<void> {
  const db = await initEventsTables();
  db.run(
    `
    INSERT INTO events (
      id, artist_id, title, date, time, venue, city, country, image_url, ticket_url, bandsintown_url,
      type, status, featured, visible, synced_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      event.id,
      event.artistId || null,
      event.title,
      event.date,
      event.time || null,
      event.venue,
      event.city,
      event.country,
      event.imageUrl || null,
      event.ticketUrl || null,
      event.bandsintownUrl || null,
      event.type,
      event.status,
      event.featured ? 1 : 0,
      event.visible ? 1 : 0,
      event.syncedAt || null,
      event.createdAt,
      event.updatedAt,
    ]
  );
  await saveDb(db);
}

export async function deleteImportedEvents(): Promise<number> {
  const db = await initEventsTables();
  const before = db.exec("SELECT COUNT(*) as count FROM events WHERE type = 'imported'");
  db.run("DELETE FROM events WHERE type = 'imported'");
  const after = db.exec("SELECT COUNT(*) as count FROM events WHERE type = 'imported'");
  await saveDb(db);
  const beforeCount = (before[0]?.values[0][0] as number) || 0;
  const afterCount = (after[0]?.values[0][0] as number) || 0;
  return beforeCount - afterCount;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const db = await initEventsTables();
  const before = db.exec("SELECT COUNT(*) as count FROM events");
  db.run("DELETE FROM events WHERE id = ?", [id]);
  const after = db.exec("SELECT COUNT(*) as count FROM events");
  await saveDb(db);
  const beforeCount = (before[0]?.values[0][0] as number) || 0;
  const afterCount = (after[0]?.values[0][0] as number) || 0;
  return afterCount < beforeCount;
}

export async function getRsvpsForEvent(eventId: string): Promise<EventRsvp[]> {
  const db = await initEventsTables();
  const result = db.exec("SELECT * FROM rsvps WHERE event_id = ?", [eventId]);
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const record: Record<string, string | null> = {};
    columns.forEach((col: string, i: number) => {
      record[col] = row[i] as string | null;
    });
    return {
      id: record.id!,
      memberId: record.member_id!,
      eventId: record.event_id!,
      status: record.status as EventRsvp["status"],
      createdAt: record.created_at!,
      updatedAt: record.updated_at!,
    };
  });
}

export async function getMemberRsvps(memberId: string): Promise<Record<string, EventRsvp["status"]>> {
  const db = await initEventsTables();
  const result = db.exec("SELECT event_id, status FROM rsvps WHERE member_id = ?", [memberId]);
  if (result.length === 0) return {};
  const map: Record<string, EventRsvp["status"]> = {};
  result[0].values.forEach((row: any[]) => {
    map[row[0] as string] = row[1] as EventRsvp["status"];
  });
  return map;
}

export async function getRsvp(memberId: string, eventId: string): Promise<EventRsvp | undefined> {
  const db = await initEventsTables();
  const result = db.exec("SELECT * FROM rsvps WHERE member_id = ? AND event_id = ?", [memberId, eventId]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const columns = result[0].columns;
  const record: Record<string, string | null> = {};
  columns.forEach((col: string, i: number) => {
    record[col] = result[0].values[0][i] as string | null;
  });
  return {
    id: record.id!,
    memberId: record.member_id!,
    eventId: record.event_id!,
    status: record.status as EventRsvp["status"],
    createdAt: record.created_at!,
    updatedAt: record.updated_at!,
  };
}

export interface RsvpWithMember {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberTier: string;
  memberStatus: string;
  eventId: string;
  status: EventRsvp["status"];
  createdAt: string;
  updatedAt: string;
}

export async function getRsvpsWithMemberDetails(eventId: string): Promise<RsvpWithMember[]> {
  const db = await initEventsTables();
  const result = db.exec(
    `SELECT r.id, r.member_id, r.event_id, r.status, r.created_at, r.updated_at,
            m.first_name, m.last_name, m.email, m.tier, m.status as member_status
     FROM rsvps r
     LEFT JOIN members m ON r.member_id = m.id
     WHERE r.event_id = ?
     ORDER BY r.created_at DESC`,
    [eventId]
  );
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const rec: Record<string, any> = {};
    columns.forEach((col: string, i: number) => { rec[col] = row[i]; });
    return {
      id: rec.id,
      memberId: rec.member_id,
      memberName: rec.first_name && rec.last_name ? `${rec.first_name} ${rec.last_name}` : rec.member_id,
      memberEmail: rec.email ?? "",
      memberTier: rec.tier ?? "",
      memberStatus: rec.member_status ?? "",
      eventId: rec.event_id,
      status: rec.status as EventRsvp["status"],
      createdAt: rec.created_at,
      updatedAt: rec.updated_at,
    };
  });
}

export interface RsvpEventSummary {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  going: number;
  interested: number;
  notGoing: number;
  total: number;
}

export async function getAllRsvpSummaries(): Promise<RsvpEventSummary[]> {
  const db = await initEventsTables();
  const result = db.exec(`
    SELECT e.id, e.title, e.date, e.venue, e.city,
      COALESCE(SUM(CASE WHEN r.status = 'going' THEN 1 ELSE 0 END), 0) as going,
      COALESCE(SUM(CASE WHEN r.status = 'interested' THEN 1 ELSE 0 END), 0) as interested,
      COALESCE(SUM(CASE WHEN r.status = 'not_going' THEN 1 ELSE 0 END), 0) as not_going,
      COALESCE(COUNT(r.id), 0) as total
    FROM events e
    LEFT JOIN rsvps r ON e.id = r.event_id
    GROUP BY e.id
    ORDER BY e.date ASC
  `);
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const rec: Record<string, any> = {};
    cols.forEach((c: string, i: number) => { rec[c] = row[i]; });
    return {
      eventId: rec.id,
      eventTitle: rec.title,
      eventDate: rec.date,
      eventVenue: rec.venue,
      eventCity: rec.city,
      going: rec.going ?? 0,
      interested: rec.interested ?? 0,
      notGoing: rec.not_going ?? 0,
      total: rec.total ?? 0,
    };
  });
}

export async function upsertRsvp(rsvp: EventRsvp): Promise<void> {
  const db = await initEventsTables();
  // DELETE + INSERT guarantees the status is always updated regardless of sql.js ON CONFLICT quirks
  db.run(`DELETE FROM rsvps WHERE member_id = ? AND event_id = ?`, [rsvp.memberId, rsvp.eventId]);
  db.run(
    `INSERT INTO rsvps (id, member_id, event_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [rsvp.id, rsvp.memberId, rsvp.eventId, rsvp.status, rsvp.createdAt, rsvp.updatedAt]
  );
  await saveDb(db);
}

export async function getLatestSyncStatus(): Promise<SyncStatus | undefined> {
  const db = await initEventsTables();
  const result = db.exec("SELECT * FROM sync_status ORDER BY synced_at DESC LIMIT 1");
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const columns = result[0].columns;
  const record: Record<string, string | number | null> = {};
  columns.forEach((col: string, i: number) => {
    record[col] = result[0].values[0][i] as string | number | null;
  });
  return {
    id: record.id as string,
    source: record.source as string,
    status: record.status as SyncStatus["status"],
    endpoint: (record.endpoint as string) || "",
    importedCount: (record.imported_count as number) ?? 0,
    createdCount: (record.created_count as number) ?? 0,
    updatedCount: (record.updated_count as number) ?? 0,
    apiStatus: record.api_status as number | undefined,
    errorMessage: (record.error_message as string) || undefined,
    isDemoData: Boolean(record.is_demo_data as number),
    syncedAt: record.synced_at as string,
  };
}

export async function recordSyncStatus(status: SyncStatus): Promise<void> {
  const db = await initEventsTables();
  db.run(
    `
    INSERT INTO sync_status (id, source, status, endpoint, imported_count, created_count, updated_count, api_status, error_message, is_demo_data, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source = excluded.source,
      status = excluded.status,
      endpoint = excluded.endpoint,
      imported_count = excluded.imported_count,
      created_count = excluded.created_count,
      updated_count = excluded.updated_count,
      api_status = excluded.api_status,
      error_message = excluded.error_message,
      is_demo_data = excluded.is_demo_data,
      synced_at = excluded.synced_at
    `,
    [
      status.id,
      status.source,
      status.status,
      status.endpoint,
      status.importedCount,
      status.createdCount,
      status.updatedCount,
      status.apiStatus ?? null,
      status.errorMessage ?? null,
      status.isDemoData ? 1 : 0,
      status.syncedAt,
    ]
  );
  await saveDb(db);
}
