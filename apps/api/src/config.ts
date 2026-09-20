import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
  MAIL_PROVIDER: z.enum(['disabled', 'resend']).default('disabled'),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_TO: z.email().default('coderrabbi@gmail.com'),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.url().default('http://127.0.0.1:3000'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('127.0.0.1'),
  TRUST_PROXY: z.string().default('loopback'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  STORAGE_DRIVER: z.enum(['local', 'cloudinary', 'database']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});
export const config = schema.parse(process.env);
if (
  config.STORAGE_DRIVER === 'cloudinary' &&
  (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET)
)
  throw new Error('Cloudinary storage requires its cloud name, API key, and API secret');
if (config.NODE_ENV === 'production' && !config.FRONTEND_URL.startsWith('https://'))
  throw new Error('Production FRONTEND_URL must use HTTPS');

if (
  config.MAIL_PROVIDER === 'resend' &&
  (!config.RESEND_API_KEY || !z.email().safeParse(config.MAIL_FROM).success)
)
  throw new Error('Resend requires RESEND_API_KEY and a verified MAIL_FROM email address');
if (config.NODE_ENV === 'production' && config.MAIL_PROVIDER === 'disabled')
  throw new Error('Configure transactional email before starting in production');
