# Sakany

Sakany is a Next.js marketplace for student housing near ESPRIT in Tunis.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL on Supabase
- JWT auth

## Clean architecture

- `apps/web` is the only app.
- `apps/web/app/api` contains the backend routes.
- `apps/web/prisma/schema.prisma` is the only schema.
- `packages/shared` holds shared enums and interfaces.

## Environment

Create `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="change-me-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For Supabase:

- `DATABASE_URL` should be the pooled connection string.
- `DIRECT_URL` should be the direct connection string for migrations.

## Local setup

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## URLs

- Web: `http://localhost:3000`

## Test accounts

- Landlord: `proprietaire@example.com`
- Student: `etudiant@esprit.tn`
- Password: `password123`

## What is no longer part of the stack

- Docker database setup
- pgAdmin-based workflow

## Notes

- Auth tokens are stored in `localStorage` for now.
- The frontend talks to same-origin `/api` routes.
- Listing, review, photo, and auth flows all run through the Next.js app.
