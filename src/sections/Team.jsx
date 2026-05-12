import { Link } from 'react-router-dom';
import shop from '../config/shop.js';
import SectionHeading from '../components/SectionHeading.jsx';
import Img from '../components/Img.jsx';

export default function Team() {
  const barbers = shop.bookableBarbers;
  if (!barbers.length) return null;

  return (
    <section id="team" className="bg-charcoal py-20 text-cream sm:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="The team"
          title="Meet your barbers"
          light
          intro="Licensed, experienced, and easy to talk to. Pick a name when you book — or let us match you with whoever's free."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((b) => (
            <div key={b.id} className="group overflow-hidden rounded-2xl bg-ink/60 ring-1 ring-white/5">
              <Img
                src={b.photo}
                alt={b.name}
                label={b.name}
                className="aspect-[4/5] w-full"
                imgClassName="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl">{b.name}</h3>
                  <Link to={`/book?barber=${b.id}`} className="text-xs font-semibold uppercase tracking-widest text-gold hover:text-goldsoft">Book →</Link>
                </div>
                {b.bio && <p className="mt-2 text-sm text-cream/65">{b.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
