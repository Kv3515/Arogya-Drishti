# CLAUDE.md — Arogya Drishti Project Context

> Last updated: 2026-03-28

---

## Project Overview

**Project Name:** Arogya Drishti — Military Medical Intelligence Platform
**User:** KV (`skunwarvikram368@gmail.com`)
**Session Model:** claude-sonnet-4-6
**Platform:** Cowork mode (Claude Desktop App — Research Preview)

---

## Core Development Philosophy

> **A simple working dashboard beats a complex broken app. Always.**

The project started with too much infrastructure at once (JWT auth, refresh
tokens, RBAC, service workers, rate limiting) before any features were verified
working. This caused cascading debug cycles. Going forward:

1. **Features first. Security last.** Auth, RBAC, and refresh tokens are a
   hardening layer added in Phase 6 — not a prerequisite for building features.
2. **One page at a time.** A dashboard is not "done" until every button, chart,
   and form works with real database data. Verify fully before moving on.
3. **DEV_BYPASS_AUTH** — During Phases 1–5, the backend runs with
   `DEV_BYPASS_AUTH=true`. All requests are accepted without a JWT token.
   The frontend skips the auth flow and injects a mock admin user.
4. **Do not refactor working code.** The backend API is built and working.
   Consume it — don't rewrite it.
5. **No service worker complexity in dev.** The SW is pass-through only (already
   fixed). Keep it that way until production hardening.

---

## Build Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **1 — Admin Dashboard** | Users list, audit logs, create user | ✅ Complete |
| **2 — Doctor Dashboard** | Patient list, search, vitals log, medical history, injuries | ✅ Complete |
| **3 — Commander Dashboard** | Readiness grade, fitness summary, injury trends, unit selector | ✅ Complete |
| **4 — Individual Dashboard** | My health record, prescriptions, annual exams, injuries | ✅ Complete |
| **5 — Cross-role flows** | Doctor logs → Individual sees; Commander sees unit aggregate | 🔲 Pending |
| **6 — Auth hardening** | JWT login, RBAC guards, refresh tokens, session management | 🔲 Future |
| **7 — Remote access** | LAN/cloud deploy, HTTPS, environment config | 🔲 Future |

**Current phase: Phase 5 — Cross-role flows**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Backend | Express 5, TypeScript, Node.js |
| ORM | Prisma 7 with `@prisma/adapter-pg` (required for Prisma 7) |
| Database | PostgreSQL |
| Auth (future) | JWT access tokens + refresh tokens |

---

## Critical Technical Notes

- **Prisma 7 requires `@prisma/adapter-pg`** — do NOT remove it from database.ts.
  The `PrismaPg` adapter is mandatory for Prisma 7 with PostgreSQL.
- **`engineType = "library"` is INVALID in Prisma 7.6** — never add this to schema.prisma.
- **`router` from `useRouter()` must NOT be in useEffect deps** — causes infinite
  redirect loop in React 18 / Next.js 14 App Router.
- **Service worker is pass-through** — public/sw.js has no fetch handler. Keep it
  that way. Never add cacheFirst strategies or pre-caching.
- **Start servers with `fix-and-start.command`** — double-click from Finder.
  This kills existing processes, re-runs `prisma generate`, and starts both servers.

---

## Project Instructions

- **Always use the Ruflo agents swarm** for different tasks.
- All final outputs must be saved to the workspace folder.
- Read relevant SKILL.md before creating pptx/docx/xlsx/pdf files.

---

## Workspace Paths

| Purpose | Path |
|---------|------|
| Workspace (user-visible) | `/sessions/laughing-clever-keller/mnt/Arogya Drishti (1)/` |
| Backend | `…/arogya-drishti-backend/` |
| Frontend | `…/arogya-drishti-frontend/` |
| Backend .env | `…/arogya-drishti-backend/.env` |
| Frontend .env.local | `…/arogya-drishti-frontend/.env.local` |
| Start script | `…/fix-and-start.command` |
| Backend log | `/tmp/backend.log` (on user's Mac) |
| Frontend log | `/tmp/frontend.log` (on user's Mac) |

---

## Database Models (Prisma schema)

Unit → Individual → MedicalHistory, Prescription, VitalsLog, InjuryLog, AnnualMedicalExam
User (roles: super_admin, medical_officer, paramedic, commander, individual)
AuditLog, RefreshToken

**11 seeded users, 5 service individuals** already in the database.

---

## What's Working

- ✅ Backend starts on :3001 (Prisma adapter fixed)
- ✅ Frontend starts on :3000 (Next.js 14)
- ✅ PostgreSQL running on :5432
- ✅ Admin logs in as `admin` / `Admin@12345678`
- ✅ Admin dashboard: user list (11 users), audit logs, create user
- ✅ Doctor dashboard: patient list with search + fitness filter, patient detail header, vitals chart + log form, medical history timeline + add record, injuries list + log form
- ✅ Commander dashboard: readiness grade, fitness summary, injury trends, unit selector dropdown, personnel breakdown table
- ✅ Individual dashboard: profile card, health status overview, annual exams accordion, vitals chart, medication history, risk flags, injuries
- ✅ `fix-and-start.command` reliably starts both servers
- ✅ All Dashboards sidebar section gated behind DEV_BYPASS

## What's Not Yet Verified

- 🔲 Cross-role data flow: doctor logs → individual sees
- 🔲 Commander sees unit aggregate from doctor entries
