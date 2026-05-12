// Pure booking-engine logic shared by the availability and bookings endpoints.
// No database access here — callers pass in the relevant rows.

/** "HH:MM" -> minutes from midnight. */
export function hmToMin(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/** minutes from midnight -> "HH:MM" (24h). */
export function minToHM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** A friendly "9:30 AM" style label. */
export function minToLabel(min) {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Today's date + current minute-of-day in the shop's timezone. */
export function nowInShop(timezone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour) % 24; // some engines emit "24" at midnight
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + Number(parts.minute),
  };
}

/** Day of week (0=Sun..6=Sat) for a "YYYY-MM-DD" string, interpreted as a calendar date. */
export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Open intervals [[startMin,endMin], ...] for a given date, or [] if closed. */
export function openIntervalsFor(dateStr, shop) {
  if (shop.closedDates?.includes(dateStr)) return [];
  const rule = shop.hours?.[weekdayOf(dateStr)];
  if (!rule || rule.closed || !rule.intervals?.length) return [];
  return rule.intervals.map(([a, b]) => [hmToMin(a), hmToMin(b)]).filter(([a, b]) => b > a);
}

/** Total chair time an appointment consumes (service duration + buffer). */
export function chairMinutes(service, shop) {
  return service.minutes + (shop.booking?.bufferMinutes || 0);
}

/** List of date strings (YYYY-MM-DD) the shop is bookable, starting today. */
export function bookableDates(shop) {
  const { date } = nowInShop(shop.timezone);
  const [y, m, d] = date.split('-').map(Number);
  const out = [];
  const maxAhead = shop.booking?.maxDaysAhead ?? 30;
  for (let i = 0; i <= maxAhead; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const ds = dt.toISOString().slice(0, 10);
    out.push({ date: ds, open: openIntervalsFor(ds, shop).length > 0 });
  }
  return out;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Compute available start times for a service on a date.
 * @param {string} dateStr  "YYYY-MM-DD"
 * @param {object} service  one of shop.services
 * @param {string|null} barberId  a barber id, 'any', or null when the shop has no barbers
 * @param {Array} bookings  rows {barber_id, start_min, end_min, status} for that date
 * @param {object} shop
 * @returns {Array<{min:number, hm:string, label:string}>}
 */
export function availableSlots(dateStr, service, barberId, bookings, shop) {
  const intervals = openIntervalsFor(dateStr, shop);
  if (!intervals.length || !service) return [];

  const slot = shop.booking?.slotMinutes || 15;
  const need = chairMinutes(service, shop);
  const { date: today, minutes: nowMin } = nowInShop(shop.timezone);
  const minLead = shop.booking?.minLeadMinutes || 0;
  const earliest = dateStr < today ? Infinity : dateStr === today ? nowMin + minLead : 0;

  const active = bookings.filter((b) => b.status === 'confirmed');

  // When the shop uses named barbers, figure out which barber(s) must be free.
  // When it doesn't, it's `chairs` interchangeable chairs.
  const usesBarbers = shop.usesBarbers;
  const chairs = Math.max(1, shop.chairCount || shop.chairs || 1);
  let candidateBarbers = null;
  if (usesBarbers) {
    candidateBarbers = !barberId || barberId === 'any'
      ? shop.bookableBarbers.map((b) => b.id) // free for at least one
      : [barberId];
  }

  const out = [];
  for (const [openStart, openEnd] of intervals) {
    // First candidate start aligned to the slot grid at/after openStart.
    let start = Math.ceil(openStart / slot) * slot;
    for (; start + need <= openEnd; start += slot) {
      if (start < earliest) continue;
      const end = start + need;
      if (usesBarbers) {
        const okBarber = candidateBarbers.find((bid) => !active.some((b) => b.barber_id === bid && overlaps(start, end, b.start_min, b.end_min)));
        if (okBarber !== undefined) out.push({ min: start, hm: minToHM(start), label: minToLabel(start), barberId: okBarber });
      } else {
        // Conservative: a free chair exists if fewer than `chairs` confirmed
        // bookings overlap the whole appointment window.
        const overlapping = active.filter((b) => overlaps(start, end, b.start_min, b.end_min)).length;
        if (overlapping < chairs) out.push({ min: start, hm: minToHM(start), label: minToLabel(start), barberId: null });
      }
    }
  }
  return out;
}

/**
 * Validate (and resolve) a booking request against current bookings.
 * Returns { ok:true, slot } or { ok:false, error }.
 */
export function resolveBooking({ dateStr, service, barberId, startMin, bookings, shop }) {
  if (!service) return { ok: false, error: 'Unknown service.' };
  if (!Number.isInteger(startMin)) return { ok: false, error: 'Invalid time.' };
  const slot = shop.booking?.slotMinutes || 15;
  if (startMin % slot !== 0) return { ok: false, error: 'Time is not on a valid slot boundary.' };

  const slots = availableSlots(dateStr, service, barberId, bookings, shop);
  const match = slots.find((s) => s.min === startMin);
  if (!match) return { ok: false, error: 'That time is no longer available. Please pick another.' };

  return {
    ok: true,
    slot: {
      startMin,
      endMin: startMin + chairMinutes(service, shop),
      durationMin: service.minutes,
      barberId: match.barberId, // resolved concrete barber when shop uses barbers
    },
  };
}
