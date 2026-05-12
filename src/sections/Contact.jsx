import { Link } from 'react-router-dom';
import shop from '../config/shop.js';
import SectionHeading from '../components/SectionHeading.jsx';
import { openingHoursRows, addressLines, isOpenNow } from '../lib/format.js';

export default function Contact() {
  const hours = openingHoursRows();
  const a = shop.contact.address;
  const mapsQuery = encodeURIComponent([a.line1, a.line2, a.city, a.region, a.postalCode].filter(Boolean).join(' '));
  const mapsLink = shop.contact.mapsLink || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const todayDow = new Date().getDay();
  const open = isOpenNow();

  return (
    <section id="contact" className="bg-ink py-20 text-cream sm:py-28">
      <div className="container-x">
        <SectionHeading eyebrow="Visit us" title="Find the shop" light intro="Drop in for a walk-in when we have a chair, or book ahead to lock in your time." />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Map / location card */}
          <div className="overflow-hidden rounded-3xl ring-1 ring-white/10">
            {shop.contact.mapEmbedUrl ? (
              <iframe
                title={`Map to ${shop.name}`}
                src={shop.contact.mapEmbedUrl}
                className="h-[360px] w-full lg:h-full"
                style={{ border: 0, minHeight: 360 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="relative flex h-[360px] w-full items-center justify-center bg-charcoal lg:h-full"
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 36px), repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 1px, transparent 1px 36px)' }}
                />
                <div className="relative flex flex-col items-center gap-3 text-center">
                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                  <span className="text-sm uppercase tracking-widest text-cream/70">Open in Google Maps</span>
                  <span className="text-cream/50">{addressLines().join(' · ')}</span>
                </div>
              </a>
            )}
          </div>

          {/* Details */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl bg-charcoal/70 p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">Address</h3>
              <address className="mt-2 not-italic leading-relaxed text-cream/80">
                {addressLines().map((l) => <div key={l}>{l}</div>)}
              </address>
              <a href={mapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-gold hover:text-goldsoft">Get directions →</a>
            </div>

            <div className="rounded-2xl bg-charcoal/70 p-6 ring-1 ring-white/5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">Get in touch</h3>
              <div className="mt-2 space-y-1.5 text-cream/80">
                <a href={`tel:${shop.contact.phoneHref}`} className="block hover:text-gold">{shop.contact.phone}</a>
                {shop.contact.email && <a href={`mailto:${shop.contact.email}`} className="block hover:text-gold">{shop.contact.email}</a>}
                {shop.socials?.instagram && <a href={shop.socials.instagram} target="_blank" rel="noreferrer" className="block hover:text-gold">Message us on Instagram</a>}
              </div>
              <Link to="/book" className="btn-gold mt-4 !py-2.5">Book online</Link>
            </div>

            <div className="rounded-2xl bg-charcoal/70 p-6 ring-1 ring-white/5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">Hours</h3>
                <span className={`inline-flex items-center gap-1.5 text-xs ${open ? 'text-emerald-400' : 'text-cream/40'}`}>
                  <span className={`h-2 w-2 rounded-full ${open ? 'bg-emerald-400' : 'bg-cream/30'}`} />{open ? 'Open now' : 'Closed'}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {hours.map((r) => {
                  const isToday = r.days.includes(todayDow);
                  return (
                    <li key={r.label} className={`flex justify-between gap-4 ${isToday ? 'text-cream' : 'text-cream/65'}`}>
                      <span className={isToday ? 'font-semibold' : ''}>{r.label}{isToday ? ' · today' : ''}</span>
                      <span className={r.closed ? 'text-cream/35' : ''}>{r.text}</span>
                    </li>
                  );
                })}
              </ul>
              {shop.hoursNote && <p className="mt-3 border-t border-white/10 pt-3 text-xs text-cream/55">{shop.hoursNote}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
