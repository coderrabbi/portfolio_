import 'server-only';
import { cache } from 'react';
import type { Portfolio, Project } from '@gr/shared';
export const siteUrl = process.env.SITE_URL || 'http://127.0.0.1:3000';
const backend = process.env.BACKEND_URL || 'http://127.0.0.1:4000';
export const getPortfolio = cache(async (): Promise<Portfolio> => {
  const res = await fetch(`${backend}/api/public/portfolio`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Portfolio is temporarily unavailable');
  return (await res.json()).data;
});
export const getProject = cache(async (slug: string): Promise<Project | null> => {
  const res = await fetch(`${backend}/api/public/projects/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Project is temporarily unavailable');
  return (await res.json()).data;
});
