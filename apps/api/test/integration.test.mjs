import test, { after } from 'node:test';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import request from 'supertest';
import sharp from 'sharp';
import { app } from '../dist/apps/api/src/app.js';
import { db } from '../dist/apps/api/src/db.js';
import { contactSchema, projectSchema, safeUrl } from '../dist/packages/shared/src/index.js';

const origin = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
const agent = request.agent(app);
const created = { projects: [], messages: [], media: [], services: [] };
const unique = Date.now().toString(36);
after(async () => {
  await db.project.deleteMany({ where: { id: { in: created.projects } } });
  await db.contactMessage.deleteMany({ where: { id: { in: created.messages } } });
  await db.service.deleteMany({ where: { id: { in: created.services } } });
  await db.$disconnect();
});
test('validation rejects executable URLs and invalid contact data', () => {
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,test',
    '//evil.example',
    'file:///etc/passwd',
  ])
    assert.equal(safeUrl.safeParse(value).success, false);
  assert.equal(
    contactSchema.safeParse({ name: 'A', email: 'broken', message: 'short' }).success,
    false,
  );
  assert.equal(
    projectSchema.safeParse({
      title: 'Test',
      slug: 'Invalid Slug',
      year: 2026,
      excerpt: 'A useful excerpt',
    }).success,
    false,
  );
});
test('admin authentication, CSRF defense, project lifecycle, uploads, and contacts', async (t) => {
  await t.test('all admin endpoints reject unauthenticated reads', async () => {
    for (const path of [
      'projects',
      'settings',
      'messages',
      'media',
      'overview',
      'services',
      'skills',
      'categories',
      'testimonials',
      'experience',
    ])
      await request(app).get(`/api/${path}`).expect(401);
  });
  await t.test('foreign origin rejected and invalid credentials generic', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://foreign.example')
      .send({ email: 'unknown@example.test', password: 'wrong' })
      .expect(403);
    const bad = await request(app)
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email: 'unknown@example.test', password: 'wrong' })
      .expect(401);
    assert.equal(bad.body.error, 'Invalid email or password.');
  });
  await t.test('login uses HttpOnly SameSite cookie and session persists', async () => {
    const login = await agent
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
      .expect(200);
    assert.match(login.headers['set-cookie'][0], /HttpOnly/);
    assert.match(login.headers['set-cookie'][0], /SameSite=Lax/);
    await agent.get('/api/auth/me').expect(200);
  });
  let project, media;
  await t.test('draft creation does not leak through public endpoints', async () => {
    const res = await agent
      .post('/api/projects')
      .set('Origin', origin)
      .send({
        title: 'Integration test project',
        slug: `integration-${unique}`,
        excerpt: 'A real database integration test project.',
        year: 2026,
        technologies: ['TypeScript'],
        content: [{ title: 'Challenge', body: 'Validate the application against PostgreSQL.' }],
      })
      .expect(201);
    project = res.body.data;
    created.projects.push(project.id);
    await request(app).get(`/api/public/projects/${project.slug}`).expect(404);
    const all = await request(app).get('/api/public/portfolio').expect(200);
    assert.ok(!all.body.data.projects.some((p) => p.id === project.id));
  });
  await t.test('update, publish, feature, order, duplicate, and unpublish work', async () => {
    await agent
      .put(`/api/projects/${project.id}`)
      .set('Origin', origin)
      .send({
        ...project,
        title: 'Updated integration project',
        technologies: ['React', 'Node.js'],
        gallery: [],
      })
      .expect(200);
    await agent
      .patch(`/api/projects/${project.id}`)
      .set('Origin', origin)
      .send({ published: true, featured: true, sortOrder: 99 })
      .expect(200);
    const pub = await request(app).get(`/api/public/projects/${project.slug}`).expect(200);
    assert.equal(pub.body.data.title, 'Updated integration project');
    assert.equal(pub.body.data.technologies.length, 2);
    const copy = await agent
      .post(`/api/projects/${project.id}/duplicate`)
      .set('Origin', origin)
      .expect(201);
    created.projects.push(copy.body.data.id);
    assert.equal(copy.body.data.published, false);
    await agent
      .put('/api/projects/reorder')
      .set('Origin', origin)
      .send({ ids: [project.id, copy.body.data.id] })
      .expect(200);
    await agent
      .patch(`/api/projects/${project.id}`)
      .set('Origin', origin)
      .send({ published: false })
      .expect(200);
    await request(app).get(`/api/public/projects/${project.slug}`).expect(404);
  });
  await t.test('uploads validate actual bytes and produce optimized image records', async () => {
    await agent
      .post('/api/media')
      .set('Origin', origin)
      .attach('files', Buffer.from('<script>bad</script>'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(422);
    const buffer = await sharp({
      create: { width: 60, height: 40, channels: 3, background: '#477bff' },
    })
      .png()
      .toBuffer();
    const res = await agent
      .post('/api/media')
      .set('Origin', origin)
      .attach('files', buffer, { filename: 'integration-test.png', contentType: 'image/png' })
      .expect(201);
    media = res.body.data[0];
    assert.equal(media.mimeType, 'image/webp');
    assert.equal(media.width, 60);
    created.media.push(media.id);
    await request(app).get(media.url).expect(200);
    await agent
      .patch(`/api/media/${media.id}`)
      .set('Origin', origin)
      .send({ alt: 'Test blue image' })
      .expect(200);
    const p = (await agent.get(`/api/projects/${project.id}`)).body.data;
    await agent
      .put(`/api/projects/${project.id}`)
      .set('Origin', origin)
      .send({ ...p, technologies: [], gallery: [{ mediaId: media.id, layout: 'full-width' }] })
      .expect(200);
    await agent.delete(`/api/media/${media.id}`).set('Origin', origin).expect(409);
  });
  await t.test(
    'contact validation, honeypot, persistence, and message management work',
    async () => {
      await request(app).post('/api/contact').set('Origin', origin).send({ name: 'A' }).expect(422);
      const contact = {
        name: 'Integration Test',
        email: `test-${unique}@example.test`,
        company: 'QA',
        projectType: 'Full-stack application',
        budget: 'To discuss',
        message: 'This is an automated integration test contact message.',
      };
      await request(app)
        .post('/api/contact')
        .set('Origin', origin)
        .send({ ...contact, website: 'spam.example' })
        .expect(201);
      assert.equal(await db.contactMessage.count({ where: { email: contact.email } }), 0);
      await request(app).post('/api/contact').set('Origin', origin).send(contact).expect(201);
      const message = await db.contactMessage.findFirstOrThrow({ where: { email: contact.email } });
      created.messages.push(message.id);
      await agent
        .patch(`/api/messages/${message.id}`)
        .set('Origin', origin)
        .send({ read: true, status: 'Replied' })
        .expect(200);
      const saved = await db.contactMessage.findUniqueOrThrow({ where: { id: message.id } });
      assert.equal(saved.read, true);
      assert.equal(saved.status, 'Replied');
      await agent.delete(`/api/messages/${message.id}`).set('Origin', origin).expect(200);
    },
  );
  await t.test('content CRUD and settings persist in PostgreSQL', async () => {
    const res = await agent
      .post('/api/services')
      .set('Origin', origin)
      .send({
        title: 'Integration service',
        description: 'A service created during automated validation.',
        sortOrder: 99,
      })
      .expect(201);
    created.services.push(res.body.data.id);
    await agent
      .put(`/api/services/${res.body.data.id}`)
      .set('Origin', origin)
      .send({ ...res.body.data, title: 'Updated service' })
      .expect(200);
    await agent.delete(`/api/services/${res.body.data.id}`).set('Origin', origin).expect(200);
    const settings = (await agent.get('/api/settings').expect(200)).body.data;
    await agent.put('/api/settings').set('Origin', origin).send(settings).expect(200);
  });
  await t.test('project and orphaned upload deletion work', async () => {
    for (const id of created.projects)
      await agent.delete(`/api/projects/${id}`).set('Origin', origin).expect(200);
    await agent.delete(`/api/media/${media.id}`).set('Origin', origin).expect(200);
    await request(app).get(media.url).expect(404);
  });
  await t.test('logout revokes the persisted session', async () => {
    await agent.post('/api/auth/logout').set('Origin', origin).expect(200);
    await agent.get('/api/auth/me').expect(401);
  });
});
