# Barbershop website + online booking

A complete site for a barbershop:

- **Landing page** — hero, services & prices, photo gallery (with lightbox), about, barbers, hours, location/map, contact.
- **Online booking** — guided flow: pick a service → barber → day → time, enter your details, get a confirmation page (with a link you can save or use to cancel). Real availability is checked against the database, with per‑barber scheduling.
- **Admin dashboard** — password‑protected. View/filter/search appointments, cancel/restore, delete, see a daily count and estimated revenue.

**Stack:** React + Vite + Tailwind CSS (frontend) · Express + libSQL/Turso + JWT (backend) · deploys to Vercel.

---

## 1. Run it locally

```bash
npm install
npm run dev
```

- Frontend (Vite): http://localhost:5173
- API (Express): http://localhost:4400 — the Vite dev server proxies `/api/*` to it.
- A local SQLite file is created automatically at `server/local.db` (git‑ignored). **No accounts or `.env` needed to start.**

**Admin login** (dev defaults): go to http://localhost:5173/admin → username `admin`, password `changeme`.
Change it any time with:

```bash
npm run seed-admin -- myname mySecretPassword
```

Other scripts: `npm run build` (production build to `dist/`), `npm run preview` (serve the build), `npm run server` (API only).

---

## 2. Make it your shop — edit one file

Everything shop‑specific lives in **[`src/config/shop.js`](src/config/shop.js)**:

- Name, tagline, timezone
- Phone / email / address, Google Maps embed link, social links
- **Opening hours** per weekday (supports lunch breaks), plus one‑off `closedDates` (holidays)
- **Services** — name, price, duration, description, grouped into categories
- **Barbers** — name, bio, photo. *(Leave the list with only the `any` entry, or empty it entirely, to run as a single‑chair shop with no barber picker.)*
- Booking rules — slot length, how far ahead people can book, minimum lead time, cleanup buffer
- Gallery photos, hero image, logo, About text

The booking engine reads the same file, so changing hours/services/durations updates availability automatically.

### Your photos

Drop image files into **`public/images/`** and reference them in `src/config/shop.js`
(`images.hero`, `images.about`, `images.logo`, each barber's `photo`, and the `gallery` list).
Any missing image shows a tasteful placeholder, so the site looks fine before you add them.
Suggested files: `hero.jpg` (wide, high‑res), `about.jpg`, `gallery-1.jpg … gallery-6.jpg`, `barber-<name>.jpg`.

### Colours / fonts

Brand colours and fonts are in [`tailwind.config.js`](tailwind.config.js) (`ink`, `gold`, `cream`, …) and the font `<link>` in [`index.html`](index.html). Reusable button/field styles are in [`src/index.css`](src/index.css).

---

## 3. Deploy to Vercel

The repo is set up so the **frontend** and the **`/api` backend** both run on Vercel.
SQLite files can't be written on Vercel's serverless filesystem, so production uses **[Turso](https://turso.tech)** (hosted libSQL — same SQL, free tier).

1. **Create a Turso database** (one‑time):

   ```bash
   # install the CLI: https://docs.turso.tech/cli/installation
   turso db create barbershop
   turso db show barbershop --url          # -> libsql://barbershop-xxxx.turso.io
   turso db tokens create barbershop       # -> a long token
   ```

2. **Push the repo to GitHub**, then in Vercel: *New Project → import the repo*. Framework preset: **Other** (the included `vercel.json` already sets the build command and output dir).

3. **Set Environment Variables** in the Vercel project (Production + Preview):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the `libsql://…turso.io` URL from step 1 |
   | `DATABASE_AUTH_TOKEN` | the token from step 1 |
   | `JWT_SECRET` | a long random string — `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `ADMIN_USERNAME` | your admin username |
   | `ADMIN_PASSWORD` | a strong password (used to seed the admin on first request) |
   | `TZ` | *(optional)* your shop's IANA timezone, e.g. `America/Chicago` — keeps server‑side date math aligned with `shop.timezone` |

4. **Deploy.** On the first request the database tables are created and the admin account is seeded from `ADMIN_USERNAME` / `ADMIN_PASSWORD`. To change the admin later, either update those env vars and create a fresh DB, or run `seed-admin` against the Turso URL locally:

   ```bash
   DATABASE_URL="libsql://…turso.io" DATABASE_AUTH_TOKEN="…" npm run seed-admin -- admin newPassword
   ```

> **Alternative hosting:** if you'd rather not use Turso, you can deploy the **frontend** to Vercel and run the **`server/`** Express app on a host with a persistent disk (Render, Railway, Fly.io) using `DATABASE_URL=file:./local.db`. Point the frontend at it by adjusting the API base URL / proxy.

> **Other static hosts (Netlify, etc.):** the booking + admin features need the Node API, so plain static hosting won't run them. The landing page alone would work, but the recommended path is Vercel (or Vercel + a separate Node host).

---

## Project layout

```
public/images/         your photos go here
src/
  config/shop.js        ← single source of truth for all shop content
  pages/                Home, Book, BookingConfirmation, AdminLogin, AdminDashboard
  sections/             Hero, Services, Gallery, About, Team, Contact (home page)
  components/            Navbar, Footer, Layout, Img (placeholder-aware), SectionHeading
  lib/                   api.js (fetch client), format.js (dates/money/hours)
server/                 Express API (same code runs locally and on Vercel)
  app.js                routes: /api/availability, /api/bookings, /api/admin/*
  availability.js       slot/availability logic (timezone-aware)
  db.js                 libSQL client, schema, admin seeding
  auth.js               JWT admin auth
  dev-server.js         local listener (npm run server)
  seed-admin.js         create/reset the admin (npm run seed-admin)
api/[...path].js        Vercel serverless entry — re-exports server/app.js
vercel.json             build config + SPA fallback rewrite
.env.example            copy to .env for local overrides (optional)
```

## API quick reference

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/availability?date=YYYY-MM-DD&service=ID&barber=ID` | available start times |
| `POST` | `/api/bookings` | `{ serviceId, barberId, date, startMin, name, phone, email?, notes? }` |
| `GET` | `/api/bookings/:id` | look up a booking (id is an unguessable token) |
| `POST` | `/api/bookings/:id/cancel` | customer cancels their own booking |
| `POST` | `/api/admin/login` | `{ username, password }` → `{ token }` |
| `GET` | `/api/admin/bookings?from=&to=&status=` | list (Bearer token) |
| `GET` | `/api/admin/bookings/search?q=` | search by name/phone (Bearer token) |
| `PATCH` | `/api/admin/bookings/:id` | `{ status: 'confirmed' \| 'cancelled' }` |
| `DELETE` | `/api/admin/bookings/:id` | hard delete |

Bookings store **start/end as minutes from midnight** in the shop's timezone; the API also returns friendly labels. No payments are taken online — appointments are pay‑in‑shop by design.
