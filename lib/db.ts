import { createClient, type Client, type ResultSet } from "@libsql/client";
import initSqlJs from "sql.js";
import fs from "fs/promises";
import path from "path";
import { type Member, type AdminUser, type Artist, type ArtistStatus, type MembershipTier, type MembershipStatus, type CardTheme, type StatusHistoryEntry } from "./data";

// ─── Configuration ────────────────────────────────────────────────────────────

function getDataDir(): string {
  if (process.env.FLY_VOLUME_PATH) return process.env.FLY_VOLUME_PATH;
  if (process.env.RENDER_DISK_PATH) return process.env.RENDER_DISK_PATH;
  return path.join(process.cwd(), "data");
}

const DB_DIR = getDataDir();
const DB_PATH = path.join(DB_DIR, "vip-platform.db");

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

// ─── Global state ─────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __vip_sql: import("sql.js").SqlJsStatic | undefined;
  // eslint-disable-next-line no-var
  var __vip_db: import("sql.js").Database | undefined;
  // eslint-disable-next-line no-var
  var __vip_db_mtime: number;
  // eslint-disable-next-line no-var
  var __vip_turso: Client | undefined;
}

// ─── sql.js local fallback (used for local development) ───────────────────────

async function getSql(): Promise<import("sql.js").SqlJsStatic> {
  if (globalThis.__vip_sql) return globalThis.__vip_sql;
  const wasmPath = process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "public", "sql-wasm.wasm")
    : path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
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
  try { db.run("ALTER TABLE members ADD COLUMN pending_expires_at TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN dormant_at TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN status_history TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN artist_id TEXT"); } catch {}
  try { db.run("ALTER TABLE members ADD COLUMN password_updated_at TEXT"); } catch {}
  try { db.run("ALTER TABLE artists ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0"); } catch {}
  try { db.run("ALTER TABLE artists ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0"); } catch {}
}

async function initLocalDb(): Promise<import("sql.js").Database> {
  const SQL = await getSql();
  let db: import("sql.js").Database;
  let needsPersist = false;

  await fs.mkdir(DB_DIR, { recursive: true });

  try {
    const fileBuffer = await fs.readFile(DB_PATH);
    if (fileBuffer.length === 0) throw new Error("Empty file");
    db = new SQL.Database(fileBuffer);

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
    db = new SQL.Database();
    needsPersist = true;
  }

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

  if (!hasMigrations) needsPersist = true;
  if (needsPersist) await persistLocalDb(db);

  return db;
}

async function persistLocalDb(db: import("sql.js").Database): Promise<void> {
  const data = db.export();
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, Buffer.from(data));
}

async function getLocalDb(): Promise<import("sql.js").Database> {
  try {
    const stat = await fs.stat(DB_PATH);
    const mtime = stat.mtimeMs;
    if (globalThis.__vip_db && globalThis.__vip_db_mtime === mtime) {
      return globalThis.__vip_db;
    }
    globalThis.__vip_db = await initLocalDb();
    const stat2 = await fs.stat(DB_PATH);
    globalThis.__vip_db_mtime = stat2.mtimeMs;
    return globalThis.__vip_db;
  } catch {
    globalThis.__vip_db = await initLocalDb();
    try {
      const stat2 = await fs.stat(DB_PATH);
      globalThis.__vip_db_mtime = stat2.mtimeMs;
    } catch {}
    return globalThis.__vip_db;
  }
}

// ─── Turso / libSQL client ──────────────────────────────────────────────────────

function getTursoClient(): Client {
  if (!globalThis.__vip_turso) {
    if (!TURSO_URL) throw new Error("TURSO_DATABASE_URL is not set");
    globalThis.__vip_turso = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return globalThis.__vip_turso;
}

function isTurso(): boolean {
  return Boolean(TURSO_URL);
}

let tursoSchemaEnsured = false;
let tursoSchemaPromise: Promise<void> | null = null;

async function ensureTursoSchema(): Promise<void> {
  if (tursoSchemaEnsured || !isTurso()) return;
  if (tursoSchemaPromise) {
    await tursoSchemaPromise;
    return;
  }
  tursoSchemaPromise = (async () => {
    try {
      const client = getTursoClient();
      const statements = [
        `CREATE TABLE IF NOT EXISTS admin (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);`,
        `CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT, country TEXT, address TEXT, date_of_birth TEXT, profile_photo TEXT, tier TEXT NOT NULL, membership_number TEXT NOT NULL UNIQUE, start_date TEXT NOT NULL, expiration_date TEXT NOT NULL, status TEXT NOT NULL, notes TEXT, card_id TEXT NOT NULL, card_theme TEXT NOT NULL, card_issue_date TEXT NOT NULL, card_expiration_date TEXT NOT NULL, qr_code_url TEXT NOT NULL, card_status TEXT NOT NULL, username TEXT NOT NULL, password_hash TEXT NOT NULL, temporary_password TEXT NOT NULL, pending_expires_at TEXT, dormant_at TEXT, status_history TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`,
        `CREATE TABLE IF NOT EXISTS artists (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, logo_url TEXT, banner_url TEXT, description TEXT, contact_email TEXT, primary_color TEXT, status TEXT NOT NULL DEFAULT 'active', is_active INTEGER NOT NULL DEFAULT 0, is_archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`,
        `ALTER TABLE members ADD COLUMN pending_expires_at TEXT;`,
        `ALTER TABLE members ADD COLUMN dormant_at TEXT;`,
        `ALTER TABLE members ADD COLUMN status_history TEXT;`,
        `ALTER TABLE members ADD COLUMN artist_id TEXT;`,
        `ALTER TABLE members ADD COLUMN password_updated_at TEXT;`,
        `ALTER TABLE artists ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0;`,
        `ALTER TABLE artists ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;`,
      ];
      for (const sql of statements) {
        try { await client.execute({ sql, args: [] }); } catch {}
      }
      tursoSchemaEnsured = true;
    } catch (err) {
      console.error("[db] Failed to ensure Turso schema:", err);
    } finally {
      tursoSchemaPromise = null;
    }
  })();
  await tursoSchemaPromise;
}

// ─── Query helpers ────────────────────────────────────────────────────────────

function resultSetToRecordArray(rs: ResultSet): Record<string, string | null>[] {
  return rs.rows.map((row) => {
    const record: Record<string, string | null> = {};
    for (const col of rs.columns) {
      const value = (row as Record<string, unknown>)[col];
      record[col] = value === null || value === undefined ? null : String(value);
    }
    return record;
  });
}

export async function queryAll(sql: string, args: (string | number | null)[] = []): Promise<Record<string, string | null>[]> {
  if (isTurso()) {
    await ensureTursoSchema();
    const rs = await getTursoClient().execute({ sql, args });
    return resultSetToRecordArray(rs);
  }
  const db = await getLocalDb();
  const result = db.exec(sql, args);
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row) => {
    const record: Record<string, string | null> = {};
    columns.forEach((col, i) => {
      const value = row[i];
      record[col] = value === null || value === undefined ? null : String(value);
    });
    return record;
  });
}

export async function querySingle(sql: string, args: (string | number | null)[] = []): Promise<Record<string, string | null> | undefined> {
  const rows = await queryAll(sql, args);
  return rows[0];
}

export async function run(sql: string, args: (string | number | null)[] = []): Promise<void> {
  if (isTurso()) {
    await ensureTursoSchema();
    await getTursoClient().execute({ sql, args });
    return;
  }
  const db = await getLocalDb();
  db.run(sql, args);
  await persistLocalDb(db);
}

// ─── Public API (kept identical to the previous sql.js version) ─────────────────

export async function seedAdmin(admin: AdminUser): Promise<void> {
  const existing = await querySingle("SELECT id FROM admin WHERE id = ?", [admin.id]);
  if (existing) return;
  await run(
    "INSERT INTO admin (id, email, password_hash) VALUES (?, ?, ?)",
    [admin.id, admin.email, admin.passwordHash]
  );
}

export async function getAdminByEmail(email: string): Promise<AdminUser | undefined> {
  const row = await querySingle("SELECT id, email, password_hash FROM admin WHERE email = ?", [email]);
  if (!row) return undefined;
  return { id: row.id!, email: row.email!, passwordHash: row.password_hash!, role: "admin" };
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
    isActive: row.is_active === "1" || (row.is_active as unknown) === 1 || row.is_active === "true",
    isArchived: row.is_archived === "1" || (row.is_archived as unknown) === 1 || row.is_archived === "true",
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

export async function getArtistRows(): Promise<Artist[]> {
  const rows = await queryAll("SELECT * FROM artists ORDER BY name ASC");
  return rows.map(rowToArtist);
}

export async function getArtistById(id: string): Promise<Artist | undefined> {
  const row = await querySingle("SELECT * FROM artists WHERE id = ?", [id]);
  if (!row) return undefined;
  return rowToArtist(row);
}

export async function createArtistRecord(artist: Artist): Promise<void> {
  const count = await querySingle("SELECT COUNT(*) as count FROM artists");
  const isFirst = (count?.count as string) === "0";
  await run(
    `INSERT OR IGNORE INTO artists (id, name, slug, logo_url, banner_url, description, contact_email, primary_color, status, is_active, is_archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [artist.id, artist.name, artist.slug, artist.logoUrl || null, artist.bannerUrl || null,
     artist.description || null, artist.contactEmail || null, artist.primaryColor || null,
     artist.status, isFirst ? 1 : (artist.isActive ? 1 : 0), artist.isArchived ? 1 : 0,
     artist.createdAt, artist.updatedAt]
  );
}

export async function updateArtistRecord(id: string, updates: Partial<Artist>): Promise<Artist | undefined> {
  const existing = await getArtistById(id);
  if (!existing) return undefined;
  const artist: Artist = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await run(
    `UPDATE artists SET name=?, slug=?, logo_url=?, banner_url=?, description=?, contact_email=?, primary_color=?, status=?, is_active=?, is_archived=?, updated_at=? WHERE id=?`,
    [artist.name, artist.slug, artist.logoUrl || null, artist.bannerUrl || null,
     artist.description || null, artist.contactEmail || null, artist.primaryColor || null,
     artist.status, artist.isActive ? 1 : 0, artist.isArchived ? 1 : 0,
     artist.updatedAt, artist.id]
  );
  return artist;
}

export async function setArtistActiveRecord(id: string): Promise<Artist | undefined> {
  const existing = await getArtistById(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  await run("UPDATE artists SET is_active = 0, updated_at = ? WHERE is_active = 1", [now]);
  await run("UPDATE artists SET is_active = 1, is_archived = 0, status = 'active', updated_at = ? WHERE id = ?", [now, id]);
  return getArtistById(id);
}

export async function getActiveArtistRecord(): Promise<Artist | undefined> {
  const row = await querySingle("SELECT * FROM artists WHERE is_active = 1 LIMIT 1");
  if (!row) return undefined;
  return rowToArtist(row);
}

export async function deleteArtistRecord(id: string): Promise<{ ok: boolean; memberCount: number; eventCount: number }> {
  const mRes = await querySingle("SELECT COUNT(*) as count FROM members WHERE artist_id = ?", [id]);
  const memberCount = parseInt(mRes?.count || "0", 10);
  let eventCount = 0;
  try {
    const eRes = await querySingle("SELECT COUNT(*) as count FROM events WHERE artist_id = ?", [id]);
    eventCount = parseInt(eRes?.count || "0", 10);
  } catch {}
  await run("DELETE FROM artists WHERE id = ?", [id]);
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
  await run(
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
}

export async function getMemberRows(): Promise<Member[]> {
  const rows = await queryAll("SELECT * FROM members ORDER BY created_at DESC");
  return rows.map(rowToMember);
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  const row = await querySingle("SELECT * FROM members WHERE id = ?", [id]);
  if (!row) return undefined;
  return rowToMember(row);
}

export async function getMemberByEmail(email: string): Promise<Member | undefined> {
  const row = await querySingle("SELECT * FROM members WHERE email = ?", [email]);
  if (!row) return undefined;
  return rowToMember(row);
}

export async function memberExistsByEmail(email: string): Promise<boolean> {
  const row = await querySingle("SELECT 1 as ok FROM members WHERE email = ?", [email]);
  return Boolean(row);
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
  await run(
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
  return member;
}

export async function deleteMemberRecord(id: string): Promise<boolean> {
  const before = await querySingle("SELECT COUNT(*) as count FROM members");
  await run("DELETE FROM members WHERE id = ?", [id]);
  const after = await querySingle("SELECT COUNT(*) as count FROM members");
  const beforeCount = parseInt(before?.count || "0", 10);
  const afterCount = parseInt(after?.count || "0", 10);
  return afterCount < beforeCount;
}

export async function saveDb(_db?: import("sql.js").Database): Promise<void> {
  if (!isTurso()) {
    const db = _db || globalThis.__vip_db;
    if (db) await persistLocalDb(db);
  }
}

export async function getDb(): Promise<import("sql.js").Database | Client> {
  if (isTurso()) return getTursoClient();
  return getLocalDb();
}
