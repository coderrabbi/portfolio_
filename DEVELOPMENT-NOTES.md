# Golam Rabbi — Portfolio Studio

A responsive portfolio with an editable CMS, private project previews, PostgreSQL persistence, and a portrait integrated into an interactive blue orbital hero.

## Local preview

- Portfolio: http://127.0.0.1:3000
- Admin: http://127.0.0.1:3000/admin
- Development login: `admin@example.test` / `Development-only-change-me-2026!`

These credentials are for the local demo only. The supplied demo content, statistics, project outcomes, and contact address must be replaced with verified information before publishing. The demo notice can be disabled in admin settings when that work is complete.

## Install and run

Requires Node.js 24, npm, and PostgreSQL 18 (or Docker Compose). Run commands from this directory unless stated otherwise.

```sh
npm ci
```

Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env.local`. Choose a unique admin password of at least 16 characters before seeding a new database. Start PostgreSQL:

```sh
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The example database uses port 5433; adjust `DATABASE_URL` if using your own PostgreSQL server. The preview prepared on this machine uses a separate local database on port 55439. Open `http://127.0.0.1:3000`, consistently using that hostname for cookie and Origin checks.

Seed operations preserve existing content and accounts. Changing `ADMIN_PASSWORD` after the account exists does not rotate its password. There is no public registration or password-reset endpoint.

## Architecture

- `apps/web`: Next.js App Router, React, TypeScript, Tailwind/CSS, React Hook Form, Zod and TanStack Query.
- `apps/api`: Express, Prisma, PostgreSQL, Argon2 password hashing and server-side sessions.
- `packages/shared`: shared validation schemas and content contracts.
- `apps/api/prisma`: schema, committed migration, and repeatable seed.
- `apps/web/public/images`: optimized portrait and portfolio artwork.

The browser uses same-origin `/api` and `/uploads` paths. Next.js rewrites these to `BACKEND_URL`. Public pages read current published database content; drafts require an authenticated admin preview. The API must be reachable while rendering database-backed pages.

## Admin capabilities

Manage projects, publication, featured status, order, categories, technologies, images, structured case-study sections and SEO. Manage services, skill categories/skills, experience, testimonials, media and site settings. Read, archive, mark replied, or delete contact messages. Upload images, edit alternative text, and select assets in the project and settings editors. Referenced media cannot be deleted until its references are removed.

Contact submissions are stored in PostgreSQL and queued for server-side Resend notification delivery. Replies from Gmail address the original visitor through Reply-To. The admin Reply action still opens your email client.

## Motion and accessibility

The hero combines the supplied portrait with a Three.js orbital scene, blue lighting, depth and soft masking. GSAP section reveals, Lenis scrolling, magnetic links and restrained project-card tilt support the visual direction. WebGL failures use a CSS fallback; offscreen rendering pauses. Operating-system reduced-motion preferences and the footer's persistent motion toggle disable animated effects. The interface includes labeled inputs, keyboard-operated dialogs, mobile navigation and visible focus states.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Integration tests require a migrated and seeded database with the development admin configuration. Prefer a dedicated test database; tests create and clean up their own records. They cover authentication, protected routes, Origin rejection, draft isolation, project publication and duplication, media validation and references, contact persistence, content CRUD, settings and session revocation.

The prepared preview was additionally checked in a browser for mobile navigation, filtering, case studies, admin login, draft editing and private previews. Responsive overflow checks covered widths from 320 to 1920 pixels.

## Production setup

1. Configure a durable PostgreSQL database and unique admin credentials; migrate and seed before running the web application.
2. Set the API's `NODE_ENV=production` and `FRONTEND_URL` to the public HTTPS origin. Set web `SITE_URL` to the same origin and `BACKEND_URL` to the internal API address.
3. Run `npm run build`, then `npm run start -w @gr/api` and `npm run start -w @gr/web` under a process supervisor. Bind `HOST` and Next's hostname appropriately for the hosting platform.
4. Terminate HTTPS at a trusted reverse proxy. Keep the API private where possible and set `TRUST_PROXY` for the actual topology; do not trust arbitrary proxy headers.
5. Persist the local upload directory across releases, or select `STORAGE_DRIVER=cloudinary` and supply its credentials. Back up both the database and locally stored media.
6. Replace sample content, contact/social links, SEO metadata, and résumé URL in the CMS. Review image permissions before publishing.

Production cookies are HTTP-only, secure and SameSite=Lax. Sessions expire after eight hours and logout revokes the stored token. Mutating requests require the configured Origin. Login/contact rate limits are in memory; use a shared rate-limit store for multiple API instances. Cloudinary and external hosting require your credentials and were not exercised in this local preview. This delivery is running locally, not published to an external domain.

## Image provenance

`rabby-original.webp` is an optimized copy of the user-supplied `rabby.jpg`, displayed in About. `rabby-hero.webp` is a transparent-background version generated from that photograph and composed with code-based lighting and orbit rings. The image-edit instruction was to remove the brick/wall/gate background while preserving the person's identity, pose, facial features, hair, beard, shirt and tie, with genuine transparency and no stylization. AI processing may reconstruct small details; the original remains available separately.

The scooter cover is AI-generated illustrative demo artwork. Other project artwork is included for sample case studies, not presented as evidence of delivered client work. Fonts are bundled via Fontsource; their licenses are included with the installed font packages. Icons use Lucide.

## Outstanding dependency audit

The final npm audit reports four high-severity findings in Prisma 7.10.0 and its transitive tooling dependencies (deepmerge-ts and mysql2). The application uses PostgreSQL, not MySQL, but the dependency findings remain unresolved and should be reviewed before deployment. An automatic forced fix proposes a Prisma major-version downgrade; that was not applied. The build and integration checks pass, which does not resolve these advisories.

## Activate contact email delivery

The receiving inbox is **coderrabbi@gmail.com**. Email is sent by the Express server using Resend over HTTPS; it does not depend on the visitor having a mail application installed.

1. Create a Resend API key with sending access and verify a domain you own in Resend, including its required DNS records. See [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction).
2. Add these **server-only** variables to your hosting secrets or `apps/api/.env` for the local preview:

```dotenv
MAIL_PROVIDER=resend
RESEND_API_KEY=your-private-resend-key
MAIL_FROM=contact@your-verified-domain.com
MAIL_TO=coderrabbi@gmail.com
```

Use an actual verified sender for MAIL_FROM, not your Gmail address or the example above. Never put the key in a NEXT_PUBLIC variable, commit it, or paste it into browser code. Restart the API after configuring it. Production startup refuses disabled or incomplete email configuration. The current local configuration leaves sending disabled until real credentials are supplied.

3. Keep the API running as a persistent service. Run migrations before upgrading. The worker polls every five seconds and stores its queue in PostgreSQL; it does not rely on an in-memory job list.
4. Submit a contact inquiry, inspect its email status in Admin → Messages, and verify receipt in Gmail. **accepted** means Resend accepted the request, not proof of inbox placement. Check Resend delivery/bounce events for final delivery results. No external delivery has been tested without your credentials.

The queue retries temporary network errors, HTTP 429/408 and server errors with exponential delays, up to six attempts. Multiple workers lease jobs atomically. A stable Resend idempotency key prevents duplicate provider requests during its retention window; retries stop after 23 hours from the first attempt. Permanent failures remain visible in the admin inbox. Messages saved while sending is disabled are pending and will be processed when delivery is enabled; review that queue before enabling a production key. Existing messages created before this feature are marked not_requested and are not sent retroactively.

Rate limiting, Origin validation, input validation and the honeypot remain active. Use a shared rate-limit store when running multiple public API instances. The worker logs only record IDs and safe error codes. No automatic replies are sent to unverified visitors.

Email queue tests require a separate migrated database named portfolio_email_test. Set DATABASE_URL to that database and run `npm run test:email -w @gr/api`. This suite uses mocked provider responses and never sends real emails.
