import 'server-only';
import { cache } from 'react';
import { connection } from 'next/server';
import type { Portfolio, Project } from '@gr/shared';
export const siteUrl = process.env.SITE_URL || 'http://127.0.0.1:3000';
const backend = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
// Cache only public content. Admin requests and authentication remain uncached.
const publicFetchOptions =
  process.env.NODE_ENV === 'production'
    ? { next: { revalidate: 60 } }
    : { cache: 'no-store' as const };

export const getPortfolio = cache(async (): Promise<Portfolio> => {
  // Render on request without requiring a running API during the build.
  // Explicit fetch caching still allows reuse across visitor requests.
  await connection();
  const res = await fetch(`${backend}/api/public/portfolio`, publicFetchOptions);
  if (!res.ok) throw new Error('Portfolio is temporarily unavailable');
  return (await res.json()).data;
});
export const getProject = cache(async (slug: string): Promise<Project | null> => {
  await connection();
  const res = await fetch(
    `${backend}/api/public/projects/${encodeURIComponent(slug)}`,
    publicFetchOptions,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Project is temporarily unavailable');
  return (await res.json()).data;
});
