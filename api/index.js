// Vercel serverless entry point. The vercel.json rewrite sends every /api/*
// request (any depth) here, and this re-exports the same Express app used in
// local development (server/app.js), whose router is mounted at /api.
import app from '../server/app.js';

export default app;
