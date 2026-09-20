import { Router } from 'express';
import { z } from 'zod';
import { projectSchema } from '../../../../packages/shared/src/index.js';
import { db } from '../db.js';
import { requireAuth } from '../middleware.js';
export const projectInclude = {
  category: true,
  technologies: { include: { technology: true } },
  gallery: { include: { media: true }, orderBy: { sortOrder: 'asc' as const } },
};
export const projects = Router();
projects.use(requireAuth);
projects.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    take = 12;
  const q = String(req.query.q || '').slice(0, 200);
  const where = {
    title: { contains: q, mode: 'insensitive' as const },
    ...(req.query.status === 'published'
      ? { published: true }
      : req.query.status === 'draft'
        ? { published: false }
        : {}),
  };
  const [items, total] = await db.$transaction([
    db.project.findMany({
      where,
      include: projectInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * take,
      take,
    }),
    db.project.count({ where }),
  ]);
  res.json({ data: items, total, page, pages: Math.ceil(total / take) });
});
projects.put('/reorder', async (req, res) => {
  const { ids } = z
    .object({
      ids: z
        .array(z.string())
        .min(1)
        .max(1000)
        .refine((v) => new Set(v).size === v.length),
    })
    .parse(req.body);
  await db.$transaction(
    ids.map((id, sortOrder) => db.project.update({ where: { id }, data: { sortOrder } })),
  );
  res.json({ data: { ok: true } });
});
projects.get('/:id', async (req, res) =>
  res.json({
    data: await db.project.findUniqueOrThrow({
      where: { id: String(req.params.id) },
      include: projectInclude,
    }),
  }),
);
async function save(body: unknown, id?: string) {
  const { technologies, gallery, ...data } = projectSchema.parse(body);
  return db.$transaction(async (tx) => {
    const techs = [];
    for (const name of new Set(technologies)) {
      techs.push(await tx.technology.upsert({ where: { name }, create: { name }, update: {} }));
    }
    if (id) {
      await tx.projectTechnology.deleteMany({ where: { projectId: id } });
      await tx.projectMedia.deleteMany({ where: { projectId: id } });
    }
    const relationData = {
      ...data,
      technologies: { create: techs.map((t) => ({ technologyId: t.id })) },
      gallery: { create: gallery.map((item, sortOrder) => ({ ...item, sortOrder })) },
    };
    return id
      ? tx.project.update({ where: { id }, data: relationData, include: projectInclude })
      : tx.project.create({ data: relationData, include: projectInclude });
  });
}
projects.post('/', async (req, res) => res.status(201).json({ data: await save(req.body) }));
projects.put('/:id', async (req, res) =>
  res.json({ data: await save(req.body, String(req.params.id)) }),
);
projects.patch('/:id', async (req, res) => {
  const data = z
    .object({
      published: z.boolean().optional(),
      featured: z.boolean().optional(),
      sortOrder: z.number().int().min(0).optional(),
    })
    .strict()
    .parse(req.body);
  res.json({
    data: await db.project.update({
      where: { id: String(req.params.id) },
      data,
      include: projectInclude,
    }),
  });
});
projects.post('/:id/duplicate', async (req, res) => {
  const p = await db.project.findUniqueOrThrow({
    where: { id: String(req.params.id) },
    include: projectInclude,
  });
  res.status(201).json({
    data: await save({
      ...p,
      title: `${p.title} (copy)`,
      slug: `${p.slug}-copy-${Date.now().toString(36)}`,
      published: false,
      featured: false,
      technologies: p.technologies.map((t) => t.technology.name),
      gallery: p.gallery.map((g) => ({ mediaId: g.mediaId, layout: g.layout })),
    }),
  });
});
projects.delete('/:id', async (req, res) => {
  await db.project.delete({ where: { id: String(req.params.id) } });
  res.json({ data: { ok: true } });
});
