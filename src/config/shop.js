// ─────────────────────────────────────────────────────────────────────────────
//  SHOP CONFIG — edit everything here. This is the single source of truth used
//  by both the website (display) and the booking engine (availability logic).
// ─────────────────────────────────────────────────────────────────────────────

const shop = {
  name: 'Twins Barbers',
  tagline: 'Sharp Style · Perfect Detail',
  shortName: 'Twins Barbers',
  // Year the shop opened — shown in the About section. Set null to hide.
  establishedYear: null,
  // IANA timezone of the shop — keeps "earliest bookable time today" correct
  // regardless of where the server runs.
  timezone: 'Europe/London',

  contact: {
    phone: '+44 7442 746006',
    // tel: link version — digits only, with country code, no spaces.
    phoneHref: '+447442746006',
    // No public email yet — leave '' to hide it everywhere. Add one any time.
    email: '',
    address: {
      line1: '15 Oxford Road',
      line2: '',
      city: 'Kidlington',
      region: 'Oxfordshire',
      postalCode: 'OX5 2BP',
      country: 'United Kingdom',
    },
    // Live map embedded in the "Visit us" section. For an even nicer embed you
    // can open the shop in Google Maps → Share → "Embed a map" → paste the
    // iframe's src here instead.
    mapEmbedUrl: 'https://www.google.com/maps?q=Twins+Barbers,+15+Oxford+Road,+Kidlington+OX5+2BP&z=16&output=embed',
    // "Get directions" link.
    mapsLink: 'https://maps.app.goo.gl/4sLvznow5rSfLmNW7',
  },

  socials: {
    instagram: 'https://www.instagram.com/twinz.barberz/',
    facebook: '',
    tiktok: '',
  },

  // ── Opening hours ──────────────────────────────────────────────────────────
  // 0 = Sunday … 6 = Saturday. Either { closed: true } or one+ open intervals
  // in 24h "HH:MM" form. Multiple intervals model a lunch break.
  hours: {
    0: { intervals: [['10:00', '17:00']] },           // Sunday
    1: { intervals: [['09:00', '19:00']] },           // Monday
    2: { intervals: [['09:00', '19:00']] },           // Tuesday
    3: { intervals: [['09:00', '19:00']] },           // Wednesday
    4: { intervals: [['09:00', '19:00']] },           // Thursday
    5: { intervals: [['09:00', '19:00']] },           // Friday
    6: { intervals: [['08:30', '18:30']] },           // Saturday
  },

  // Note shown near the hours — Twins Barbers takes appointments outside hours too.
  hoursNote: 'Appointments available outside working hours — just call or message us on Instagram.',

  // Specific dates the shop is closed (holidays, etc.) — "YYYY-MM-DD".
  closedDates: [
    // '2026-12-25',
  ],

  // ── Booking engine settings ────────────────────────────────────────────────
  booking: {
    slotMinutes: 15,
    maxDaysAhead: 30,
    minLeadMinutes: 60,    // earliest you can book today = now + 60 min
    bufferMinutes: 0,      // cleanup time added after every appointment
  },

  // ── Chairs / barbers ───────────────────────────────────────────────────────
  // `barbers` is empty for now (customers don't pick a specific barber), so the
  // shop is treated as `chairs` interchangeable chairs — up to `chairs` bookings
  // can overlap at any time. If you later want per-barber booking, add entries:
  //   { id: 'sam', name: 'Sam', bio: 'Skin fades, beard work', photo: '/images/barber-sam.jpg' }
  // (keep a leading { id:'any', name:'No preference' } if you do).
  barbers: [],
  chairs: 3,

  // ── Services & prices ──────────────────────────────────────────────────────
  // From the Twins Barbers price list. `minutes` (chair time) are estimates —
  // tweak to match how long each actually takes. `id` must be unique + stable.
  currency: { code: 'GBP', symbol: '£' },
  serviceCategories: [
    {
      name: 'Haircuts',
      services: [
        { id: 'skin-fade',     name: 'Skin Fade',        minutes: 45, price: 19, description: 'Bald fade blended into your length on top.' },
        { id: 'taper-fade',    name: 'Taper Fade',       minutes: 45, price: 17, description: 'Clean tapered fade around the edges.' },
        { id: 'normal-haircut',name: 'Normal Haircut',   minutes: 30, price: 15, description: 'Classic scissor / clipper cut and style.' },
        { id: 'kids-cut',      name: "Kids' Cut",        minutes: 30, price: 15, description: 'Friendly cuts for the little ones — kids’ chair available.' },
        { id: 'all-over',      name: 'All Over',         minutes: 20, price: 13, description: 'Single-length clipper cut, one guard all over.' },
        { id: 'oap',           name: "OAP's",            minutes: 30, price: 10, description: 'Discounted cut for senior clients.' },
      ],
    },
    {
      name: 'Beard & Grooming',
      services: [
        { id: 'beard-trim',     name: 'Beard Trim',          minutes: 20, price: 13, description: 'Shaped, lined up and tidied.' },
        { id: 'hot-towel-shave',name: 'Hot Towel Shave',     minutes: 30, price: 15, description: 'Traditional razor shave with hot towels.' },
        { id: 'face-wax-mask',  name: 'Face Wax & Mask',     minutes: 20, price: 15, description: 'Wax tidy-up plus a cleansing face mask.' },
      ],
    },
    {
      name: 'Cut & Beard',
      services: [
        { id: 'skin-fade-beard',  name: 'Skin Fade & Beard',  minutes: 60, price: 30, description: 'Skin fade plus full beard shape and line.' },
        { id: 'taper-fade-beard', name: 'Taper Fade & Beard', minutes: 60, price: 28, description: 'Taper fade plus full beard shape and line.' },
        { id: 'normal-cut-beard', name: 'Normal Cut & Beard', minutes: 45, price: 25, description: 'Standard haircut plus beard trim.' },
        { id: 'full-service',     name: 'Full Service',       minutes: 90, price: 45, description: 'The works — cut, beard, hot towel shave, face wax & mask.' },
      ],
    },
  ],

  // ── Photo gallery ──────────────────────────────────────────────────────────
  // `wide: true` makes a photo span two columns.
  gallery: [
    { src: '/images/interior-1.jpg', alt: 'Inside Twins Barbers — hexagon LED ceiling and marble floor', wide: true },
    { src: '/images/interior-2.jpg', alt: 'The chairs at Twins Barbers, with the kids’ car chair', wide: true },
    { src: '/images/cut-1.jpg', alt: 'Curly top with a clean low drop fade' },
    { src: '/images/cut-2.jpg', alt: 'Textured grown-out cut with a low taper' },
    { src: '/images/cut-3.jpg', alt: 'Short crop with a sharp faded beard' },
    { src: '/images/cut-4.jpg', alt: 'Textured crop with a mid skin fade' },
  ],

  // ── Hero / branding imagery ────────────────────────────────────────────────
  images: {
    // Short looping clip used as the hero background (muted, autoplay). Set '' to
    // use the still photo below instead.
    heroVideo: '/images/shop-video.mp4',
    // Still shown before/instead of the video (and as the video poster).
    hero: '/images/interior-1.jpg',
    // The Twins Barbers emblem — shown top-left in the navbar and large on the
    // dark footer. Set `logo: ''` to fall back to the text wordmark in the navbar.
    emblem: '/images/logo.jpg',
    logo: '/images/logo.jpg',
    // Photo beside the About section.
    about: '/images/storefront.jpg',
  },

  about: {
    heading: 'Sharp style, perfect detail — on Oxford Road.',
    body: [
      'Twins Barbers is a modern barbershop in the heart of Kidlington. Walk in and you’ll find a clean, bright space — and barbers who actually care how you walk out.',
      'Skin fades, taper fades, classic cuts, beard work, hot-towel shaves, face wax & mask — all done properly, no rush. There’s a kids’ chair too, so the little ones are sorted.',
      'Booked up? Walk-ins are welcome whenever a chair’s free, and we take appointments outside our normal hours — just call or message us.',
    ],
    perks: [
      'Skin & taper fades a speciality',
      'Beard work & hot-towel shaves',
      'Kids welcome — kids’ chair available',
      'Appointments outside hours on request',
    ],
  },

  highlights: ['Walk-ins welcome', 'Online booking', 'Open 7 days a week'],
};

// ── Derived helpers (don't edit) ─────────────────────────────────────────────
shop.services = shop.serviceCategories.flatMap((c) => c.services);
shop.servicesById = Object.fromEntries(shop.services.map((s) => [s.id, s]));
shop.usesBarbers = shop.barbers.length > 0;
shop.bookableBarbers = shop.barbers.filter((b) => b.id !== 'any');
shop.chairCount = shop.usesBarbers ? shop.bookableBarbers.length : Math.max(1, shop.chairs || 1);

export default shop;
