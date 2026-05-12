import 'dotenv/config';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// libSQL works both as a local SQLite file (DATABASE_URL=file:server/local.db)
// and against a hosted Turso database (DATABASE_URL=libsql://...; DATABASE_AUTH_TOKEN=...).
// .trim() guards against stray whitespace/newlines when these are pasted into a
// hosting dashboard — an embedded newline in the token makes the auth header invalid.
const url = (process.env.DATABASE_URL || 'file:server/local.db').trim();
const authToken = (process.env.DATABASE_AUTH_TOKEN || '').trim() || undefined;

export const db = createClient({ url, authToken });

let initPromise = null;

/** Run once on first request: create tables and seed the admin account. */
export function ready() {
  if (!initPromise) initPromise = init();
  return initPromise;
}

async function init() {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS bookings (
         id            TEXT PRIMARY KEY,
         service_id    TEXT NOT NULL,
         service_name  TEXT NOT NULL,
         barber_id     TEXT,
         barber_name   TEXT,
         date          TEXT NOT NULL,        -- YYYY-MM-DD (shop local time)
         start_min     INTEGER NOT NULL,     -- minutes from midnight
         end_min       INTEGER NOT NULL,     -- minutes from midnight (incl. buffer)
         duration_min  INTEGER NOT NULL,     -- the service duration shown to the customer
         customer_name  TEXT NOT NULL,
         customer_phone TEXT NOT NULL,
         customer_email TEXT,
         notes          TEXT,
         price          INTEGER,
         status         TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed | cancelled
         created_at     TEXT NOT NULL DEFAULT (datetime('now'))
       )`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date, status)`,
      `CREATE TABLE IF NOT EXISTS admins (
         id            TEXT PRIMARY KEY,
         username      TEXT UNIQUE NOT NULL,
         password_hash TEXT NOT NULL,
         created_at    TEXT NOT NULL DEFAULT (datetime('now'))
       )`,
    ],
    'write',
  );

  // Seed an admin from env on first run so there's always a way in.
  const { rows } = await db.execute('SELECT COUNT(*) AS n FROM admins');
  if (Number(rows[0].n) === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'changeme';
    // OR IGNORE so two concurrent cold starts don't trip the UNIQUE(username).
    await db.execute({
      sql: 'INSERT OR IGNORE INTO admins (id, username, password_hash) VALUES (?, ?, ?)',
      args: [nanoid(), username, bcrypt.hashSync(password, 10)],
    });
    // eslint-disable-next-line no-console
    console.log(`[db] Seeded admin "${username}". Change ADMIN_PASSWORD and run "npm run seed-admin" to rotate it.`);
  }
}

/** Create/replace the admin account (used by `npm run seed-admin`). */
export async function upsertAdmin(username, password) {
  await ready();
  const hash = bcrypt.hashSync(password, 10);
  const existing = await db.execute({ sql: 'SELECT id FROM admins WHERE username = ?', args: [username] });
  if (existing.rows.length) {
    await db.execute({ sql: 'UPDATE admins SET password_hash = ? WHERE username = ?', args: [hash, username] });
  } else {
    await db.execute({ sql: 'INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)', args: [nanoid(), username, hash] });
  }
}
