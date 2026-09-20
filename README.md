# coderrabbi — production project

Separate source snapshot prepared 20 September 2026. Includes the updated About section, portfolio, CMS, contact-email queue, images, Prisma schema and migrations, and optional HTML email template.

This is a deployable source project, not a static HTML upload. It requires a Node.js server and PostgreSQL. It has not been deployed. Do not upload this folder into a publicly served document directory.

## Production setup (single server)

Requirements: Node.js 24, npm, PostgreSQL 18, HTTPS reverse proxy, and a process supervisor.

1. Copy apps/api/.env.example to apps/api/.env, and apps/web/.env.example to apps/web/.env.local.
2. Set your production DATABASE_URL, a unique admin password, and private RESEND_API_KEY. The verified sender is contact@coderrabbi.me; destination is coderrabbi@gmail.com. Keep both environment files private.
3. FRONTEND_URL and SITE_URL must match the exact public HTTPS origin (change both if using www). BACKEND_URL is the private API address and must be configured before building.
4. From this project directory run:

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
```

5. Run these as two supervised services with automatic restarts:

```sh
npm run start -w @gr/api
npm run start -w @gr/web
```

6. Reverse proxy HTTPS traffic to 127.0.0.1:3000. Next.js forwards /api and /uploads to the API on 127.0.0.1:4000. Keep API and database ports private. TRUST_PROXY=loopback assumes this local proxy topology; configure it for your actual host.
7. Persist apps/api/uploads across releases, or configure Cloudinary. Back up the database and media. Use one API instance with the current in-memory rate limiter.

The included docker-compose.yml is for local database development only; it is not a production deployment definition.

## Your current content

The local database, admin accounts, sessions, contact messages, and uploaded-media directory are deliberately excluded. A fresh seed provides starter content; it does not reproduce edits stored in your current CMS. Migrate selected public content and referenced uploads separately if you want the exact local CMS state. Do not copy test contact messages or sessions into production.

Before going live, replace demo projects/statistics and other sample content through the CMS and turn off the demo notice after reviewing the content. Changing ADMIN_PASSWORD after a seeded account exists does not reset that account's password.

## Email

Enter your Resend key only in apps/api/.env or your hosting secret manager. The application already sends notification emails using its inline template. The optional email-template/coderrabbi-inquiry.html can be uploaded to Resend; using that hosted template requires connecting its published template ID in the server implementation.

## Verification and known limits

The source was built and linted successfully during the latest About-section change; the production copy excludes compiled output and must be rebuilt on its target host. Local website and API health checks passed when this package was created. No production database or hosting credentials have been configured or tested.

Previously reported high-severity Prisma tooling dependency advisories remain unresolved; review and resolve applicable findings before public deployment. See DEVELOPMENT-NOTES.md for architecture and prior validation details. Its localhost commands and demo credentials are historical development instructions, not production settings.

## Neon image storage (20 September 2026)

Set STORAGE_DRIVER=database to store optimized WebP image bytes in PostgreSQL/Neon. Apply all committed migrations before starting the API. Images are served through /uploads/:key.webp with immutable cache headers; the Next.js proxy forwards these requests to BACKEND_URL. Keep the backend running to serve images; Neon is the database, not a public image CDN. Existing database-backed media references work when using the same Neon database. API credentials remain server-only. Current portraits and local uploads were copied into Neon; local originals are retained as backups. A fresh demo seed still references bundled images. Database storage and transfer usage grows with uploaded images. This supersedes local-upload storage guidance above when using the database driver.
