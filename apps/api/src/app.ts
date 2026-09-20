import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { contactSchema } from '../../../packages/shared/src/index.js';
import { db } from './db.js';
import { config } from './config.js';
import { checkOrigin, errorHandler } from './middleware.js';
import { auth } from './routes/auth.js';
import { projects, projectInclude } from './routes/projects.js';
import { content } from './routes/content.js';
import { media } from './routes/media.js';
export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY === 'none' ? false : config.TRUST_PROXY);
app.use(
  helmet(),
  cors({ origin: config.FRONTEND_URL, credentials: true }),
  express.json({ limit: '1mb' }),
  cookieParser(),
);
app.get('/uploads/:file', async (req, res, next) => {
  const file = String(req.params.file);
  if (!/^[a-zA-Z0-9_-]+\.webp$/.test(file)) return next();
  const key = file.slice(0, -5);
  const rows = await db.$queryRaw<
    { data: Uint8Array; mimeType: string }[]
  >`SELECT "data", "mimeType" FROM "ImageBlob" WHERE "key" = ${key}`;
  if (!rows.length) return next();
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.type(rows[0].mimeType).send(Buffer.from(rows[0].data));
});
app.use(
  '/uploads',
  express.static(config.UPLOAD_DIR, { dotfiles: 'deny', maxAge: '1y', immutable: true }),
);
app.get('/api/health', async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  res.json({ data: { status: 'ok' } });
});
app.use('/api', checkOrigin);
app.use('/api/auth', auth);
app.get('/api/public/portfolio', async (_req, res) => {
  const [settings, items, categories, services, skills, experience, testimonials] =
    await Promise.all([
      db.siteSetting.findUniqueOrThrow({ where: { id: 'main' } }),
      db.project.findMany({
        where: { published: true },
        include: projectInclude,
        orderBy: { sortOrder: 'asc' },
      }),
      db.projectCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.service.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      db.skill.findMany({
        where: { published: true },
        include: { category: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.experience.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      db.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
  res.json({
    data: {
      settings: settings.data,
      projects: items,
      categories,
      services,
      skills,
      experience,
      testimonials,
    },
  });
});
app.get('/api/public/projects/:slug', async (req, res) => {
  const p = await db.project.findFirst({
    where: { slug: String(req.params.slug), published: true },
    include: projectInclude,
  });
  if (!p) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  res.json({ data: p });
});
app.post(
  '/api/contact',
  rateLimit({
    windowMs: 3600 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Please wait before sending another message.' },
  }),
  async (req, res) => {
    const { website, ...data } = contactSchema.parse(req.body);
    if (website) {
      res.status(201).json({ data: { ok: true } });
      return;
    }
    await db.contactMessage.create({
      data: { ...data, emailStatus: 'pending', emailNextAttemptAt: new Date() },
    });
    res.status(201).json({ data: { ok: true } });
  },
);
app.use('/api/projects', projects);
app.use('/api/media', media);
app.use('/api', content);
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use(errorHandler);
