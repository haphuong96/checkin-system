# Checkin System

A NestJS REST API for a daily check-in feature that awards points to users on a configurable schedule.

## Tech stack

- **NestJS 11** — framework
- **Prisma 7** — ORM (PostgreSQL adapter)
- **PostgreSQL 18** — primary database (Docker)
- **Redis** — distributed lock (Redlock) + check-in marker cache (ioredis)
- **TypeScript** (`module: nodenext`)

## Prerequisites

- Node.js ≥ 20
- Docker (for PostgreSQL and Redis)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** — create `.env` in the project root:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/checkin_system?schema=public"
   REDIS_URL="redis://localhost:6379"
   ```

3. **Start infrastructure**

   ```bash
   docker compose up -d
   ```

4. **Run migrations and seed**

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. **Start the server**

   ```bash
   npm run start:dev   # watch mode
   ```

   The API listens on `http://localhost:3001`.

## API

### Users

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users` | Create a user |
| `GET` | `/users/:id` | Get user profile |

**POST /users** — body:
```json
{ "name": "Alice" }
```

---

### Check-in

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/check-in/statuses?userId=` | Current month day statuses |
| `POST` | `/check-in` | Perform a check-in |

Check-in is only allowed during **09:00–11:00** and **19:00–22:00** Vietnam time. Maximum 7 check-ins per calendar month; points follow this schedule:

| Day | Points |
|-----|--------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 5 |
| 5 | 8 |
| 6 | 13 |
| 7 | 21 |

**POST /check-in** — body:
```json
{ "userId": 1 }
```

**GET /check-in/statuses** — response:
```json
[
  { "day": "DAY-1", "pointsAdded": 1, "checkedIn": true },
  { "day": "DAY-2", "pointsAdded": 2, "checkedIn": false }
]
```

---

### Check-in Histories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/check-in-histories?userId=&page=&limit=` | Paginated points history |

`page` defaults to `1`, `limit` defaults to `10` (max `100`).

**Response:**
```json
{
  "data": [
    { "id": 3, "date": "2026-06-29", "score": 3 }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

## Project structure

```
src/
├── check-in/               # Check-in action + monthly status
│   ├── dto/
│   ├── check-in.controller.ts
│   ├── check-in.service.ts
│   ├── check-in.types.ts
│   └── check-in.module.ts
├── check-in-histories/     # Paginated points history (read-only)
│   ├── dto/
│   ├── check-in-histories.controller.ts
│   ├── check-in-histories.service.ts
│   ├── check-in-histories.types.ts
│   └── check-in-histories.module.ts
├── users/                  # User creation + profile
├── prisma/                 # Global PrismaModule + PrismaService
├── redis/                  # Global RedisModule (ioredis + Redlock)
└── app.module.ts
```

## Postman collection

Import [`docs/checkin-system.postman_collection.json`](docs/checkin-system.postman_collection.json) into Postman. The `{{baseUrl}}` variable is pre-set to `http://localhost:3001`.
