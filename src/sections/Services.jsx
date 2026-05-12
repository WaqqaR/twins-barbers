import { Link } from 'react-router-dom';
import shop from '../config/shop.js';
import SectionHeading from '../components/SectionHeading.jsx';
import { money, duration } from '../lib/format.js';

export default function Services() {
  return (
    <section id="services" className="bg-cream py-20 sm:py-28">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="The menu"
            title="Services & prices"
            intro="Straightforward pricing, no surprises. Pick what you need when you book."
          />
          <Link to="/book" className="btn-dark hidden sm:inline-flex">Book now</Link>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {shop.serviceCategories.map((cat) => (
            <div key={cat.name} className="card flex flex-col p-6 sm:p-7">
              <h3 className="text-2xl text-ink">{cat.name}</h3>
              <span className="mt-1 h-px w-12 bg-gold" />
              <ul className="mt-5 flex-1 divide-y divide-ink/10">
                {cat.services.map((s) => (
                  <li key={s.id} className="flex items-baseline gap-3 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-ink">{s.name}</span>
                        <span className="hidden grow border-b border-dotted border-ink/20 sm:block" />
                        <span className="whitespace-nowrap font-display text-lg text-gold">{money(s.price)}</span>
                      </div>
                      {s.description && <p className="mt-0.5 text-sm text-ink/55">{s.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-xs uppercase tracking-widest text-ink/40">
                {cat.services.length} service{cat.services.length !== 1 ? 's' : ''} · from {duration(Math.min(...cat.services.map((s) => s.minutes)))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:hidden">
          <Link to="/book" className="btn-dark w-full">Book an appointment</Link>
        </div>
      </div>
    </section>
  );
}
