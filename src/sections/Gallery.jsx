import { useState } from 'react';
import shop from '../config/shop.js';
import SectionHeading from '../components/SectionHeading.jsx';
import Img from '../components/Img.jsx';

export default function Gallery() {
  const items = shop.gallery || [];
  const [active, setActive] = useState(null); // index of the lightbox image

  if (items.length === 0) return null;

  return (
    <section id="gallery" className="bg-charcoal py-20 text-cream sm:py-28">
      <div className="container-x">
        <SectionHeading eyebrow="Recent work" title="The gallery" light intro="A look at the cuts, shaves, and the shop itself." />

        <div className="mt-12 grid auto-rows-[200px] grid-cols-2 gap-3 sm:auto-rows-[240px] sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <button
              key={it.src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`group relative overflow-hidden rounded-xl ${it.wide ? 'col-span-2' : ''}`}
            >
              <Img
                src={it.src}
                alt={it.alt || `Gallery photo ${i + 1}`}
                label={it.alt}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 transition group-hover:ring-gold/40" />
              {it.alt && (
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs uppercase tracking-widest text-cream/90 transition group-hover:translate-y-0">
                  {it.alt}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {active != null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-cream hover:bg-white/20" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <button
            className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-cream hover:bg-white/20 sm:block"
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + items.length) % items.length); }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Img src={items[active].src} alt={items[active].alt || ''} label={items[active].alt} className="max-h-[80vh] w-full rounded-lg" imgClassName="max-h-[80vh] w-auto rounded-lg object-contain" />
            {items[active].alt && <p className="mt-3 text-center text-sm uppercase tracking-widest text-cream/70">{items[active].alt}</p>}
          </div>
          <button
            className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-cream hover:bg-white/20 sm:block"
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % items.length); }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}
