import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import shop from '../config/shop.js';
import { api, getAdminToken, setAdminToken } from '../lib/api.js';
import { formatDateLong, formatDateShort, duration, money, ymd } from '../lib/format.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [from, setFrom] = useState(ymd(today));
  const [to, setTo] = useState(ymd(addDays(today, 30)));
  const [status, setStatus] = useState('confirmed');
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  // Auth gate
  useEffect(() => {
    if (!getAdminToken()) { navigate('/admin', { replace: true }); return; }
    api.adminMe()
      .then((res) => { setMe(res.username); setAuthChecked(true); })
      .catch(() => { setAdminToken(null); navigate('/admin', { replace: true }); });
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (searchMode && query.trim().length >= 2) {
        const res = await api.adminSearch(query.trim());
        setRows(res.bookings);
      } else {
        const res = await api.adminBookings({ from, to, status });
        setRows(res.bookings);
      }
    } catch (err) {
      if (err.status === 401) { setAdminToken(null); navigate('/admin', { replace: true }); return; }
      setError(err.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, [from, to, status, searchMode, query, navigate]);

  useEffect(() => { if (authChecked) load(); }, [authChecked, load]);

  function logout() {
    setAdminToken(null);
    navigate('/admin', { replace: true });
  }

  async function setBookingStatus(id, next) {
    setActingId(id);
    try {
      const res = await api.adminUpdateBooking(id, next);
      setRows((rs) => rs.map((r) => (r.id === id ? res.booking : r)));
    } catch (err) {
      alert(err.message || 'Update failed.');
    } finally {
      setActingId(null);
    }
  }
  async function remove(id) {
    if (!confirm('Permanently delete this booking? This cannot be undone.')) return;
    setActingId(id);
    try {
      await api.adminDeleteBooking(id);
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message || 'Delete failed.');
    } finally {
      setActingId(null);
    }
  }

  // Group rows by date.
  const groups = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date).push(r);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, items]) => ({
      date,
      items: items.slice().sort((a, b) => a.startMin - b.startMin),
    }));
  }, [rows]);

  const stats = useMemo(() => {
    const t = ymd(today);
    const confirmed = rows.filter((r) => r.status === 'confirmed');
    return {
      total: rows.length,
      confirmed: confirmed.length,
      todayCount: confirmed.filter((r) => r.date === t).length,
      revenue: confirmed.reduce((sum, r) => sum + (r.price || 0), 0),
    };
  }, [rows, today]);

  if (!authChecked) {
    return <div className="grid min-h-screen place-items-center bg-cream text-ink/50">Loading dashboard…</div>;
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ink text-cream">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl tracking-wider">{shop.shortName}</span>
            <span className="hidden text-xs uppercase tracking-[0.3em] text-gold sm:inline">Bookings</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-cream/60 sm:inline">Signed in as <span className="text-cream">{me}</span></span>
            <Link to="/" className="text-cream/70 hover:text-gold">View site ↗</Link>
            <button onClick={logout} className="rounded-lg border border-cream/20 px-3 py-1.5 hover:bg-cream/10">Log out</button>
          </div>
        </div>
      </header>

      <main className="container-x py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Showing" value={stats.total} hint={searchMode ? 'search results' : 'in range'} />
          <Stat label="Confirmed" value={stats.confirmed} />
          <Stat label="Today" value={stats.todayCount} hint="confirmed" />
          <Stat label="Est. revenue" value={money(stats.revenue)} hint="confirmed in view" />
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-ink/45">From</label>
                <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setSearchMode(false); }} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-ink/45">To</label>
                <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setSearchMode(false); }} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-widest text-ink/45">Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setSearchMode(false); }} className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFrom(ymd(today)); setTo(ymd(addDays(today, 30))); setStatus('confirmed'); setSearchMode(false); setQuery(''); }} className="btn-ghost !py-2 !px-3 text-xs">Upcoming</button>
              <button onClick={() => { setFrom(ymd(today)); setTo(ymd(today)); setStatus('confirmed'); setSearchMode(false); }} className="btn-ghost !py-2 !px-3 text-xs">Today</button>
              <button onClick={() => { setFrom(ymd(addDays(today, -30))); setTo(ymd(today)); setStatus('all'); setSearchMode(false); }} className="btn-ghost !py-2 !px-3 text-xs">Past 30d</button>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); if (query.trim().length >= 2) { setSearchMode(true); } else { setSearchMode(false); } load(); }}
              className="ml-auto flex items-end gap-2"
            >
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-ink/45">Find by name / phone</label>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Devon or 555…" className="w-48 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="btn-dark !py-2 !px-4 text-xs">Search</button>
              {searchMode && <button type="button" onClick={() => { setSearchMode(false); setQuery(''); }} className="btn-ghost !py-2 !px-3 text-xs">Clear</button>}
            </form>
          </div>
        </div>

        {/* List */}
        <div className="mt-6">
          {loading ? (
            <p className="py-12 text-center text-ink/50">Loading…</p>
          ) : error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error} <button onClick={load} className="ml-2 underline">Retry</button></div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white py-16 text-center text-ink/50">
              {searchMode ? 'No bookings match that search.' : 'No bookings in this range.'}
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map((g) => (
                <section key={g.date}>
                  <div className="mb-2 flex items-baseline gap-3">
                    <h2 className="font-display text-xl text-ink">{formatDateLong(g.date)}</h2>
                    <span className="text-sm text-ink/45">{g.items.length} appointment{g.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-widest text-ink/45">
                        <tr>
                          <th className="px-4 py-2.5">Time</th>
                          <th className="px-4 py-2.5">Service</th>
                          {shop.usesBarbers && <th className="px-4 py-2.5">Barber</th>}
                          <th className="px-4 py-2.5">Customer</th>
                          <th className="px-4 py-2.5">Notes</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/[0.07]">
                        {g.items.map((b) => {
                          const cancelled = b.status === 'cancelled';
                          return (
                            <tr key={b.id} className={cancelled ? 'bg-ink/[0.02] text-ink/40' : ''}>
                              <td className="whitespace-nowrap px-4 py-3 font-medium">
                                {b.startLabel}
                                <div className="text-xs font-normal text-ink/40">–{b.endLabel}</div>
                              </td>
                              <td className="px-4 py-3">
                                {b.serviceName}
                                <div className="text-xs text-ink/45">{duration(b.durationMin)}{b.price != null ? ` · ${money(b.price)}` : ''}</div>
                              </td>
                              {shop.usesBarbers && <td className="px-4 py-3">{b.barberName || <span className="text-ink/40">Any</span>}</td>}
                              <td className="px-4 py-3">
                                <div className="font-medium text-ink/90">{b.customerName}</div>
                                <a href={`tel:${b.customerPhone}`} className="text-xs text-ink/55 hover:text-gold">{b.customerPhone}</a>
                                {b.customerEmail && <div className="text-xs text-ink/45">{b.customerEmail}</div>}
                              </td>
                              <td className="max-w-[14rem] px-4 py-3 text-ink/60">{b.notes || <span className="text-ink/25">—</span>}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cancelled ? 'bg-ink/10 text-ink/45' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {cancelled ? 'Cancelled' : 'Confirmed'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {cancelled ? (
                                    <button disabled={actingId === b.id} onClick={() => setBookingStatus(b.id, 'confirmed')} className="rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Restore</button>
                                  ) : (
                                    <button disabled={actingId === b.id} onClick={() => setBookingStatus(b.id, 'cancelled')} className="rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">Cancel</button>
                                  )}
                                  <button disabled={actingId === b.id} onClick={() => remove(b.id)} className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-ink/35">
          {shop.name} · admin · {searchMode ? 'search' : `${formatDateShort(from)} – ${formatDateShort(to)}`}
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="text-xs uppercase tracking-widest text-ink/45">{label}</div>
      <div className="mt-1 font-display text-3xl text-ink">{value}</div>
      {hint && <div className="text-xs text-ink/40">{hint}</div>}
    </div>
  );
}
