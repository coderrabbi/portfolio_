import { z } from 'zod';
const text = (max = 500) => z.string().trim().max(max);
export const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => !v || /^https?:\/\/[^\s]+$/i.test(v) || /^\/(?!\/)[\w/.-]+$/.test(v),
    'Use an HTTP(S) URL or a local asset path',
  );
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens')
  .max(150);
export const blockSchema = z.object({ title: text(160).min(1), body: text(20000).min(1) });
export const projectSchema = z.object({
  title: text(160).min(2),
  slug,
  excerpt: text(500).min(10),
  description: text(20000).default(''),
  client: text(160).default(''),
  projectType: text(120).default(''),
  year: z.coerce.number().int().min(2000).max(2100),
  role: text(160).default(''),
  thumbnail: safeUrl.default(''),
  coverImage: safeUrl.default(''),
  videoUrl: safeUrl.default(''),
  liveUrl: safeUrl.default(''),
  githubUrl: safeUrl.default(''),
  content: z.array(blockSchema).max(40).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  seoTitle: text(160).default(''),
  seoDescription: text(320).default(''),
  categoryId: z.string().nullable().default(null),
  technologies: z.array(text(80).min(1)).max(30).default([]),
  gallery: z
    .array(
      z.object({
        mediaId: z.string(),
        layout: z.enum(['portrait', 'landscape', 'full-width']).default('landscape'),
      }),
    )
    .max(30)
    .default([]),
});
export type ProjectInput = z.infer<typeof projectSchema>;
export const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(256),
});
export const contactSchema = z.object({
  name: text(120).min(2),
  email: z.email().max(200),
  company: text(160).default(''),
  projectType: text(100).min(2),
  budget: text(100).default(''),
  message: text(5000).min(20),
  website: text().default(''),
});
export type ContactInput = z.infer<typeof contactSchema>;
const ordering = { sortOrder: z.coerce.number().int().min(0).default(0) };
export const categorySchema = z.object({ name: text(100).min(1), slug, ...ordering });
export const skillCategorySchema = z.object({ name: text(100).min(1), ...ordering });
export const serviceSchema = z.object({
  title: text(160).min(2),
  description: text(3000).min(10),
  icon: text(40).default('code'),
  published: z.boolean().default(true),
  ...ordering,
});
export const skillSchema = z.object({
  name: text(100).min(1),
  categoryId: z.string().min(1),
  published: z.boolean().default(true),
  ...ordering,
});
export const experienceSchema = z
  .object({
    company: text(160).min(1),
    position: text(160).min(1),
    employmentType: text(100).default('Freelance'),
    startDate: z.string().regex(/^\d{4}-\d{2}$/),
    endDate: z
      .string()
      .regex(/^(\d{4}-\d{2})?$/)
      .default(''),
    description: text(5000).min(10),
    technologies: z.array(text(80)).default([]),
    logo: safeUrl.default(''),
    website: safeUrl.default(''),
    published: z.boolean().default(true),
    ...ordering,
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'End date must follow start date',
  });
export const testimonialSchema = z.object({
  name: text(120).min(2),
  company: text(160).default(''),
  avatar: safeUrl.default(''),
  review: text(3000).min(10),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  projectId: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  ...ordering,
});
export const settingsSchema = z.object({
  name: text(120).min(1),
  monogram: text(10).min(1),
  title: text(180).min(1),
  introduction: text(1000).min(10),
  heroLines: z.array(text(50).min(1)).min(1).max(4),
  email: z.email(),
  availability: text(160),
  available: z.boolean(),
  location: text(160),
  timezone: text(80),
  aboutTitle: text(200),
  about: text(5000),
  philosophy: text(1000),
  portrait: safeUrl,
  heroPortrait: safeUrl.default(''),
  demoMode: z.boolean().default(true),
  resumeUrl: safeUrl,
  stats: z
    .array(
      z.object({ value: z.coerce.number().min(0).max(100000), suffix: text(10), label: text(80) }),
    )
    .max(8),
  socials: z
    .array(
      z.object({
        label: text(60).min(1),
        url: safeUrl.refine((v) => /^https?:/.test(v), 'Use an HTTP(S) URL'),
      }),
    )
    .max(10),
  footerText: text(300),
  seoTitle: text(160),
  seoDescription: text(320),
  logo: safeUrl,
  favicon: safeUrl,
  showTestimonials: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;
export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}
export interface MediaRecord {
  id: string;
  name: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  size: number;
  createdAt: string;
}
export interface Project extends Omit<ProjectInput, 'technologies' | 'gallery'> {
  id: string;
  category: Category | null;
  technologies: { technology: { id: string; name: string } }[];
  gallery: { id: string; layout: string; media: MediaRecord }[];
  createdAt: string;
  updatedAt: string;
}
export interface Service extends z.infer<typeof serviceSchema> {
  id: string;
}
export interface Skill extends z.infer<typeof skillSchema> {
  id: string;
  category: { id: string; name: string };
}
export interface Experience extends z.infer<typeof experienceSchema> {
  id: string;
}
export interface Testimonial extends z.infer<typeof testimonialSchema> {
  id: string;
}
export interface Message extends Omit<ContactInput, 'website'> {
  emailStatus?: string;
  emailAttempts?: number;
  emailError?: string | null;
  emailProviderId?: string | null;
  id: string;
  read: boolean;
  status: 'New' | 'Replied' | 'Archived';
  createdAt: string;
}
export interface Portfolio {
  settings: Settings;
  projects: Project[];
  categories: Category[];
  services: Service[];
  skills: Skill[];
  experience: Experience[];
  testimonials: Testimonial[];
}
