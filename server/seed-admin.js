// Create or reset the admin login.
//   npm run seed-admin                       -> uses ADMIN_USERNAME / ADMIN_PASSWORD from .env
//   npm run seed-admin -- myname mySecretPw   -> explicit username + password
import 'dotenv/config';
import { upsertAdmin } from './db.js';

const [, , argUser, argPass] = process.argv;
const username = (argUser || process.env.ADMIN_USERNAME || 'admin').trim();
const password = argPass || process.env.ADMIN_PASSWORD || 'changeme';

if (password === 'changeme') {
  console.warn('⚠  Using the default password "changeme" — set ADMIN_PASSWORD in .env or pass one as an argument.');
}

await upsertAdmin(username, password);
console.log(`✓ Admin "${username}" is ready. Log in at /admin`);
process.exit(0);
