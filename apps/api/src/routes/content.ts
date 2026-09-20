import { Router } from 'express';
import { z } from 'zod';
import {
  categorySchema,
  serviceSchema,
  skillSchema,
  skillCategorySchema,
  experienceSchema,
  testimonialSchema,
  settingsSchema,
} from '../../../../packages/shared/src/index.js';
import { db } from '../db.js';
import { requireAuth } from '../middleware.js';
export const content = Router();
content.use(requireAuth);
// Explicit typed adapters keep the shared CRUD behavior independent of Prisma's model delegates.
function resource<T>(
  path: string,
  schema: z.ZodType<T>,
  adapter: {
    list: () => Promise<unknown>;
    create: (v: T) => Promise<unknown>;
    update: (id: string, v: T) => Promise<unknown>;
    remove: (id: string) => Promise<unknown>;
  },
) {
  content.get(path, async (_req, res) => res.json({ data: await adapter.list() }));
  content.post(path, async (req, res) =>
    res.status(201).json({ data: await adapter.create(schema.parse(req.body)) }),
  );
  content.put(`${path}/:id`, async (req, res) =>
    res.json({ data: await adapter.update(String(req.params.id), schema.parse(req.body)) }),
  );
  content.delete(`${path}/:id`, async (req, res) => {
    await adapter.remove(String(req.params.id));
    res.json({ data: { ok: true } });
  });
}
resource('/categories', categorySchema, {
  list: () => db.projectCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
  create: (data) => db.projectCategory.create({ data }),
  update: (id, data) => db.projectCategory.update({ where: { id }, data }),
  remove: (id) => db.projectCategory.delete({ where: { id } }),
});
resource('/services', serviceSchema, {
  list: () => db.service.findMany({ orderBy: { sortOrder: 'asc' } }),
  create: (data) => db.service.create({ data }),
  update: (id, data) => db.service.update({ where: { id }, data }),
  remove: (id) => db.service.delete({ where: { id } }),
});
resource('/skill-categories', skillCategorySchema, {
  list: () => db.skillCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
  create: (data) => db.skillCategory.create({ data }),
  update: (id, data) => db.skillCategory.update({ where: { id }, data }),
  remove: (id) => db.skillCategory.delete({ where: { id } }),
});
resource('/skills', skillSchema, {
  list: () => db.skill.findMany({ include: { category: true }, orderBy: { sortOrder: 'asc' } }),
  create: (data) => db.skill.create({ data }),
  update: (id, data) => db.skill.update({ where: { id }, data }),
  remove: (id) => db.skill.delete({ where: { id } }),
});
resource('/experience', experienceSchema, {
  list: () => db.experience.findMany({ orderBy: { sortOrder: 'asc' } }),
  create: (data) => db.experience.create({ data }),
  update: (id, data) => db.experience.update({ where: { id }, data }),
  remove: (id) => db.experience.delete({ where: { id } }),
});
resource('/testimonials', testimonialSchema, {
  list: () => db.testimonial.findMany({ orderBy: { sortOrder: 'asc' } }),
  create: (data) => db.testimonial.create({ data }),
  update: (id, data) => db.testimonial.update({ where: { id }, data }),
  remove: (id) => db.testimonial.delete({ where: { id } }),
});
content.get('/settings', async (_req, res) =>
  res.json({ data: (await db.siteSetting.findUniqueOrThrow({ where: { id: 'main' } })).data }),
);
content.put('/settings', async (req, res) => {
  const data = settingsSchema.parse(req.body);
  await db.siteSetting.upsert({
    where: { id: 'main' },
    create: { id: 'main', data },
    update: { data },
  });
  res.json({ data });
});
content.get('/overview', async (_req, res) => {
  const [
    totalProjects,
    publishedProjects,
    totalMessages,
    unreadMessages,
    services,
    testimonials,
    recentProjects,
    recentMessages,
  ] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { published: true } }),
    db.contactMessage.count(),
    db.contactMessage.count({ where: { read: false } }),
    db.service.count(),
    db.testimonial.count(),
    db.project.findMany({ take: 5, orderBy: { updatedAt: 'desc' } }),
    db.contactMessage.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
  ]);
  res.json({
    data: {
      totalProjects,
      publishedProjects,
      draftProjects: totalProjects - publishedProjects,
      totalMessages,
      unreadMessages,
      services,
      testimonials,
      recentProjects,
      recentMessages,
    },
  });
});
content.get('/messages', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    take = 15;
  const where = {
    ...(req.query.status && ['New', 'Replied', 'Archived'].includes(String(req.query.status))
      ? { status: String(req.query.status) }
      : {}),
    OR: [
      { name: { contains: String(req.query.q || ''), mode: 'insensitive' as const } },
      { email: { contains: String(req.query.q || ''), mode: 'insensitive' as const } },
    ],
  };
  const [items, total] = await db.$transaction([
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip: (page - 1) * take,
    }),
    db.contactMessage.count({ where }),
  ]);
  res.json({ data: items, total, page, pages: Math.ceil(total / take) });
});
content.patch('/messages/:id', async (req, res) => {
  const data = z
    .object({
      read: z.boolean().optional(),
      status: z.enum(['New', 'Replied', 'Archived']).optional(),
    })
    .parse(req.body);
  res.json({
    data: await db.contactMessage.update({ where: { id: String(req.params.id) }, data }),
  });
});
content.delete('/messages/:id', async (req, res) => {
  await db.contactMessage.delete({ where: { id: String(req.params.id) } });
  res.json({ data: { ok: true } });
});
