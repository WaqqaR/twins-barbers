import { Link } from 'react-router-dom';
import shop from '../config/shop.js';
import Img from '../components/Img.jsx';

export default function About() {
  const { about } = shop;
  return (
    <section id="about" className="bg-cream py-20 sm:py-28">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <Img
            src={shop.images?.about}
            alt={`Inside ${shop.name}`}
            label="The shop"
            className="aspect-[4/5] w-full rounded-3xl"
            imgClassName="aspect-[4/5] w-full rounded-3xl object-cover"
          />
          {shop.establishedYear && (
            <div className="absolute -bottom-6 -right-4 hidden rounded-2xl bg-ink px-6 py-5 text-cream shadow-xl sm:block">
              <div className="font-display text-4xl leading-none text-gold">EST. {shop.establishedYear}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-cream/60">{new Date().getFullYear() - shop.establishedYear}+ years sharp</div>
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow flex items-center gap-3"><span className="h-px w-8 bg-gold/60" />About the shop</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">{about.heading}</h2>
          <div className="mt-5 space-y-4 text-lg text-ink/65">
            {about.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {about.perks?.length > 0 && (
            <ul className="mt-7 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {about.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-ink/80">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book" className="btn-dark">Book your chair</Link>
            <a href="/#contact" className="btn-ghost">Find us</a>
          </div>
        </div>
      </div>
    </section>
  );
}
