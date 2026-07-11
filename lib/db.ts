import initSqlJs from "sql.js";
import fs from "fs/promises";
import path from "path";
import { type Member, type AdminUser, type Artist, type ArtistStatus, type MembershipTier, type MembershipStatus, type CardTheme, type StatusHistoryEntry } from "./data";

const DB_DIR = process.env.RENDER_DISK_PATH
  ? process.env.RENDER_DISK_PATH
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "vip-platform.db");

// Per-process cache with mtime invalidation
declare global {
  // eslint-disable-next-line no-var
  var __vip_sql: import("sql.js").SqlJsStatic | undefined;
  // eslint-disable-next-line no-var
  var __vip_db: import("sql.js").Database | undefined;
  // eslint-disable-next-line no-var
  var __vip_db_mtime: number;
}

async function getSql(): Promise<import("sql.js").SqlJsStatic> {
  if (globalThis.__vip_sql) return globalThis.__vip_sql;
  const wasmPath = path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  globalThis.__vip_sql = await initSqlJs({ locateFile: () => wasmPath });
  return globalThis.__vip_sql;
}

function applySchema(db: import("sql.js").Database): void {
  try { db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `); } catch {}
  try { db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      country TEXT,
      address TEXT,
      date_of_birth TEXT,
      profile_photo TEXT,
      tier TEXT NOT NULL,
      membership_number TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      expiration_date TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      card_id TEXT NOT NULL,
      card_theme TEXT NOT NULL,
      card_issue_date TEXT NOT NULL,
      card_expiration_date TEXT NOT NULL,
      qr_code_url TEXT NOT NULL,
      card_status TEXT NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      temporary_password TEXT NOT NULL,
      pending_expires_at TEXT,
      dormant_at TEXT,
      status_history TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `); } catch {}
  try { db.run(`
    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      banner_url TEXT,
      description TEXT,
      contact_email TEXT,
      primary_color TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      is_active INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `); } catch {}
  // Safe migrations — columns added only if missing
  try { db.run("ALTER TABLE members ADD COLUMN pending_expires_at TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN dormant_at TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN status_history TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN artist_id TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN password_updated_at TEXT"); } catch {}
  try { db.run("ALTER TABLE artists ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0"); } catch {}
  try { db.run("ALTER TABLE artists ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0"); } catch {}
}

async function initDb(): Promise<import("sql.js").Database> {
  const SQL = await getSql();
  let db: import("sql.js").Database;
  let needsPersist = false;

  await fs.mkdir(DB_DIR, { recursive: true });

  // Try loading the existing DB file
  try {
    const fileBuffer = await fs.readFile(DB_PATH);
    if (fileBuffer.length === 0) throw new Error("Empty file");
    db = new SQL.Database(fileBuffer);

    // Verify integrity
    const check = db.exec("PRAGMA integrity_check;");
    const result = check?.[0]?.values?.[0]?.[0];
    if (result !== "ok") {
      console.warn("[db] Integrity check failed:", result, "— recreating database.");
      db.close();
      try { await fs.unlink(DB_PATH); } catch {}
      db = new SQL.Database();
      needsPersist = true;
    }
  } catch {
    // File missing or unreadable — start fresh
    db = new SQL.Database();
    needsPersist = true;
  }

  // Check if migration columns exist before applying schema
  const hasMigrations = (() => {
    try {
      const cols = db.exec("PRAGMA table_info(artists)");
      const names = (cols[0]?.values || []).map((r) => r[1] as string);
      return names.includes("is_active") && names.includes("is_archived");
    } catch { return false; }
  })();

  try {
    applySchema(db);
  } catch (err) {
    console.warn("[db] Schema failed, starting fresh:", err);
    db.close();
    try { await fs.unlink(DB_PATH); } catch {}
    db = new SQL.Database();
    applySchema(db);
    needsPersist = true;
  }

  // Only persist if DB was new OR migrations were just applied for the first time
  if (!hasMigrations) needsPersist = true;
  if (needsPersist) await persistDb(db);

  return db;
}

// Write db state to disk
async function persistDb(db: import("sql.js").Database): Promise<void> {
  try {
    const data = db.export();
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.writeFile(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error("[db] FAILED to persist database to", DB_PATH, err);
    throw err;
  }
}

/**
 * Returns the DB, reloading from disk if the file has been written since last load.
 * This ensures API route writes are visible to page renders across processes.
 */
export async function getDb(): Promise<import("sql.js").Database> {
  try {
    const stat = await fs.stat(DB_PATH);
    const mtime = stat.mtimeMs;
    if (globalThis.__vip_db && globalThis.__vip_db_mtime === mtime) {
      return globalThis.__vip_db;
    }
    // File changed or first load — reload
    globalThis.__vip_db = await initDb();
    const stat2 = await fs.stat(DB_PATH);
    globalThis.__vip_db_mtime = stat2.mtimeMs;
    return globalThis.__vip_db;
  } catch {
    // File doesn't exist yet
    globalThis.__vip_db = await initDb();
    try {
      const stat2 = await fs.stat(DB_PATH);
      globalThis.__vip_db_mtime = stat2.mtimeMs;
    } catch {}
    return globalThis.__vip_db;
  }
}

export async function saveDb(db: import("sql.js").Database): Promise<void> {
  await persistDb(db);
  // Invalidate the mtime cache so next getDb() reloads from the new file
  globalThis.__vip_db = db;
  try {
    const stat = await fs.stat(DB_PATH);
    globalThis.__vip_db_mtime = stat.mtimeMs;
  } catch {}
}

export async function seedAdmin(admin: AdminUser): Promise<void> {
  const db = await getDb();
  const existing = db.exec("SELECT id FROM admin WHERE id = ?", [admin.id]);
  if (existing.length > 0 && existing[0].values.length > 0) return;

  db.run(
    "INSERT INTO admin (id, email, password_hash) VALUES (?, ?, ?)",
    [admin.id, admin.email, admin.passwordHash]
  );
  await saveDb(db);
}

export async function getAdminByEmail(email: string): Promise<AdminUser | undefined> {
  const db = await getDb();
  const result = db.exec("SELECT id, email, password_hash FROM admin WHERE email = ?", [email]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const [id, emailValue, passwordHash] = result[0].values[0] as string[];
  return { id, email: emailValue, passwordHash, role: "admin" };
}

export function rowToArtist(row: Record<string, string | null>): Artist {
  return {
    id: row.id!,
    name: row.name!,
    slug: row.slug!,
    logoUrl: row.logo_url || undefined,
    bannerUrl: row.banner_url || undefined,
    description: row.description || undefined,
    contactEmail: row.contact_email || undefined,
    primaryColor: row.primary_color || undefined,
    status: (row.status as ArtistStatus) || "active",
    isActive: row.is_active === "1" || (row.is_active as unknown) === 1,
    isArchived: row.is_archived === "1" || (row.is_archived as unknown) === 1,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

export async function getArtistRows(): Promise<Artist[]> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM artists ORDER BY name ASC");
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const record: Record<string, string | null> = {};
    columns.forEach((col, i) => { record[col] = row[i] as string | null; });
    return rowToArtist(record);
  });
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM artists WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const columns = result[0].columns;
  const record: Record<string, string | null> = {};
  columns.forEach((col, i) => { record[col] = result[0].values[0][i] as string | null; });
  return rowToArtist(record);
}

export async function createArtistRecord(artist: Artist): Promise<void> {
  const db = await getDb();
  // If this is the first artist, make it active automatically
  const count = db.exec("SELECT COUNT(*) FROM artists");
  const isFirst = (count[0]?.values[0][0] as number) === 0;
  db.run(
    `INSERT OR IGNORE INTO artists (id, name, slug, logo_url, banner_url, description, contact_email, primary_color, status, is_active, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [artist.id, artist.name, artist.slug, artist.logoUrl || null, artist.bannerUrl || null,
     artist.description || null, artist.contactEmail || null, artist.primaryColor || null,
     artist.status, isFirst ? 1 : (artist.isActive ? 1 : 0), artist.isArchived ? 1 : 0,
     artist.createdAt, artist.updatedAt]
  );
  await saveDb(db);
}

export async function updateArtistRecord(id: string, updates: Partial<Artist>): Promise<Artist | undefined> {
  const existing = await getArtistById(id);
  if (!existing) return undefined;
  const artist: Artist = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  const db = await getDb();
  db.run(
    `UPDATE artists SET name=?, slug=?, logo_url=?, banner_url=?, description=?, contact_email=?, primary_color=?, status=?, is_active=?, is_archived=?, updated_at=? WHERE id=?`,
    [artist.name, artist.slug, artist.logoUrl || null, artist.bannerUrl || null,
     artist.description || null, artist.contactEmail || null, artist.primaryColor || null,
     artist.status, artist.isActive ? 1 : 0, artist.isArchived ? 1 : 0,
     artist.updatedAt, artist.id]
  );
  await saveDb(db);
  return artist;
}

export async function setArtistActiveRecord(id: string): Promise<Artist | undefined> {
  const existing = await getArtistById(id);
  if (!existing) return undefined;
  const db = await getDb();
  const now = new Date().toISOString();
  // Clear active from all artists first
  db.run("UPDATE artists SET is_active = 0, updated_at = ? WHERE is_active = 1", [now]);
  // Set this one as active and ensure not archived
  db.run("UPDATE artists SET is_active = 1, is_archived = 0, status = 'active', updated_at = ? WHERE id = ?", [now, id]);
  await saveDb(db);
  return getArtistById(id);
}

export async function getActiveArtistRecord(): Promise<Artist | undefined> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM artists WHERE is_active = 1 LIMIT 1");
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const columns = result[0].columns;
  const record: Record<string, string | null> = {};
  columns.forEach((col, i) => { record[col] = result[0].values[0][i] as string | null; });
  return rowToArtist(record);
}

export async function deleteArtistRecord(id: string): Promise<{ ok: boolean; memberCount: number; eventCount: number }> {
  const db = await getDb();
  // Count related records
  const mRes = db.exec("SELECT COUNT(*) FROM members WHERE artist_id = ?", [id]);
  const memberCount = (mRes[0]?.values[0][0] as number) ?? 0;
  let eventCount = 0;
  try {
    const eRes = db.exec("SELECT COUNT(*) FROM events WHERE artist_id = ?", [id]);
    eventCount = (eRes[0]?.values[0][0] as number) ?? 0;
  } catch {}
  db.run("DELETE FROM artists WHERE id = ?", [id]);
  await saveDb(db);
  return { ok: true, memberCount, eventCount };
}

export function rowToMember(row: Record<string, string | null>): Member {
  let statusHistory: StatusHistoryEntry[] = [];
  try {
    if (row.status_history) statusHistory = JSON.parse(row.status_history);
  } catch {}
  return {
    id: row.id!,
    artistId: row.artist_id || undefined,
    role: "member",
    personal: {
      firstName: row.first_name!,
      lastName: row.last_name!,
      email: row.email!,
      phone: row.phone || undefined,
      country: row.country || undefined,
      address: row.address || undefined,
      dateOfBirth: row.date_of_birth || undefined,
      profilePhoto: row.profile_photo || undefined,
    },
    membership: {
      tier: row.tier as MembershipTier,
      number: row.membership_number!,
      startDate: row.start_date!,
      expirationDate: row.expiration_date!,
      status: row.status as MembershipStatus,
      notes: row.notes || undefined,
      pendingExpiresAt: row.pending_expires_at || undefined,
      dormantAt: row.dormant_at || undefined,
      statusHistory,
    },
    card: {
      id: row.card_id!,
      membershipNumber: row.membership_number!,
      theme: row.card_theme as CardTheme,
      issueDate: row.card_issue_date!,
      expirationDate: row.card_expiration_date!,
      qrCodeUrl: row.qr_code_url!,
      status: row.card_status as MembershipStatus,
    },
    credentials: {
      username: row.username!,
      passwordHash: row.password_hash!,
      temporaryPassword: row.temporary_password!,
      passwordUpdatedAt: row.password_updated_at || undefined,
    },
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

export async function createMemberRecord(member: Member): Promise<void> {
  const db = await getDb();
  db.run(
    `
    INSERT OR IGNORE INTO members (
      id, artist_id, first_name, last_name, email, phone, country, address, date_of_birth, profile_photo,
      tier, membership_number, start_date, expiration_date, status, notes,
      card_id, card_theme, card_issue_date, card_expiration_date, qr_code_url, card_status,
      username, password_hash, temporary_password, password_updated_at,
      pending_expires_at, dormant_at, status_history,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      member.id,
      member.artistId || null,
      member.personal.firstName,
      member.personal.lastName,
      member.personal.email,
      member.personal.phone || null,
      member.personal.country || null,
      member.personal.address || null,
      member.personal.dateOfBirth || null,
      member.personal.profilePhoto || null,
      member.membership.tier,
      member.membership.number,
      member.membership.startDate,
      member.membership.expirationDate,
      member.membership.status,
      member.membership.notes || null,
      member.card.id,
      member.card.theme,
      member.card.issueDate,
      member.card.expirationDate,
      member.card.qrCodeUrl,
      member.card.status,
      member.credentials.username,
      member.credentials.passwordHash,
      member.credentials.temporaryPassword,
      member.credentials.passwordUpdatedAt || null,
      member.membership.pendingExpiresAt || null,
      member.membership.dormantAt || null,
      JSON.stringify(member.membership.statusHistory || []),
      member.createdAt,
      member.updatedAt,
    ]
  );
  await saveDb(db);
}

export async function getMemberRows(): Promise<Member[]> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM members ORDER BY created_at DESC");
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const record: Record<string, string | null> = {};
    columns.forEach((col, i) => {
      record[col] = row[i] as string | null;
    });
    return rowToMember(record);
  });
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM members WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const columns = result[0].columns;
  const record: Record<string, string | null> = {};
  columns.forEach((col, i) => {
    record[col] = result[0].values[0][i] as string | null;
  });
  return rowToMember(record);
}

export async function getMemberByEmail(email: string): Promise<Member | undefined> {
  const db = await getDb();
  const result = db.exec("SELECT * FROM members WHERE email = ?", [email]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;
  const columns = result[0].columns;
  const record: Record<string, string | null> = {};
  columns.forEach((col, i) => {
    record[col] = result[0].values[0][i] as string | null;
  });
  return rowToMember(record);
}

export async function memberExistsByEmail(email: string): Promise<boolean> {
  const db = await getDb();
  const result = db.exec("SELECT 1 FROM members WHERE email = ?", [email]);
  return result.length > 0 && result[0].values.length > 0;
}

export async function updateMemberRecord(id: string, updates: Partial<Member>): Promise<Member | undefined> {
  const existing = await getMemberById(id);
  if (!existing) return undefined;
  const member: Member = {
    ...existing,
    ...updates,
    membership: { ...existing.membership, ...(updates.membership ?? {}) },
    credentials: { ...existing.credentials, ...(updates.credentials ?? {}) },
    updatedAt: new Date().toISOString(),
  };
  const db = await getDb();
  db.run(
    `
    UPDATE members SET
      first_name = ?, last_name = ?, email = ?, phone = ?, country = ?, address = ?, date_of_birth = ?, profile_photo = ?,
      tier = ?, membership_number = ?, start_date = ?, expiration_date = ?, status = ?, notes = ?,
      card_id = ?, card_theme = ?, card_issue_date = ?, card_expiration_date = ?, qr_code_url = ?, card_status = ?,
      username = ?, password_hash = ?, temporary_password = ?, password_updated_at = ?,
      pending_expires_at = ?, dormant_at = ?, status_history = ?, artist_id = ?,
      updated_at = ?
    WHERE id = ?
    `,
    [
      member.personal.firstName,
      member.personal.lastName,
      member.personal.email,
      member.personal.phone || null,
      member.personal.country || null,
      member.personal.address || null,
      member.personal.dateOfBirth || null,
      member.personal.profilePhoto || null,
      member.membership.tier,
      member.membership.number,
      member.membership.startDate,
      member.membership.expirationDate,
      member.membership.status,
      member.membership.notes || null,
      member.card.id,
      member.card.theme,
      member.card.issueDate,
      member.card.expirationDate,
      member.card.qrCodeUrl,
      member.card.status,
      member.credentials.username,
      member.credentials.passwordHash,
      member.credentials.temporaryPassword,
      member.credentials.passwordUpdatedAt || null,
      member.membership.pendingExpiresAt || null,
      member.membership.dormantAt || null,
      JSON.stringify(member.membership.statusHistory || []),
      member.artistId || null,
      member.updatedAt,
      member.id,
    ]
  );
  await saveDb(db);
  return member;
}

export async function deleteMemberRecord(id: string): Promise<boolean> {
  const db = await getDb();
  const before = db.exec("SELECT COUNT(*) as count FROM members");
  db.run("DELETE FROM members WHERE id = ?", [id]);
  const after = db.exec("SELECT COUNT(*) as count FROM members");
  await saveDb(db);
  const beforeCount = (before[0]?.values[0][0] as number) || 0;
  const afterCount = (after[0]?.values[0][0] as number) || 0;
  return afterCount < beforeCount;
}
