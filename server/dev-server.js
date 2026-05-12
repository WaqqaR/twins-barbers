// Local development API server. In production the same Express app is exported
// from /api/[...path].js and run by Vercel's serverless runtime instead.
import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT) || 4400;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}  (proxied from the Vite dev server at /api)`);
});
