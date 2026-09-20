import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth, HttpError } from '../middleware.js';
import { storeImage, deleteImage } from '../storage.js';
export const media = Router();
media.use(requireAuth);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) {
      cb(new HttpError(422, 'Only JPEG, PNG, WebP, and AVIF images are accepted.'));
      return;
    }
    cb(null, true);
  },
});
media.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const where = { name: { contains: String(req.query.q || ''), mode: 'insensitive' as const } };
  const [items, total] = await db.$transaction([
    db.media.findMany({ where, orderBy: { createdAt: 'desc' }, take: 24, skip: (page - 1) * 24 }),
    db.media.count({ where }),
  ]);
  res.json({ data: items, page, total, pages: Math.ceil(total / 24) });
});
media.post('/', upload.array('files', 8), async (req, res) => {
  const files = req.files;
  if (!Array.isArray(files) || !files.length)
    throw new HttpError(422, 'Choose at least one image.');
  const items = [];
  for (const file of files) {
    const stored = await storeImage(file.buffer);
    try {
      items.push(
        await db.media.create({
          data: {
            ...stored,
            name: file.originalname.slice(0, 200),
            alt: file.originalname.replace(/\.[^.]+$/, '').slice(0, 200),
          },
        }),
      );
    } catch (error) {
      await deleteImage(stored.driver, stored.storageKey);
      throw error;
    }
  }
  res.status(201).json({ data: items });
});
media.patch('/:id', async (req, res) => {
  const data = z.object({ alt: z.string().trim().max(300) }).parse(req.body);
  res.json({ data: await db.media.update({ where: { id: String(req.params.id) }, data }) });
});
media.delete('/:id', async (req, res) => {
  const item = await db.media.findUniqueOrThrow({
    where: { id: String(req.params.id) },
    include: { _count: { select: { projects: true } } },
  });
  const refs = await db.project.count({
    where: { OR: [{ thumbnail: item.url }, { coverImage: item.url }] },
  });
  const settings = await db.siteSetting.findUnique({ where: { id: 'main' } });
  const [experienceRefs, testimonialRefs] = await Promise.all([
    db.experience.count({ where: { logo: item.url } }),
    db.testimonial.count({ where: { avatar: item.url } }),
  ]);
  if (
    item._count.projects ||
    refs ||
    experienceRefs ||
    testimonialRefs ||
    JSON.stringify(settings?.data).includes(item.url)
  )
    throw new HttpError(409, 'This image is in use. Remove it from your content first.');
  await deleteImage(item.driver, item.storageKey);
  await db.media.delete({ where: { id: item.id } });
  res.json({ data: { ok: true } });
});
