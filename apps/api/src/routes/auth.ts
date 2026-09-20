import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { loginSchema } from '../../../../packages/shared/src/index.js';
import { db } from '../db.js';
import { requireAuth, hashToken, cookieName, cookieOptions } from '../middleware.js';
export const auth = Router();
const dummy = argon2.hash(randomBytes(32));
auth.post(
  '/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' },
  }),
  async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    const valid = await argon2.verify(user?.passwordHash || (await dummy), password);
    if (!user || !valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const previous: unknown = req.cookies?.[cookieName];
    if (typeof previous === 'string')
      await db.session.deleteMany({ where: { tokenHash: hashToken(previous) } });
    await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const token = randomBytes(32).toString('hex');
    await db.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
      },
    });
    res
      .cookie(cookieName, token, { ...cookieOptions, maxAge: 8 * 3600 * 1000 })
      .json({ data: { id: user.id, email: user.email } });
  },
);
auth.get('/me', requireAuth, (_req, res) => res.json({ data: res.locals.user }));
auth.post('/logout', async (req, res) => {
  const token: unknown = req.cookies?.[cookieName];
  if (typeof token === 'string')
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  res.clearCookie(cookieName, cookieOptions).json({ data: { ok: true } });
});
