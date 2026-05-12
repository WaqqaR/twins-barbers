import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

import shop from '../src/config/shop.js';
import { db, ready } from './db.js';
import { signAdminToken, requireAdmin } from './auth.js';
import {
  availableSlots,
  resolveBooking,
  bookableDates,
  minToHM,
  minToLabel,
  chairMinutes,
} from './availability.js';

const app = express();
app.use(cors());

// Parse JSON bodies — but skip it when the runtime (e.g. Vercel's Node
// serverless wrapper) has already consumed the stream and populated req.body,
// which would otherwise leave express.json() hanging on an empty stream.
const jsonParser = express.json({ limit: '64kb' });
app.use((req, res, next) => {
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object') return next();
  return jsonParser(req, res, next);
});

// Make sure the DB schema exists before handling anything.
app.use(async (_req, res, next) => {
  try {
    await ready();
    next();
  } catch (err) {
    console.error('[db] init failed', err);
    res.status(500).json({ error: 'Database unavailable.' });
  }
});

const api = express.Router();
app.use('/api', api);

const ok = (s) => s === 'confirmed' || s === 'cancelled';
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

function publicService(s) {
  return { id: s.id, name: s.name, minutes: s.minutes, price: s.price, description: s.description };
}

function bookingDTO(row, { full = false } = {}) {
  const base = {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    barberId: row.barber_id,
    barberName: row.barber_name,
    date: row.date,
    startMin: row.start_min,
    endMin: row.end_min,
    durationMin: row.duration_min,
    start: minToHM(row.start_min),
    startLabel: minToLabel(row.start_min),
    endLabel: minToLabel(row.end_min),
    price: row.price,
    status: row.status,
  };
  if (full) {
    return {
      ...base,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
  // Limited view returned to the customer on their confirmation link.
  return { ...base, customerName: row.customer_name };
}

async function bookingsForDate(dateStr, conn = db) {
  const { rows } = await conn.execute({
    sql: `SELECT barber_id, start_min, end_min, status FROM bookings WHERE date = ? AND status = 'confirmed'`,
    args: [dateStr],
  });
  return rows.map((r) => ({ barber_id: r.barber_id, start_min: Number(r.start_min), end_min: Number(r.end_min), status: r.status }));
}

// ── Public endpoints ─────────────────────────────────────────────────────────

api.get('/health', (_req, res) => res.json({ ok: true }));

// Service / barber catalog + booking parameters (handy for clients; the site
// itself imports the config directly).
api.get('/config', (_req, res) => {
  res.json({
    name: shop.name,
    currency: shop.currency,
    usesBarbers: shop.usesBarbers,
    barbers: shop.barbers.map((b) => ({ id: b.id, name: b.name })),
    services: shop.services.map(publicService),
    booking: shop.booking,
    days: bookableDates(shop),
  });
});

// Available start times: /api/availability?date=YYYY-MM-DD&service=haircut&barber=marco
api.get('/availability', async (req, res) => {
  const { date, service: serviceId, barber: barberId } = req.query;
  if (!isDate(date)) return res.status(400).json({ error: 'Provide a valid ?date=YYYY-MM-DD.' });
  const service = shop.servicesById[serviceId];
  if (!service) return res.status(400).json({ error: 'Unknown ?service.' });
  if (shop.usesBarbers && barberId && barberId !== 'any' && !shop.bookableBarbers.some((b) => b.id === barberId)) {
    return res.status(400).json({ error: 'Unknown ?barber.' });
  }
  const bookings = await bookingsForDate(date);
  const slots = availableSlots(date, service, shop.usesBarbers ? barberId || 'any' : null, bookings, shop);
  res.json({
    date,
    service: publicService(service),
    chairMinutes: chairMinutes(service, shop),
    slots: slots.map((s) => ({ time: s.hm, label: s.label, min: s.min })),
  });
});

// Create a booking.
api.post('/bookings', async (req, res) => {
  const body = req.body || {};
  const service = shop.servicesById[body.serviceId];
  const date = body.date;
  const startMin = Number(body.startMin);
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const notes = String(body.notes || '').trim().slice(0, 1000);
  let barberId = shop.usesBarbers ? String(body.barberId || 'any') : null;

  if (!service) return res.status(400).json({ error: 'Please choose a service.' });
  if (!isDate(date)) return res.status(400).json({ error: 'Please choose a date.' });
  if (!Number.isInteger(startMin)) return res.status(400).json({ error: 'Please choose a time.' });
  if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
  if (phone.replace(/\D/g, '').length < 7) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'That email address looks off.' });
  if (shop.usesBarbers && barberId !== 'any' && !shop.bookableBarbers.some((b) => b.id === barberId)) {
    return res.status(400).json({ error: 'Unknown barber.' });
  }

  // Re-check availability inside a write transaction so two people can't grab
  // the same slot at once.
  const tx = await db.transaction('write');
  try {
    const bookings = await bookingsForDate(date, tx);
    const resolved = resolveBooking({ dateStr: date, service, barberId, startMin, bookings, shop });
    if (!resolved.ok) {
      await tx.rollback();
      return res.status(409).json({ error: resolved.error });
    }
    const { slot } = resolved;
    const resolvedBarber = shop.usesBarbers
      ? shop.bookableBarbers.find((b) => b.id === slot.barberId)
      : null;
    const id = nanoid();
    await tx.execute({
      sql: `INSERT INTO bookings
              (id, service_id, service_name, barber_id, barber_name, date, start_min, end_min, duration_min,
               customer_name, customer_phone, customer_email, notes, price, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'confirmed')`,
      args: [
        id, service.id, service.name,
        resolvedBarber ? resolvedBarber.id : null,
        resolvedBarber ? resolvedBarber.name : null,
        date, slot.startMin, slot.endMin, slot.durationMin,
        name, phone, email || null, notes || null, service.price ?? null,
      ],
    });
    await tx.commit();
    const { rows } = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
    res.status(201).json({ booking: bookingDTO(rows[0]) });
  } catch (err) {
    try { await tx.rollback(); } catch { /* ignore */ }
    console.error('[bookings] create failed', err);
    res.status(500).json({ error: 'Could not save the booking. Please try again.' });
  }
});

// Customer-facing single-booking lookup (the id acts as an unguessable token).
api.get('/bookings/:id', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [req.params.id] });
  if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ booking: bookingDTO(rows[0]) });
});

// Customer cancels their own booking via the confirmation link.
api.post('/bookings/:id/cancel', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [req.params.id] });
  if (!rows.length) return res.status(404).json({ error: 'Booking not found.' });
  await db.execute({ sql: `UPDATE bookings SET status = 'cancelled' WHERE id = ?`, args: [req.params.id] });
  const updated = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [req.params.id] });
  res.json({ booking: bookingDTO(updated.rows[0]) });
});

// ── Admin endpoints ──────────────────────────────────────────────────────────

api.post('/admin/login', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) return res.status(400).json({ error: 'Enter username and password.' });
  const { rows } = await db.execute({ sql: 'SELECT * FROM admins WHERE username = ?', args: [username] });
  const admin = rows[0];
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  res.json({ token: signAdminToken({ id: admin.id, username: admin.username }), username: admin.username });
});

api.get('/admin/me', requireAdmin, (req, res) => res.json({ username: req.admin.username }));

// List bookings. Optional filters: ?from=YYYY-MM-DD&to=YYYY-MM-DD&status=confirmed|cancelled|all
api.get('/admin/bookings', requireAdmin, async (req, res) => {
  const today = bookableDates(shop)[0].date;
  const from = isDate(req.query.from) ? req.query.from : today;
  const to = isDate(req.query.to) ? req.query.to : bookableDates(shop)[bookableDates(shop).length - 1].date;
  const status = req.query.status;
  const where = ['date >= ?', 'date <= ?'];
  const args = [from, to];
  if (status && status !== 'all' && ok(status)) { where.push('status = ?'); args.push(status); }
  const { rows } = await db.execute({
    sql: `SELECT * FROM bookings WHERE ${where.join(' AND ')} ORDER BY date ASC, start_min ASC`,
    args,
  });
  res.json({ from, to, bookings: rows.map((r) => bookingDTO(r, { full: true })) });
});

// Search past/future by name or phone: ?q=...
api.get('/admin/bookings/search', requireAdmin, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ bookings: [] });
  const like = `%${q}%`;
  const { rows } = await db.execute({
    sql: `SELECT * FROM bookings WHERE customer_name LIKE ? OR customer_phone LIKE ? ORDER BY date DESC, start_min DESC LIMIT 100`,
    args: [like, like],
  });
  res.json({ bookings: rows.map((r) => bookingDTO(r, { full: true })) });
});

api.patch('/admin/bookings/:id', requireAdmin, async (req, res) => {
  const status = String(req.body?.status || '');
  if (!ok(status)) return res.status(400).json({ error: 'status must be "confirmed" or "cancelled".' });
  const found = await db.execute({ sql: 'SELECT id FROM bookings WHERE id = ?', args: [req.params.id] });
  if (!found.rows.length) return res.status(404).json({ error: 'Booking not found.' });
  await db.execute({ sql: 'UPDATE bookings SET status = ? WHERE id = ?', args: [status, req.params.id] });
  const { rows } = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [req.params.id] });
  res.json({ booking: bookingDTO(rows[0], { full: true }) });
});

api.delete('/admin/bookings/:id', requireAdmin, async (req, res) => {
  await db.execute({ sql: 'DELETE FROM bookings WHERE id = ?', args: [req.params.id] });
  res.json({ ok: true });
});

// ── Fallbacks ────────────────────────────────────────────────────────────────
api.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled', err);
  res.status(500).json({ error: 'Server error.' });
});

export default app;
