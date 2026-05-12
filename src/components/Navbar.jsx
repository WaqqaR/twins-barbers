import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import shop from '../config/shop.js';
import Img from './Img.jsx';

const LINKS = [
  { label: 'Services', to: '/#services' },
  { label: 'Gallery', to: '/#gallery' },
  { label: 'About', to: '/#about' },
  ...(shop.usesBarbers ? [{ label: 'Barbers', to: '/#team' }] : []),
  { label: 'Visit', to: '/#contact' },
];

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

export default function Navbar() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);

  // Anchor links: if we're already on the home page just scroll; otherwise
  // navigate home with the hash so Layout handles the scroll.
  const goAnchor = (e, to) => {
    const id = to.split('#')[1];
    if (!id) return;
    e.preventDefault();
    setOpen(false);
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `/#${id}`);
    } else {
      navigate(`/#${id}`);
    }
  };

  const dark = pathname === '/' && !scrolled && !open; // transparent over the hero at the top
  const wrap = dark
    ? 'bg-transparent'
    : 'bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80 shadow-lg shadow-black/10';

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${wrap}`}>
      <nav className="container-x flex h-16 items-center justify-between sm:h-[72px]">
        <Link to="/" aria-label={shop.name} className="flex items-center gap-3 text-cream" onClick={() => setOpen(false)}>
          {shop.images?.logo ? (
            // Logo badge — rounded so the artwork's dark backdrop reads cleanly
            // over both the solid and transparent navbar.
            <Img
              src={shop.images.logo}
              alt={shop.name}
              label={shop.shortName}
              className="h-10 w-10 rounded-lg ring-1 ring-white/10 sm:h-11 sm:w-11"
              imgClassName="h-10 w-10 rounded-lg object-cover sm:h-11 sm:w-11"
            />
          ) : (
            <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 text-gold">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="7" cy="8" r="2.4" /><circle cx="7" cy="16" r="2.4" />
                <path d="M9 9.3l9 5.4M9 14.7l9-5.4M16.5 7.6l2 1.2M16.5 16.4l2-1.2" />
              </svg>
            </span>
          )}
          <span className="font-display text-2xl leading-none tracking-wider">{shop.shortName}</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <a
                href={l.to}
                onClick={(e) => goAnchor(e, l.to)}
                className="text-sm font-medium uppercase tracking-widest text-cream/80 transition hover:text-gold"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a href={`tel:${shop.contact.phoneHref}`} className="hidden text-sm font-medium text-cream/80 hover:text-gold lg:inline">
            {shop.contact.phone}
          </a>
          <Link to="/book" className="btn-gold !px-5 !py-2.5 text-xs">Book now</Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-cream md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-cream/10 bg-ink md:hidden">
          <ul className="container-x flex flex-col py-3">
            {LINKS.map((l) => (
              <li key={l.to}>
                <a href={l.to} onClick={(e) => goAnchor(e, l.to)} className="block py-3 text-base font-medium uppercase tracking-widest text-cream/90">
                  {l.label}
                </a>
              </li>
            ))}
            <li className="mt-2 flex gap-3 py-2">
              <Link to="/book" className="btn-gold flex-1">Book now</Link>
              <a href={`tel:${shop.contact.phoneHref}`} className="btn-outline-light flex-1">Call</a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
