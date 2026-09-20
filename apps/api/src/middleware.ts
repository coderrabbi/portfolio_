import type { RequestHandler, ErrorRequestHandler } from 'express';
import { createHash } from 'node:crypto';
import { ZodError } from 'zod';
import { db } from './db.js';
import { config } from './config.js';
export const cookieName = config.NODE_ENV === 'production' ? '__Host-gr_session' : 'gr_session';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[cookieName];
  if (typeof token !== 'string') {
    res.status(401).json({ error: 'Please sign in to continue.' });
    return;
  }
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!session || session.expiresAt < new Date()) {
    res
      .clearCookie(cookieName, cookieOptions)
      .status(401)
      .json({ error: 'Your session has expired. Please sign in.' });
    return;
  }
  res.locals.user = session.user;
  next();
};
export const checkOrigin: RequestHandler = (req, res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.get('origin') !== new URL(config.FRONTEND_URL).origin
  ) {
    res.status(403).json({ error: 'Request origin is not allowed.' });
    return;
  }
  next();
};
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res
      .status(422)
      .json({ error: 'Please check the highlighted fields.', issues: error.flatten() });
    return;
  }
  const code = typeof error === 'object' && error && 'code' in error ? error.code : null;
  const type = typeof error === 'object' && error && 'type' in error ? error.type : null;
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: 'The request body is not valid JSON.' });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ error: 'The request is too large.' });
    return;
  }
  if (code === 'P2002') {
    res.status(409).json({ error: 'That value is already in use. Choose a unique name or slug.' });
    return;
  }
  if (code === 'P2025') {
    res.status(404).json({ error: 'This item no longer exists.' });
    return;
  }
  if (code === 'P2003') {
    res.status(409).json({ error: 'This item is in use. Remove its references first.' });
    return;
  }
  if (code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Images must be 10 MB or smaller.' });
    return;
  }
  if (typeof code === 'string' && code.startsWith('LIMIT_')) {
    res.status(422).json({ error: 'Choose up to eight supported images per upload.' });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
