import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import sharp, { type OutputInfo } from 'sharp';
import { config } from './config.js';
import { HttpError } from './middleware.js';
interface StoredImage {
  url: string;
  storageKey: string;
  driver: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
}
export async function storeImage(buffer: Buffer): Promise<StoredImage> {
  let image: Buffer, info: OutputInfo;
  try {
    const meta = await sharp(buffer, { limitInputPixels: 40000000 }).metadata();
    if (!['jpeg', 'png', 'webp', 'avif'].includes(meta.format || ''))
      throw new Error('Unsupported image');
    const result = await sharp(buffer, { limitInputPixels: 40000000 })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    image = result.data;
    info = result.info;
  } catch {
    throw new HttpError(422, 'Choose a valid JPEG, PNG, WebP, or AVIF image.');
  }
  const storageKey = randomUUID();
  if (config.STORAGE_DRIVER === 'cloudinary') {
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET,
    });
    const result = await cloudinary.uploader.upload(
      `data:image/webp;base64,${image.toString('base64')}`,
      { public_id: `portfolio/${storageKey}`, resource_type: 'image' },
    );
    return {
      url: result.secure_url,
      storageKey: result.public_id,
      driver: 'cloudinary',
      width: info.width,
      height: info.height,
      size: image.length,
      mimeType: 'image/webp',
    };
  }
  await mkdir(config.UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(config.UPLOAD_DIR, `${storageKey}.webp`), image);
  return {
    url: `/uploads/${storageKey}.webp`,
    storageKey,
    driver: 'local',
    width: info.width,
    height: info.height,
    size: image.length,
    mimeType: 'image/webp',
  };
}
export async function deleteImage(driver: string, key: string) {
  if (driver === 'cloudinary') {
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET,
    });
    await cloudinary.uploader.destroy(key);
  } else if (/^[\da-f-]+$/.test(key)) {
    await unlink(path.join(config.UPLOAD_DIR, `${key}.webp`)).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== 'ENOENT') throw e;
    });
  }
}
