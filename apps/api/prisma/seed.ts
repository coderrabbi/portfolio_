import 'dotenv/config';
import argon2 from 'argon2';
import { db } from '../src/db.js';
import { settingsSchema } from '../../../packages/shared/src/index.js';
const email = process.env.ADMIN_EMAIL,
  password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 16)
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters) before seeding.');
const settings = settingsSchema.parse({
  name: 'Golam Rabbi',
  monogram: 'coderrabbi',
  title: 'Creative Full-Stack Developer',
  introduction:
    'I create high-performance websites and digital experiences where development, motion, and design work together.',
  heroLines: ['CREATIVE', 'FULL-STACK', 'DEVELOPER'],
  email: 'hello@example.com',
  availability: 'Available for select projects',
  available: true,
  location: 'Working worldwide',
  timezone: 'UTC',
  aboutTitle: 'A creative mind.\nAn engineering mindset.',
  about:
    'I work at the intersection of design and development. From a carefully crafted WordPress storefront to a full-stack platform, I turn complex ideas into intuitive digital experiences.',
  philosophy:
    'Beautiful on the surface. Thoughtful under the hood. Every interaction should have a purpose, and every line of code should earn its place.',
  portrait: '/images/rabby-original.webp',
  heroPortrait: '/images/rabby-hero.webp',
  demoMode: true,
  resumeUrl: '',
  stats: [
    { value: 4, suffix: '+', label: 'Years exploring' },
    { value: 30, suffix: '+', label: 'Projects crafted' },
    { value: 18, suffix: '+', label: 'Technologies' },
    { value: 20, suffix: '+', label: 'Collaborations' },
  ],
  socials: [],
  footerText: 'LET’S CREATE\nSOMETHING\nMEMORABLE.',
  seoTitle: 'coderrabbi — Creative Full-Stack Developer',
  seoDescription:
    'Creative frontend development, scalable full-stack applications, and thoughtful WordPress experiences by Golam Rabbi.',
  logo: '',
  favicon: '/favicon.svg',
  showTestimonials: false,
});
async function main() {
  await db.user.upsert({
    where: { email: email!.toLowerCase() },
    create: { email: email!.toLowerCase(), passwordHash: await argon2.hash(password!) },
    update: {},
  });
  await db.siteSetting.upsert({
    where: { id: 'main' },
    create: { id: 'main', data: settings },
    update: {},
  });
  const categories = ['WooCommerce', 'Frontend', 'Full Stack', 'WordPress'];
  const titles = [
    'VOLT / Electric commerce',
    'ORBIT / Digital studio',
    'TOUCHLINE / Built for the game',
    'MOTION / Beyond the scroll',
  ];
  const names = [
    'volt-electric-commerce',
    'orbit-digital-studio',
    'touchline-tournament-platform',
    'motion-interactive-landing',
  ];
  const excerpts = [
    'A performance-first storefront for the next generation of urban mobility.',
    'An expressive digital home for a studio that refuses to stand still.',
    'A connected tournament experience, from the first fixture to the final whistle.',
    'A cinematic product story built with WordPress and expressive motion.',
  ];
  const stacks = [
    ['WordPress', 'WooCommerce', 'JavaScript', 'PHP'],
    ['Next.js', 'TypeScript', 'GSAP', 'Three.js'],
    ['Next.js', 'Node.js', 'Express', 'PostgreSQL', 'Prisma'],
    ['WordPress', 'Slider Revolution', 'JavaScript', 'GSAP'],
  ];
  for (let i = 0; i < 4; i++) {
    const category = await db.projectCategory.upsert({
      where: { name: categories[i] },
      create: {
        name: categories[i],
        slug: categories[i].toLowerCase().replace(/ /g, '-'),
        sortOrder: i,
      },
      update: {},
    });
    const technologies = await Promise.all(
      stacks[i].map((name) =>
        db.technology.upsert({ where: { name }, create: { name }, update: {} }),
      ),
    );
    await db.project.upsert({
      where: { slug: names[i] },
      update: {},
      create: {
        title: titles[i],
        slug: names[i],
        excerpt: excerpts[i],
        description:
          'An independent demonstration project exploring thoughtful interaction design, maintainable engineering, and an experience that works on every screen. This case study is sample portfolio content and does not represent a paid client engagement.',
        client: 'Independent concept',
        projectType: categories[i],
        year: 2026,
        role: 'Design & development',
        categoryId: category.id,
        featured: true,
        published: true,
        sortOrder: i,
        thumbnail: i === 0 ? '/images/volt.webp' : '',
        coverImage: i === 0 ? '/images/volt.webp' : '',
        technologies: { create: technologies.map((t) => ({ technologyId: t.id })) },
        content: [
          {
            title: 'The challenge',
            body: 'Make a complex experience feel effortless. The brief called for a distinct visual identity, clear information architecture, and an interface that remains fast and usable on smaller devices.',
          },
          {
            title: 'The approach',
            body: 'I started by mapping the most important user journeys, then built a focused design system around strong typography and purposeful interaction. Reusable components keep the experience consistent as the product grows.',
          },
          {
            title: 'Built with intention',
            body: 'The implementation separates presentation from business logic, validates incoming data, and favors progressive enhancement. Motion guides attention without blocking navigation. Keyboard interaction and reduced-motion preferences are built into the experience.',
          },
          {
            title: 'The outcome',
            body: 'A complete demonstration of the design direction and development approach. Performance and commercial results should be added here after measuring a real deployment; no client metrics are claimed for this concept.',
          },
        ],
      },
    });
  }
  const services = [
    [
      'WordPress & WooCommerce',
      'Custom WordPress experiences and thoughtfully built storefronts. Flexible for your team, fast for your customers.',
    ],
    [
      'Creative frontend',
      'Distinctive interfaces, expressive motion, and responsive experiences that feel as good as they look.',
    ],
    [
      'Full-stack applications',
      'From data models and REST APIs to intuitive interfaces. Reliable foundations for ambitious digital products.',
    ],
    [
      'Landing pages',
      'Focused product stories that make your offer clear and help visitors take the next step.',
    ],
    [
      'Website redesign',
      'Bring an existing experience forward with a stronger structure, clearer design, and modern development.',
    ],
    [
      'Performance optimization',
      'Careful measurement and targeted improvements for faster loading, smoother interaction, and better usability.',
    ],
    [
      'Custom web applications',
      'Purpose-built tools for workflows that deserve more than a generic solution.',
    ],
    [
      'Responsive design',
      'Layouts and interactions considered for every screen, from the smallest phone to the widest display.',
    ],
  ];
  for (const [i, [title, description]] of services.entries())
    await db.service.upsert({
      where: { id: `seed-service-${i}` },
      create: { id: `seed-service-${i}`, title, description, sortOrder: i },
      update: {},
    });
  const groups: Record<string, string[]> = {
    Frontend: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js'],
    Backend: ['Node.js', 'Express', 'REST APIs'],
    Database: ['PostgreSQL', 'MongoDB', 'Prisma'],
    CMS: ['WordPress', 'WooCommerce', 'Elementor', 'Slider Revolution'],
    Animation: ['GSAP', 'Three.js', 'Lenis'],
    Tools: ['Git', 'Figma', 'Docker'],
  };
  for (const [i, [name, skills]] of Object.entries(groups).entries()) {
    const category = await db.skillCategory.upsert({
      where: { name },
      create: { name, sortOrder: i },
      update: {},
    });
    for (const [j, name] of skills.entries())
      await db.skill.upsert({
        where: { id: `seed-skill-${i}-${j}` },
        create: {
          id: `seed-skill-${i}-${j}`,
          name,
          categoryId: category.id,
          sortOrder: i * 10 + j,
        },
        update: {},
      });
  }
  await db.experience.upsert({
    where: { id: 'seed-experience' },
    update: {},
    create: {
      id: 'seed-experience',
      company: 'Independent practice · sample entry',
      position: 'Creative Developer',
      employmentType: 'Freelance',
      startDate: '2022-01',
      description:
        'Sample experience entry. Replace this with your actual work history before publishing. Building thoughtful web experiences across WordPress, frontend development, and full-stack applications.',
      technologies: ['WordPress', 'React', 'Next.js', 'Node.js'],
    },
  });
  await db.testimonial.upsert({
    where: { id: 'seed-testimonial' },
    update: {},
    create: {
      id: 'seed-testimonial',
      name: 'Sample client',
      company: 'Demo content — replace before publishing',
      review:
        'This is a sample testimonial for previewing the layout. Add an authentic client review here before enabling testimonials.',
      published: false,
      featured: true,
    },
  });
  console.log(
    'Seed complete. Demo content is editable; testimonials are hidden. Existing content and passwords were preserved.',
  );
}
main().finally(() => db.$disconnect());
