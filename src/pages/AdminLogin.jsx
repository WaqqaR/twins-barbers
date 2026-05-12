import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import shop from '../config/shop.js';
import { api, getAdminToken, setAdminToken } from '../lib/api.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // If there's already a valid session, skip straight to the dashboard.
  useEffect(() => {
    if (!getAdminToken()) { setChecking(false); return; }
    api.adminMe()
      .then(() => navigate('/admin/dashboard', { replace: true }))
      .catch(() => { setAdminToken(null); setChecking(false); });
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token } = await api.adminLogin(username.trim(), password);
      setAdminToken(token);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
      setBusy(false);
    }
  }

  if (checking) {
    return <div className="grid min-h-screen place-items-center bg-ink text-cream/60">Checking session…</div>;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink px-4 text-cream">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="font-display text-3xl tracking-wider text-cream">{shop.shortName}</Link>
          <p className="mt-1 text-sm uppercase tracking-[0.3em] text-gold">Staff area</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-charcoal p-7 ring-1 ring-white/10">
          <h1 className="text-2xl">Sign in</h1>
          <p className="mt-1 text-sm text-cream/55">Manage appointments for {shop.name}.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="u" className="mb-1.5 block text-sm text-cream/70">Username</label>
              <input id="u" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" required />
            </div>
            <div>
              <label htmlFor="p" className="mb-1.5 block text-sm text-cream/70">Password</label>
              <input id="p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" required />
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button type="submit" className="btn-gold mt-6 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-5 text-center text-xs text-cream/30">
          <Link to="/" className="hover:text-gold">← Back to the website</Link>
        </p>
      </div>
    </div>
  );
}
