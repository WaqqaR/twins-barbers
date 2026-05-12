import 'dotenv/config';
import jwt from 'jsonwebtoken';

const TTL = '8h';
const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';

export function signAdminToken(admin) {
  return jwt.sign({ sub: admin.id, username: admin.username, role: 'admin' }, secret(), { expiresIn: TTL });
}

/** Express middleware: requires a valid admin bearer token. */
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    const payload = jwt.verify(token, secret());
    if (payload.role !== 'admin') throw new Error('wrong role');
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}
