// Tiny fetch wrapper. All requests go to the same origin under /api
// (Vite proxies it in dev; Vercel serves it from /api/[...path].js in prod).

const ADMIN_TOKEN_KEY = 'barber.adminToken';

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}
export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = false, params } = {}) {
  let url = `/api${path}`;
  if (params) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const s = qs.toString();
    if (s) url += `?${s}`;
  }
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Network error — check your connection and try again.', 0);
  }
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { error: text }; }
  }
  if (!res.ok) {
    if (auth && res.status === 401) setAdminToken(null);
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  // public
  health: () => request('/health'),
  config: () => request('/config'),
  availability: ({ date, service, barber }) => request('/availability', { params: { date, service, barber } }),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  getBooking: (id) => request(`/bookings/${encodeURIComponent(id)}`),
  cancelBooking: (id) => request(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),
  // admin
  adminLogin: (username, password) => request('/admin/login', { method: 'POST', body: { username, password } }),
  adminMe: () => request('/admin/me', { auth: true }),
  adminBookings: ({ from, to, status } = {}) => request('/admin/bookings', { auth: true, params: { from, to, status } }),
  adminSearch: (q) => request('/admin/bookings/search', { auth: true, params: { q } }),
  adminUpdateBooking: (id, status) => request(`/admin/bookings/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, auth: true }),
  adminDeleteBooking: (id) => request(`/admin/bookings/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
};
