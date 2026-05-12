import { Link } from 'react-router-dom';
import shop from '../config/shop.js';
import { isOpenNow } from '../lib/format.js';

export default function Hero() {
  const open = isOpenNow();
  const hero = shop.images?.hero;
  const heroVideo = shop.images?.heroVideo;

  return (
    <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-ink text-cream">
      {/* Background: looping video if provided, otherwise the still photo,
          otherwise a textured dark fallback. Always overlaid for legibility. */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 20% 0%, rgba(200,160,78,0.18), transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 18px, transparent 18px 36px)',
            backgroundColor: '#0e0e10',
          }}
        />
        {heroVideo ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={hero || undefined}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : hero ? (
          <img src={hero} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/40" />
      </div>

      <div className="container-x w-full pt-28 pb-16 sm:pt-32">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-10 bg-gold/60" />
            {shop.tagline}
          </p>
          <h1 className="mt-4 text-5xl leading-[0.95] sm:text-7xl">
            {shop.name}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-cream/75">
            A proper barbershop in {shop.contact.address.city}. Sharp cuts, clean shaves, no rush —
            book your chair online in under a minute.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/book" className="btn-gold">Book an appointment</Link>
            <a href="/#services" className="btn-outline-light">View services</a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cream/60">
            <span className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${open ? 'bg-emerald-400' : 'bg-cream/30'}`} />
              {open ? 'Open now' : 'Currently closed'}
            </span>
            {shop.highlights?.map((h) => (
              <span key={h} className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-gold/70" />
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <a href="/#services" aria-label="Scroll to services" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cream/40 transition hover:text-gold">
        <svg viewBox="0 0 24 24" className="h-6 w-6 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
      </a>
    </section>
  );
}
