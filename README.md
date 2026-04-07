# Arogya Drishti

> Centralised Medical Intelligence Platform for Defence Personnel

---

## Quick Start (Docker — recommended)

**Prerequisites**: Docker 24+, Docker Compose v2

```bash
# Clone / enter the project
cd "Arogya Drishti (1)"

# Copy backend env and set secrets
cp arogya-drishti-backend/.env.example arogya-drishti-backend/.env
# Edit .env and set strong values for JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL

# Build and start all services
cd docker
docker compose up --build -d

# Run DB migrations and seed (first run only)
docker exec arogya-backend npx prisma migrate deploy
docker exec arogya-backend npx ts-node prisma/seed.ts
```

Services:
| Service  | URL                        |
|----------|---------------------------|
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:3001      |
| Postgres | localhost:5432             |
| Redis    | localhost:6379             |

---

## Local Development

### Prerequisites

- Node.js 20+ (LTS recommended)
- PostgreSQL 16
- Redis 7

### Backend

```bash
cd arogya-drishti-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx ts-node prisma/seed.ts

# Start dev server (with hot-reload)
npm run dev
```

Backend runs on **http://localhost:3001**

### Frontend

```bash
cd arogya-drishti-frontend

# Dependencies already installed — just start
npm run dev
```

Frontend runs on **http://localhost:3000**

---

## Default Credentials (seed data)

| Username      | Password         | Role       |
|---------------|-----------------|------------|
| admin         | Admin@12345678  | ADMIN      |
| dr.sharma     | Admin@12345678  | DOCTOR     |
| dr.verma      | Admin@12345678  | DOCTOR     |
| paramedic1    | Admin@12345678  | PARAMEDIC  |
| col.singh     | Admin@12345678  | COMMANDER  |
| col.reddy     | Admin@12345678  | COMMANDER  |

> **Change all passwords before first deployment.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router)  :3000                         │
│  - Login → role-based redirect                          │
│  - Doctor Dashboard (patient records + vitals)          │
│  - Commander Dashboard (aggregated analytics, zero PII) │
│  - Individual Portal (own health record)                │
│  - Admin Console (user mgmt + audit logs)               │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTPS / Bearer JWT
┌───────────────────▼─────────────────────────────────────┐
│  Express v5 + TypeScript  :3001                         │
│  - JWT HS256 (access 15m, refresh 7d via httpOnly cookie│
│  - RBAC: ADMIN / DOCTOR / PARAMEDIC / COMMANDER /       │
│          INDIVIDUAL                                     │
│  - Audit logging (all mutations, PII redacted)          │
│  - Helmet, CORS, Rate-limiting (100 req/min)            │
└───────┬───────────────────────────────┬─────────────────┘
        │ Prisma ORM                    │ ioredis
┌───────▼──────────┐           ┌────────▼────────────────┐
│  PostgreSQL 16   │           │  Redis 7                │
│  (10 models)     │           │  (session / rate-limit) │
└──────────────────┘           └─────────────────────────┘
```

---

## API Reference

See [API_SPECIFICATION.md](API_SPECIFICATION.md) for the full OpenAPI spec.

Key endpoints:

| Method | Path                                    | Access              |
|--------|-----------------------------------------|---------------------|
| POST   | /api/v1/auth/login                      | Public              |
| POST   | /api/v1/auth/refresh                    | Public (cookie)     |
| GET    | /api/v1/individuals                     | DOCTOR, PARAMEDIC, ADMIN |
| GET    | /api/v1/individuals/:svcNo              | DOCTOR+, INDIVIDUAL (own) |
| POST   | /api/v1/individuals/:svcNo/vitals       | DOCTOR, PARAMEDIC   |
| GET    | /api/v1/analytics/fitness-summary       | COMMANDER+          |
| GET    | /api/v1/analytics/deployment-readiness  | COMMANDER+          |
| GET    | /api/v1/admin/users                     | ADMIN               |
| GET    | /api/v1/admin/audit-logs                | ADMIN               |

---

## Security Controls

- **Authentication**: JWT HS256, `alg:none` attack prevented via `algorithms` pin
- **Session**: Refresh token rotation, SHA-256 hashed server-side storage, httpOnly cookie
- **RBAC**: Commanders explicitly denied access to individual medical diagnoses
- **Transport**: TLS enforced in production; HSTS header set
- **Headers**: X-Content-Type-Options, X-Frame-Options (DENY), CSP, Referrer-Policy
- **Audit**: Immutable audit log for all write operations; PII fields stripped from logs
- **Passwords**: bcrypt cost 12; minimum 10 chars

See [SECURITY-BLUEPRINT.md](SECURITY-BLUEPRINT.md) for the full threat model.

---

## Project Structure

```
Arogya Drishti (1)/
├── arogya-drishti-backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Data models
│   │   └── seed.ts                # Sample data
│   ├── src/
│   │   ├── controllers/           # Request handlers (9 modules)
│   │   ├── middleware/            # auth.ts, rbac.ts
│   │   ├── routes/                # Express routers (8 modules)
│   │   ├── services/              # audit.service.ts
│   │   ├── utils/                 # response.ts, params.ts
│   │   ├── validators/            # Zod schemas
│   │   ├── config/                # env.ts, database.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma.config.ts           # Prisma 7 migrate config
│   └── package.json
├── arogya-drishti-frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/             # Login page
│   │   │   ├── dashboard/
│   │   │   │   ├── doctor/        # Doctor + Paramedic view
│   │   │   │   ├── commander/     # Commander analytics
│   │   │   │   ├── me/            # Individual portal
│   │   │   │   └── admin/         # Admin console
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx           # Root redirect
│   │   ├── components/            # Shared UI components
│   │   ├── contexts/              # AuthContext
│   │   └── lib/                   # api.ts
│   └── package.json
└── docker/
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── docker-compose.yml
```
