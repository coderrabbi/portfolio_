import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  // Use a direct connection for CLI migrations; the app keeps DATABASE_URL.
  datasource: { url: process.env.DIRECT_URL || env('DATABASE_URL') },
});
