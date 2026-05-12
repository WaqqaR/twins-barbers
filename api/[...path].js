// Vercel serverless entry point. Every request to /api/* is routed here and
// handled by the same Express app used in local development (server/app.js).
import app from '../server/app.js';

export default app;

// Note: this function needs the libSQL native bits. Vercel's Node runtime
// bundles them automatically. If you ever see a "could not find module" error
// for @libsql, add  "functions": { "api/**": { "includeFiles": "node_modules/@libsql/**" } }
// to vercel.json.
