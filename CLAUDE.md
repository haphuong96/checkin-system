# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Repository layout

```
checkin-system/
├── docker-compose.yml          # PostgreSQL container (postgres:18.4-alpine, port 5433)
├── prisma/
│   ├── schema.prisma           # Prisma 7 schema (add models here)
│   └── migrations/             # Generated migration files
├── prisma.config.ts            # Prisma CLI config — reads DATABASE_URL for migrations
├── generated/prisma/           # Auto-generated Prisma client (do not edit)
└── src/
    ├── prisma/                 # Global PrismaModule + PrismaService + shared Prisma types
    ├── redis/                  # Global RedisModule — exports REDIS_CLIENT (ioredis) + REDLOCK (Redlock)
    ├── users/                  # POST /users, GET /users/:id
    ├── check-in/               # POST /check-in, GET /check-in/statuses — Redis lock + marker
    └── check-in-histories/     # GET /check-in-histories — paginated history, Postgres only
```

## Commands

All commands run from `checkin-system/`.

```bash
# Development
npm run start:dev       # watch mode
npm run start:debug     # watch + debugger

# Build & production
npm run build
npm run start:prod

# Tests
npm run test            # unit tests
npm run test:watch
npm run test:cov
npm run test:e2e

# Lint / format
npm run lint
npm run format

# Database (start container first)
docker compose up -d                          # from project root
npx prisma migrate dev --name <name>          # create + apply migration
npx prisma migrate deploy                     # apply existing migrations (prod)
npx prisma generate                           # regenerate client after schema changes
npx prisma studio                             # GUI
npm run db:seed                               # run seed script (if configured)
npm run db:reset                              # ⚠ drop + reapply all migrations + reseed (dev only)
```

## Architecture

**Stack:** NestJS 11, Prisma 7, PostgreSQL 18, TypeScript (`module: nodenext`).

**Database connection (Prisma 7 specifics):**

- Prisma 7 does not support `url` in `schema.prisma`. The connection URL lives in two places:
  - `prisma.config.ts` — used by the Prisma CLI for migrations
  - `PrismaService` constructor — uses `@prisma/adapter-pg` (`PrismaPg`) to pass `DATABASE_URL` at runtime
- After any schema change, run `npx prisma generate` to rebuild `generated/prisma/`.

**PrismaModule as the Prisma boundary:**
`PrismaModule` is `@Global()`, so `PrismaService` is available everywhere without re-importing the module. Access the client via `prismaService.prisma.<model>`.

Import everything Prisma-related (model types, `Prisma` namespace) from `../prisma/prisma.types` — never directly from `generated/prisma/`.

**Feature module file conventions:**

- `*.types.ts` — type definitions only (no runtime values)
- `*.mapper.ts` — functions that transform Prisma results into response shapes
- `*.service.ts` — business logic; may define private Prisma `include`/`select` constants
- `*.controller.ts` — HTTP layer; imports response types from the service

## Environment

`.env` (in project root):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/checkin_system?schema=public"
```

Docker container credentials: user `postgres`, password `postgres`, db `checkin_system`, host port `5433`.
