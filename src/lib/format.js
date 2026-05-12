import shop from '../config/shop.js';

const sym = shop.currency?.symbol ?? '$';

export function money(amount) {
  if (amount == null) return '';
  return Number.isInteger(amount) ? `${sym}${amount}` : `${sym}${Number(amount).toFixed(2)}`;
}

export function duration(mins) {
  if (mins == null) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// "YYYY-MM-DD" -> Date at local midnight (avoids timezone drift from new Date("YYYY-MM-DD")).
export function dateFromYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLong(ymdStr) {
  return dateFromYMD(ymdStr).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export function formatDateShort(ymdStr) {
  return dateFromYMD(ymdStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function timeLabel(minFromMidnight) {
  let h = Math.floor(minFromMidnight / 60);
  const m = minFromMidnight % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Turn the shop.hours config into rows for display, merging consecutive days
// that share the same hours (e.g. "Mon – Wed  9:00 AM – 6:00 PM").
export function openingHoursRows() {
  const fmt = (hm) => timeLabel(hmToMin(hm));
  const describe = (rule) => {
    if (!rule || rule.closed || !rule.intervals?.length) return 'Closed';
    return rule.intervals.map(([a, b]) => `${fmt(a)} – ${fmt(b)}`).join(', ');
  };
  const rows = [];
  for (let d = 1; d <= 7; d++) {
    const day = d % 7; // start the week on Monday, Sunday last
    const text = describe(shop.hours?.[day]);
    const prev = rows[rows.length - 1];
    if (prev && prev.text === text) { prev.endDay = day; prev.days.push(day); }
    else rows.push({ startDay: day, endDay: day, days: [day], text });
  }
  return rows.map((r) => ({
    label: r.startDay === r.endDay ? DAY_NAMES[r.startDay] : `${DAY_NAMES[r.startDay].slice(0, 3)} – ${DAY_NAMES[r.endDay].slice(0, 3)}`,
    days: r.days,
    text: r.text,
    closed: r.text === 'Closed',
  }));
}

function hmToMin(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

// Is the shop open right now (best-effort, uses the browser's clock)?
export function isOpenNow() {
  const now = new Date();
  const rule = shop.hours?.[now.getDay()];
  if (!rule || rule.closed || !rule.intervals?.length) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  return rule.intervals.some(([a, b]) => cur >= hmToMin(a) && cur < hmToMin(b));
}

export const addressLines = () => {
  const a = shop.contact.address;
  return [a.line1, a.line2, [a.city, a.region].filter(Boolean).join(', ') + (a.postalCode ? ` ${a.postalCode}` : '')].filter(Boolean);
};
export const addressOneLine = () => addressLines().join(', ');
