import type { ContactMessage } from './generated/prisma/client.js';
import { db } from './db.js';
import { config } from './config.js';

export class DeliveryError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(code);
  }
}
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
export function emailPayload(message: ContactMessage, from: string, to: string) {
  const fields = [
    ['Name', message.name],
    ['Email', message.email],
    ['Company', message.company || 'Not provided'],
    ['Project', message.projectType],
    ['Budget', message.budget || 'Let’s discuss'],
  ];
  return {
    from,
    to: [to],
    reply_to: message.email,
    subject: 'New inquiry — coderrabbi portfolio',
    text: `New portfolio inquiry\n\n${fields.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nMessage:\n${message.message}\n\nReference: ${message.id}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;color:#172338"><h2>New portfolio inquiry</h2>${fields.map(([key, value]) => `<p><strong>${key}:</strong> ${escapeHtml(value)}</p>`).join('')}<hr><p style="white-space:pre-wrap">${escapeHtml(message.message)}</p><p style="color:#65738b;font-size:12px">Reference: ${escapeHtml(message.id)}</p></div>`,
  };
}
export async function sendNotification(
  message: ContactMessage,
  fetcher: typeof fetch = fetch,
  options = { key: config.RESEND_API_KEY, from: config.MAIL_FROM, to: config.MAIL_TO },
) {
  if (!options.key || !options.from) throw new DeliveryError('mail_not_configured', false);
  let response: Response;
  try {
    response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${options.key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `contact/${message.id}`,
      },
      body: JSON.stringify(emailPayload(message, options.from, options.to)),
    });
  } catch {
    throw new DeliveryError('provider_network_or_timeout', true);
  }
  if (!response.ok)
    throw new DeliveryError(
      `provider_http_${response.status}`,
      response.status === 429 || response.status === 408 || response.status >= 500,
    );
  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string')
    throw new DeliveryError('provider_invalid_response', true);
  return result.id;
}

// Atomically lease a durable job. SKIP LOCKED permits multiple API replicas.
// The HTTP request never waits for Resend, and a process restart cannot lose the inquiry.
export async function deliverNext(
  send: (message: ContactMessage) => Promise<string> = sendNotification,
) {
  await db.$executeRaw`UPDATE "ContactMessage" SET "emailStatus"='failed', "emailError"='retry_window_expired', "emailNextAttemptAt"=NULL WHERE "emailStatus" IN ('pending','processing') AND "emailFirstAttemptAt" < NOW() - INTERVAL '23 hours'`;
  await db.$executeRaw`UPDATE "ContactMessage" SET "emailStatus"='failed', "emailError"='attempt_limit_reached', "emailNextAttemptAt"=NULL WHERE "emailStatus"='processing' AND "emailAttempts">=6 AND "emailNextAttemptAt"<=NOW()`;
  const jobs = await db.$queryRaw<ContactMessage[]>`
    WITH candidate AS (
      SELECT id FROM "ContactMessage"
      WHERE "emailStatus" IN ('pending','processing') AND "emailNextAttemptAt" <= NOW() AND "emailAttempts" < 6
      ORDER BY "emailNextAttemptAt" LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    UPDATE "ContactMessage" AS message SET
      "emailStatus"='processing', "emailAttempts"=message."emailAttempts"+1,
      "emailFirstAttemptAt"=COALESCE(message."emailFirstAttemptAt",NOW()),
      "emailNextAttemptAt"=NOW()+INTERVAL '2 minutes'
    FROM candidate WHERE message.id=candidate.id RETURNING message.*`;
  const job = jobs[0];
  if (!job) return false;
  try {
    const providerId = await send(job);
    await db.contactMessage.updateMany({
      where: { id: job.id, emailStatus: 'processing', emailAttempts: job.emailAttempts },
      data: {
        emailStatus: 'accepted',
        emailProviderId: providerId,
        emailError: null,
        emailNextAttemptAt: null,
      },
    });
  } catch (error) {
    const code = error instanceof DeliveryError ? error.code : 'delivery_internal_error';
    const retry = (!(error instanceof DeliveryError) || error.retryable) && job.emailAttempts < 6;
    const delay = Math.min(60 * 60 * 1000, 30000 * 2 ** (job.emailAttempts - 1));
    await db.contactMessage.updateMany({
      where: { id: job.id, emailStatus: 'processing', emailAttempts: job.emailAttempts },
      data: {
        emailStatus: retry ? 'pending' : 'failed',
        emailError: code,
        emailNextAttemptAt: retry ? new Date(Date.now() + delay) : null,
      },
    });
    // Never log message bodies, recipient details, API keys or raw provider responses.
    console.error('Contact notification attempt failed', { id: job.id, code, retry });
  }
  return true;
}
export function startEmailWorker() {
  if (config.MAIL_PROVIDER === 'disabled') {
    console.warn(
      'Contact email delivery is disabled; inquiries are retained in the database queue.',
    );
    return async () => {};
  }
  let stopped = false,
    timer: ReturnType<typeof setTimeout> | undefined;
  let active: Promise<void> = Promise.resolve();
  const tick = async () => {
    try {
      for (let i = 0; i < 5 && !stopped; i++) {
        if (!(await deliverNext())) break;
      }
    } catch {
      console.error('Contact email worker could not access its queue');
    }
    if (!stopped) {
      timer = setTimeout(() => {
        active = tick();
      }, 5000);
      timer.unref();
    }
  };
  active = tick();
  return async () => {
    stopped = true;
    clearTimeout(timer);
    await active;
  };
}
