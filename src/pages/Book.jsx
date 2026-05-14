import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import shop from '../config/shop.js';
import { api, ApiError } from '../lib/api.js';
import { money, duration, ymd, dateFromYMD, formatDateLong } from '../lib/format.js';
import Img from '../components/Img.jsx';

const SLOT_MIN_LEAD_DAYS = 0;
const usesBarbers = shop.usesBarbers;

// Build the list of bookable dates from the config (server is the source of
// truth for *slot* availability; closed days come straight from the config).
function buildDays() {
  const maxAhead = shop.booking?.maxDaysAhead ?? 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = SLOT_MIN_LEAD_DAYS; i <= maxAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const ds = ymd(d);
    const rule = shop.hours?.[d.getDay()];
    const closed = !rule || rule.closed || !rule.intervals?.length || (shop.closedDates || []).includes(ds);
    out.push({ ds, date: d, closed, isToday: i === 0 });
  }
  return out;
}

const STEPS = [
  { key: 'service', label: 'Service' },
  ...(usesBarbers ? [{ key: 'barber', label: 'Barber' }] : []),
  { key: 'datetime', label: 'Date & time' },
  { key: 'details', label: 'Your details' },
];

export default function Book() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const days = useMemo(buildDays, []);

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(params.get('service') && shop.servicesById[params.get('service')] ? params.get('service') : '');
  const [barberId, setBarberId] = useState(() => {
    const q = params.get('barber');
    if (!usesBarbers) return null;
    if (q && (q === 'any' || shop.bookableBarbers.some((b) => b.id === q))) return q;
    return 'any';
  });
  const [dateStr, setDateStr] = useState('');
  const [slotMin, setSlotMin] = useState(null);

  const [slots, setSlots] = useState(null); // null = not loaded, [] = none
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const service = serviceId ? shop.servicesById[serviceId] : null;
  const barber = usesBarbers ? shop.barbers.find((b) => b.id === barberId) : null;

  // If a service was pre-selected via the URL, skip the service step.
  useEffect(() => {
    if (serviceId) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch slots whenever service / barber / date is settled.
  useEffect(() => {
    if (!service || !dateStr) { setSlots(null); return; }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError('');
    setSlots(null);
    api.availability({ date: dateStr, service: service.id, barber: usesBarbers ? barberId : undefined })
      .then((res) => { if (!cancelled) setSlots(res.slots || []); })
      .catch((err) => { if (!cancelled) setSlotsError(err.message || 'Could not load times.'); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [service, barberId, dateStr]);

  const currentKey = STEPS[step]?.key;
  const canNext =
    (currentKey === 'service' && !!service) ||
    (currentKey === 'barber' && !!barberId) ||
    (currentKey === 'datetime' && !!dateStr && slotMin != null) ||
    (currentKey === 'details');

  const goTo = (i) => { setStep(Math.max(0, Math.min(STEPS.length - 1, i))); setSubmitError(''); };

  function pickService(id) {
    setServiceId(id);
    setSlotMin(null);
    setSlots(null);
    goTo(step + 1);
  }
  function pickBarber(id) {
    setBarberId(id);
    setSlotMin(null);
    setSlots(null);
    goTo(step + 1);
  }
  function pickDate(ds) {
    setDateStr(ds);
    setSlotMin(null);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitError('');
    const name = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (name.length < 2) return setSubmitError('Please enter your name.');
    if (phone.replace(/\D/g, '').length < 7) return setSubmitError('Please enter a valid phone number.');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setSubmitError('That email address looks off.');
    setSubmitting(true);
    try {
      const { booking } = await api.createBooking({
        serviceId: service.id,
        barberId: usesBarbers ? barberId : undefined,
        date: dateStr,
        startMin: slotMin,
        name, phone, email, notes: form.notes.trim(),
      });
      navigate(`/booking/${booking.id}`, { state: { justBooked: true } });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      // If the slot was taken in the meantime, bounce back to time selection.
      if (err instanceof ApiError && err.status === 409) { setSlotMin(null); setSlots(null); goTo(STEPS.findIndex((s) => s.key === 'datetime')); }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-cream pt-16">
      {/* Header band */}
      <div className="bg-ink text-cream">
        <div className="container-x py-12 sm:py-16">
          <p className="eyebrow flex items-center gap-3"><span className="h-px w-8 bg-gold/60" />Book online</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Reserve your chair</h1>
          <p className="mt-3 max-w-xl text-cream/70">Takes about a minute. You'll get a confirmation page you can save or use to cancel.</p>
        </div>
      </div>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_320px] lg:py-14">
        {/* Main column */}
        <div>
          {/* Stepper */}
          <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => i < step && goTo(i)}
                  disabled={i > step}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition ${
                    i === step ? 'bg-ink text-cream' : i < step ? 'bg-white text-ink ring-1 ring-ink/15 hover:ring-gold' : 'text-ink/35'
                  }`}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-xs font-bold ${i === step ? 'bg-gold text-ink' : i < step ? 'bg-gold/20 text-gold' : 'bg-ink/10'}`}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <span className="text-ink/20">—</span>}
              </li>
            ))}
          </ol>

          {/* Step: Service */}
          {currentKey === 'service' && (
            <div className="space-y-8">
              {shop.serviceCategories.map((cat) => (
                <div key={cat.name}>
                  <h2 className="mb-3 text-xl text-ink">{cat.name}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {cat.services.map((s) => {
                      const selected = serviceId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => pickService(s.id)}
                          className={`group flex items-start justify-between gap-4 rounded-2xl border bg-white p-4 text-left transition ${
                            selected ? 'border-gold ring-2 ring-gold/30' : 'border-ink/10 hover:border-ink/25'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block font-semibold text-ink">{s.name}</span>
                            {s.description && <span className="mt-0.5 block text-sm text-ink/55">{s.description}</span>}
                            <span className="mt-1.5 block text-xs uppercase tracking-widest text-ink/40">{duration(s.minutes)}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="font-display text-xl text-gold">{money(s.price)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step: Barber */}
          {currentKey === 'barber' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shop.barbers.map((b) => {
                const selected = barberId === b.id;
                const anyOne = b.id === 'any';
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => pickBarber(b.id)}
                    className={`overflow-hidden rounded-2xl border bg-white text-left transition ${selected ? 'border-gold ring-2 ring-gold/30' : 'border-ink/10 hover:border-ink/25'}`}
                  >
                    {anyOne ? (
                      <div className="flex aspect-[5/3] items-center justify-center bg-ink/5">
                        <svg viewBox="0 0 24 24" className="h-10 w-10 text-ink/30" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 20a7 7 0 0 1 14 0M21 20a7 7 0 0 0-9-6.7M14 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm6 0a3 3 0 1 1-4.5-2.6" /></svg>
                      </div>
                    ) : (
                      <Img src={b.photo} alt={b.name} label={b.name} className="aspect-[5/3] w-full" imgClassName="aspect-[5/3] w-full object-cover" />
                    )}
                    <div className="p-4">
                      <div className="font-semibold text-ink">{b.name}</div>
                      <div className="mt-0.5 text-sm text-ink/55">{anyOne ? 'First available barber' : (b.bio || 'Barber')}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step: Date & time */}
          {currentKey === 'datetime' && (
            <div className="space-y-7">
              <div>
                <h2 className="mb-3 text-xl text-ink">Pick a day</h2>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
                  {days.slice(0, 28).map((d) => {
                    const selected = dateStr === d.ds;
                    return (
                      <button
                        key={d.ds}
                        type="button"
                        disabled={d.closed}
                        onClick={() => pickDate(d.ds)}
                        className={`flex min-w-0 flex-col items-center rounded-xl border px-1.5 py-2 text-center transition sm:px-3 sm:py-2.5 ${
                          d.closed
                            ? 'cursor-not-allowed border-ink/5 bg-ink/[0.03] text-ink/25'
                            : selected
                              ? 'border-gold bg-ink text-cream ring-2 ring-gold/30'
                              : 'border-ink/10 bg-white text-ink hover:border-ink/25'
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-widest sm:text-[11px]">{d.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <span className="font-display text-xl leading-tight sm:text-2xl">{d.date.getDate()}</span>
                        <span className="text-[10px] text-current/70 sm:text-[11px]">{d.isToday ? 'Today' : d.date.toLocaleDateString(undefined, { month: 'short' })}</span>
                        {d.closed && <span className="mt-0.5 text-[10px] uppercase">Closed</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {dateStr && (
                <div>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="text-xl text-ink">Pick a time</h2>
                    <span className="text-sm text-ink/50">{formatDateLong(dateStr)}{usesBarbers ? ` · ${barber?.name}` : ''}</span>
                  </div>
                  {slotsLoading && <p className="text-ink/50">Loading available times…</p>}
                  {slotsError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{slotsError}</p>}
                  {!slotsLoading && !slotsError && slots && slots.length === 0 && (
                    <div className="rounded-xl border border-ink/10 bg-white p-5 text-sm text-ink/60">
                      No openings on this day{usesBarbers && barberId !== 'any' ? ` for ${barber?.name}` : ''}. Try another date{usesBarbers && barberId !== 'any' ? ' or pick "No preference"' : ''}.
                    </div>
                  )}
                  {!slotsLoading && !slotsError && slots && slots.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 md:grid-cols-6">
                      {slots.map((s) => (
                        <button
                          key={s.min}
                          type="button"
                          onClick={() => setSlotMin(s.min)}
                          className={`min-w-0 rounded-lg border px-1 py-2 text-xs font-medium transition sm:px-2 sm:py-2.5 sm:text-sm ${
                            slotMin === s.min ? 'border-gold bg-ink text-cream ring-2 ring-gold/30' : 'border-ink/10 bg-white text-ink hover:border-ink/25'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step: Details */}
          {currentKey === 'details' && (
            <form onSubmit={submit} className="max-w-lg space-y-4">
              <div>
                <label className="label" htmlFor="name">Full name *</label>
                <input id="name" className="field" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="phone">Phone *</label>
                  <input id="phone" className="field" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div>
                  <label className="label" htmlFor="email">Email <span className="text-ink/40">(optional)</span></label>
                  <input id="email" type="email" className="field" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="notes">Anything we should know? <span className="text-ink/40">(optional)</span></label>
                <textarea id="notes" rows={3} className="field resize-none" placeholder="e.g. shorter on the sides than last time" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              {submitError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>}
              <button type="submit" className="btn-gold w-full" disabled={submitting}>
                {submitting ? 'Confirming…' : 'Confirm booking'}
              </button>
              <p className="text-center text-xs text-ink/45">By booking you agree to show up on time — or let us know if plans change. No payment is taken online.</p>
            </form>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0} className="btn-ghost disabled:opacity-30">← Back</button>
            {currentKey !== 'details' && (
              <button type="button" onClick={() => goTo(step + 1)} disabled={!canNext} className="btn-dark">
                Continue →
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h3 className="font-display text-2xl text-ink">Your booking</h3>
            <span className="mt-1 mb-4 block h-px w-12 bg-gold" />
            <dl className="space-y-3 text-sm">
              <Row label="Shop" value={shop.name} />
              <Row label="Service" value={service ? `${service.name} · ${duration(service.minutes)}` : '—'} muted={!service} />
              {usesBarbers && <Row label="Barber" value={barber ? barber.name : '—'} muted={!barber} />}
              <Row label="Date" value={dateStr ? formatDateLong(dateStr) : '—'} muted={!dateStr} />
              <Row label="Time" value={slotMin != null ? (slots?.find((s) => s.min === slotMin)?.label || `${Math.floor(slotMin / 60)}:${String(slotMin % 60).padStart(2, '0')}`) : '—'} muted={slotMin == null} />
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
              <span className="text-sm uppercase tracking-widest text-ink/50">Estimated total</span>
              <span className="font-display text-2xl text-ink">{service ? money(service.price) : '—'}</span>
            </div>
            <p className="mt-3 text-xs text-ink/45">Pay in shop — cash or card.</p>
          </div>
          <div className="mt-4 rounded-2xl bg-ink/5 p-5 text-sm text-ink/60">
            Prefer to talk to someone? Call <a className="font-medium text-ink hover:text-gold" href={`tel:${shop.contact.phoneHref}`}>{shop.contact.phone}</a>.
            <div className="mt-3"><Link to="/" className="text-gold hover:text-goldsoft">← Back to home</Link></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50">{label}</dt>
      <dd className={`text-right font-medium ${muted ? 'text-ink/30' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}
