import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import shop from '../config/shop.js';
import { api } from '../lib/api.js';
import { formatDateLong, duration, money, addressOneLine } from '../lib/format.js';

export default function BookingConfirmation() {
  const { id } = useParams();
  const { state } = useLocation();
  const justBooked = state?.justBooked;

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getBooking(id)
      .then((res) => { if (!cancelled) setBooking(res.booking); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Booking not found.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function doCancel() {
    setCancelling(true);
    try {
      const res = await api.cancelBooking(id);
      setBooking(res.booking);
      setConfirmCancel(false);
    } catch (err) {
      setError(err.message || 'Could not cancel.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="bg-cream pt-16">
      <div className="bg-ink text-cream">
        <div className="container-x py-12 sm:py-16">
          {loading ? (
            <h1 className="text-3xl">Loading your booking…</h1>
          ) : error ? (
            <>
              <p className="eyebrow">Hmm</p>
              <h1 className="mt-2 text-4xl sm:text-5xl">We couldn't find that booking</h1>
              <p className="mt-3 text-cream/70">{error}</p>
            </>
          ) : booking?.status === 'cancelled' ? (
            <>
              <p className="eyebrow text-cream/50">Cancelled</p>
              <h1 className="mt-2 text-4xl sm:text-5xl">This booking was cancelled</h1>
              <p className="mt-3 text-cream/70">No worries — you can book a new time whenever you like.</p>
            </>
          ) : (
            <>
              <p className="eyebrow flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-ink">✓</span>
                {justBooked ? 'Booking confirmed' : 'Your booking'}
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl">You're booked in{booking?.customerName ? `, ${booking.customerName.split(' ')[0]}` : ''}.</h1>
              <p className="mt-3 text-cream/70">See you at {shop.name}. Save this page — you can come back to it any time using the link.</p>
            </>
          )}
        </div>
      </div>

      <div className="container-x py-10 lg:py-14">
        {error ? (
          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="btn-gold">Book an appointment</Link>
            <Link to="/" className="btn-ghost">Back home</Link>
          </div>
        ) : booking ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl text-ink">Appointment details</h2>
                <span className={`chip ${booking.status === 'confirmed' ? '!border-emerald-300 !text-emerald-700' : '!border-ink/15 !text-ink/45'}`}>
                  {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                </span>
              </div>
              <span className="mt-2 mb-5 block h-px w-12 bg-gold" />

              <dl className="grid gap-4 sm:grid-cols-2">
                <Item label="Service" value={`${booking.serviceName}`} sub={`${duration(booking.durationMin)}${booking.price != null ? ` · ${money(booking.price)} (pay in shop)` : ''}`} />
                {shop.usesBarbers && <Item label="Barber" value={booking.barberName || 'First available'} />}
                <Item label="Date" value={formatDateLong(booking.date)} />
                <Item label="Time" value={`${booking.startLabel}`} sub={`Ends around ${booking.endLabel}`} />
                <Item label="Name" value={booking.customerName} />
                <Item label="Reference" value={<span className="font-mono text-sm">{booking.id}</span>} />
              </dl>

              <div className="mt-6 rounded-xl bg-ink/[0.03] p-4 text-sm text-ink/65">
                <div className="font-medium text-ink">{shop.name}</div>
                <div>{addressOneLine()}</div>
                <div className="mt-1">
                  <a href={`tel:${shop.contact.phoneHref}`} className="text-gold hover:text-goldsoft">{shop.contact.phone}</a>
                  {shop.contact.mapsLink && <> · <a href={shop.contact.mapsLink} target="_blank" rel="noreferrer" className="text-gold hover:text-goldsoft">Directions</a></>}
                </div>
              </div>

              {booking.status === 'confirmed' && (
                <div className="mt-6 border-t border-ink/10 pt-5">
                  {!confirmCancel ? (
                    <button type="button" onClick={() => setConfirmCancel(true)} className="text-sm font-medium text-ink/55 underline-offset-4 hover:text-ink hover:underline">
                      Need to cancel this appointment?
                    </button>
                  ) : (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-800">Cancel this appointment? This can't be undone — you'd need to book again.</p>
                      <div className="mt-3 flex gap-3">
                        <button type="button" onClick={doCancel} disabled={cancelling} className="btn !bg-red-600 !text-white hover:!bg-red-700 !py-2 !px-4">{cancelling ? 'Cancelling…' : 'Yes, cancel it'}</button>
                        <button type="button" onClick={() => setConfirmCancel(false)} className="btn-ghost !py-2 !px-4">Keep it</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="card p-6">
                <h3 className="font-display text-xl text-ink">What's next</h3>
                <ul className="mt-3 space-y-2.5 text-sm text-ink/65">
                  <li className="flex gap-2"><Dot />Arrive a few minutes early.</li>
                  <li className="flex gap-2"><Dot />Bring a reference photo if you've got one.</li>
                  <li className="flex gap-2"><Dot />Running late or can't make it? Call us or cancel here.</li>
                </ul>
              </div>
              {booking.status === 'cancelled' && (
                <Link to="/book" className="btn-gold w-full">Book a new time</Link>
              )}
              <Link to="/" className="btn-ghost w-full">Back to home</Link>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Item({ label, value, sub }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-ink/40">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
      {sub && <dd className="text-sm text-ink/50">{sub}</dd>}
    </div>
  );
}
function Dot() {
  return <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />;
}
