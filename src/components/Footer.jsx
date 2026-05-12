import { Link } from 'react-router-dom';
import shop from '../config/shop.js';
import { openingHoursRows, addressLines } from '../lib/format.js';
import Img from './Img.jsx';

const SOCIAL_ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.42.4.68.8.9 1.4.17.4.36 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2-.22.6-.48 1-.9 1.4-.4.42-.8.68-1.4.9-.4.17-1 .36-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.42-.6-.22-1-.48-1.4-.9-.42-.4-.68-.8-.9-1.4-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.22-.6.48-1 .9-1.4.4-.42.8-.68 1.4-.9.4-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.43-1.3.83-.4.4-.63.8-.83 1.3-.16.4-.35 1-.4 2.1C2.6 9.7 2.6 10.1 2.6 12s0 2.3.07 3.5c.05 1.1.24 1.7.4 2.1.2.5.43.9.83 1.3.4.4.8.63 1.3.83.4.16 1 .35 2.1.4 1.2.07 1.6.07 4.7.07s3.5 0 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.43 1.3-.83.4-.4.63-.8.83-1.3.16-.4.35-1 .4-2.1.07-1.2.07-1.6.07-3.5s0-2.3-.07-3.5c-.05-1.1-.24-1.7-.4-2.1-.2-.5-.43-.9-.83-1.3-.4-.4-.8-.63-1.3-.83-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-2.9a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" /></svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" /></svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M21 8.3a6.8 6.8 0 0 1-4.2-1.4v7.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.06v2.9a2.9 2.9 0 1 0 2 2.74V2h2.9a4 4 0 0 0 .06.74 4 4 0 0 0 3.94 3.45V8.3Z" /></svg>
  ),
};

export default function Footer() {
  const hours = openingHoursRows();
  const socials = Object.entries(shop.socials).filter(([, url]) => url);
  const a = shop.contact.address;
  const mapsQuery = encodeURIComponent([a.line1, a.line2, a.city, a.region, a.postalCode].filter(Boolean).join(' '));
  const mapsLink = shop.contact.mapsLink || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <footer className="bg-ink text-cream/80">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          {shop.images?.emblem ? (
            <Img src={shop.images.emblem} alt={shop.name} label={shop.name} className="h-28 w-28 rounded-xl" imgClassName="h-28 w-28 rounded-xl object-cover" />
          ) : (
            <>
              <div className="font-display text-2xl tracking-wider text-cream">{shop.name}</div>
              {shop.tagline && <p className="mt-2 text-sm text-cream/60">{shop.tagline}</p>}
            </>
          )}
          {shop.images?.emblem && shop.tagline && <p className="mt-3 text-sm text-cream/60">{shop.tagline}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={key[0].toUpperCase() + key.slice(1)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition hover:border-gold hover:text-gold"
                >
                  {SOCIAL_ICONS[key] || <span className="text-xs uppercase">{key.slice(0, 2)}</span>}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">Visit</h3>
          <address className="mt-3 not-italic text-sm leading-relaxed text-cream/70">
            {addressLines().map((l) => <div key={l}>{l}</div>)}
          </address>
          <div className="mt-3 space-y-1 text-sm">
            <a href={`tel:${shop.contact.phoneHref}`} className="block hover:text-gold">{shop.contact.phone}</a>
            {shop.contact.email && <a href={`mailto:${shop.contact.email}`} className="block hover:text-gold">{shop.contact.email}</a>}
            {shop.socials?.instagram && <a href={shop.socials.instagram} target="_blank" rel="noreferrer" className="block hover:text-gold">Message us on Instagram</a>}
            <a href={mapsLink} target="_blank" rel="noreferrer" className="block hover:text-gold">Get directions →</a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">Hours</h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            {hours.map((r) => (
              <li key={r.label} className="flex justify-between gap-4">
                <span className="text-cream/70">{r.label}</span>
                <span className={r.closed ? 'text-cream/40' : 'text-cream/90'}>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gold">Quick links</h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><Link to="/book" className="hover:text-gold">Book an appointment</Link></li>
            <li><a href="/#services" className="hover:text-gold">Services & prices</a></li>
            <li><a href="/#gallery" className="hover:text-gold">Gallery</a></li>
            {shop.usesBarbers && <li><a href="/#team" className="hover:text-gold">Our barbers</a></li>}
            <li><Link to="/admin" className="hover:text-gold">Staff login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/40 sm:flex-row">
          <span>© {new Date().getFullYear()} {shop.name}. All rights reserved.</span>
          <span>Walk-ins welcome • Online booking available 24/7</span>
        </div>
      </div>
    </footer>
  );
}
