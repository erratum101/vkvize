import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AuthUser } from '../lib/auth';

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await verifyAccessToken(header.slice(7));
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const user = await verifyAccessToken(header.slice(7));
    if (user) req.user = user;
  }
  next();
}

export function requireOrganizer(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'ORGANIZER' && req.user.role !== 'BOTH') {
    return res.status(403).json({ error: 'Organizer role required' });
  }
  next();
}
