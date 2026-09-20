import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import { db } from '../dist/apps/api/src/db.js';
import {
  emailPayload,
  sendNotification,
  deliverNext,
  DeliveryError,
} from '../dist/apps/api/src/email.js';
// This suite must use an isolated database: it exercises the real queue claimant.
if (!process.env.DATABASE_URL?.includes('portfolio_email_test'))
  throw new Error('Use the isolated portfolio_email_test database');
after(() => db.$disconnect());
const inquiry = {
  name: 'Mail verification',
  email: 'visitor@example.test',
  company: 'Example',
  projectType: 'Full-stack application',
  budget: '',
  message: 'A test inquiry with <script>alert(1)</script> & quotation marks.',
};
const options = {
  key: 'test-only-placeholder',
  from: 'contact@example.test',
  to: 'coderrabbi@gmail.com',
};
test('transactional email and durable queue', async (t) => {
  await db.contactMessage.deleteMany();
  const job = await db.contactMessage.create({
    data: { ...inquiry, emailStatus: 'pending', emailNextAttemptAt: new Date() },
  });
  await t.test('fixed recipient, reply-to and escaped HTML', () => {
    const payload = emailPayload(job, options.from, options.to);
    assert.deepEqual(payload.to, ['coderrabbi@gmail.com']);
    assert.equal(payload.reply_to, inquiry.email);
    assert.ok(payload.html.includes('&lt;script&gt;'));
    assert.ok(!payload.html.includes('<script>'));
    assert.ok(payload.text.includes('<script>'));
  });
  await t.test('Resend request uses stable idempotency key and timeout', async () => {
    let request;
    const mock = async (url, init) => {
      request = { url, ...init };
      return new globalThis.Response(JSON.stringify({ id: 'provider-test' }), { status: 200 });
    };
    assert.equal(await sendNotification(job, mock, options), 'provider-test');
    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.equal(request.headers['Idempotency-Key'], `contact/${job.id}`);
    assert.ok(request.signal);
    assert.equal(JSON.parse(request.body).from, options.from);
  });
  await t.test('temporary failures retry; authentication failures are terminal', async () => {
    for (const [status, retry] of [
      [429, true],
      [503, true],
      [401, false],
      [422, false],
    ])
      await assert.rejects(
        sendNotification(job, async () => new globalThis.Response('{}', { status }), options),
        (e) => e instanceof DeliveryError && e.retryable === retry,
      );
  });
  await t.test('transient failure retains inquiry and schedules retry', async () => {
    await deliverNext(async () => {
      throw new DeliveryError('provider_http_503', true);
    });
    const saved = await db.contactMessage.findUniqueOrThrow({ where: { id: job.id } });
    assert.equal(saved.emailStatus, 'pending');
    assert.equal(saved.emailAttempts, 1);
    assert.ok(saved.emailNextAttemptAt > new Date());
    assert.equal(saved.message, inquiry.message);
  });
  await t.test('concurrent workers claim once and accepted emails never repeat', async () => {
    await db.contactMessage.update({
      where: { id: job.id },
      data: { emailNextAttemptAt: new Date() },
    });
    let sends = 0;
    await Promise.all([
      deliverNext(async () => {
        sends++;
        return 'accepted-test';
      }),
      deliverNext(async () => {
        sends++;
        return 'accepted-test';
      }),
    ]);
    assert.equal(sends, 1);
    assert.equal(
      (await db.contactMessage.findUniqueOrThrow({ where: { id: job.id } })).emailStatus,
      'accepted',
    );
    assert.equal(
      await deliverNext(async () => {
        throw new Error('Must not send twice');
      }),
      false,
    );
  });
  await t.test('permanent failure is visible without losing the message', async () => {
    const terminal = await db.contactMessage.create({
      data: { ...inquiry, emailStatus: 'pending', emailNextAttemptAt: new Date() },
    });
    await deliverNext(async () => {
      throw new DeliveryError('provider_http_401', false);
    });
    assert.equal(
      (await db.contactMessage.findUniqueOrThrow({ where: { id: terminal.id } })).emailStatus,
      'failed',
    );
  });
  await t.test('crashed final attempt is recovered as failed', async () => {
    const abandoned = await db.contactMessage.create({
      data: {
        ...inquiry,
        emailStatus: 'processing',
        emailAttempts: 6,
        emailNextAttemptAt: new Date(Date.now() - 1000),
      },
    });
    await deliverNext(async () => {
      throw new Error('Must not send');
    });
    assert.equal(
      (await db.contactMessage.findUniqueOrThrow({ where: { id: abandoned.id } })).emailStatus,
      'failed',
    );
  });
  await db.contactMessage.deleteMany();
});
