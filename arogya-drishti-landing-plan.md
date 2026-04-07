# Arogya Drishti — Landing Page Implementation Plan

> Generated: 2026-04-07 | Phase 5 | Build: Landing Page at `/`

---

## 1. Design Rationale & Aesthetic Decisions

### Visual Language
The landing page is designed to communicate **operational authority** rather than generic SaaS.

| Decision | Rationale |
|----------|-----------|
| `#0a0f1e` navy-black background | Military operations room aesthetic — dark, focused, authoritative |
| `#14B8A6` teal accent (primary-500) | Already established brand color; connotes medical + technology |
| Particle network canvas | Tactical surveillance/intelligence metaphor; no heavy deps |
| Glassmorphism login card | Premium feel; the card floats above the field of data |
| Monospaced labels in UPPERCASE | Government/military document style — classification tags, field labels |
| Split hero layout (text left / card right) | Mirrors intelligence briefing: context on left, action on right |
| Classification footer bar | `UNCLASSIFIED // FOR OFFICIAL DEMO USE ONLY` — reinforces domain |

### Typography
- Headings: `Inter` ultra-black (`font-black`) with tight letter-spacing (`-0.02em`)
- Data labels: `font-mono` UPPERCASE with wide tracking (`tracking-[0.25em]`)
- Gradient headline: `AROGYA` in a sky-blue → teal gradient; `DRISHTI` in solid white

### Color roles
| Color | Hex | Usage |
|-------|-----|-------|
| Teal | `#14B8A6` | Primary accent — borders, icons, buttons, particles |
| Cyan | `#06B6D4` | Button gradient secondary stop |
| Green | `#22C55E` | Live system indicators |
| Purple | `#8B5CF6` | Commander role accent in feature cards |
| White/10–60% | transparent | Glass card fills, border strokes |

---

## 2. Component Architecture

```
app/page.tsx                        ← Orchestrator; handles auth redirect
├── components/landing/
│   ├── AnimatedBackground.tsx      ← Canvas particle network + grid overlay
│   ├── HeroSection.tsx             ← Full-screen hero (text left, login right)
│   │   ├── AnimatedBackground      ← Embedded (fills hero section)
│   │   └── LoginCard               ← Glassmorphism login form
│   ├── LoginCard.tsx               ← Standalone form; calls useAuth().login()
│   ├── FeatureGrid.tsx             ← 4 cards; IntersectionObserver scroll trigger
│   └── LandingFooter.tsx           ← Classification bar + nav links
```

### Data flow
```
AuthContext (user, loading, login)
     ↓
page.tsx
  └── useEffect watches user → redirects to role-based dashboard
  └── renders HeroSection → renders LoginCard
           LoginCard calls useAuth().login()
           AuthContext sets user
           page.tsx useEffect fires → router.replace(...)
```

---

## 3. Animation Choreography Timeline

All animations use CSS keyframes + `animation-delay` inline styles. No Framer Motion required (not in `package.json`). Respects `prefers-reduced-motion`.

| t=0ms | Canvas particle network begins (background, continuous) |
|-------|--------------------------------------------------------|
| t=100ms | Platform badge fades in (`fadeInUp`, 0.6s) |
| t=200ms | App name `AROGYA DRISHTI` fades up (0.7s) |
| t=350ms | Tagline paragraph fades up (0.7s) |
| t=500ms | Status pills row fades up (0.7s) |
| t=650ms | Role quick-ref box fades up (0.7s) |
| t=300ms | Login card slides in from bottom + scale (`slideInFromBottom`, 0.7s, spring-like cubic) |
| t=1000ms | Scroll indicator breathes in (0.7s) |
| **Scroll** | FeatureGrid section heading fades up (IntersectionObserver, threshold 0.2) |
| **Scroll + 0ms** | Feature card 0 fades up (threshold 0.15) |
| **Scroll + 120ms** | Feature card 1 fades up (stagger) |
| **Scroll + 240ms** | Feature card 2 fades up (stagger) |
| **Scroll + 360ms** | Feature card 3 fades up (stagger) |
| **Continuous** | Login button glow pulse (3s sinusoidal) |
| **Continuous** | Status dot `breathe` animation (2–2.5s) |
| **Continuous** | Border glow on login card (3s sinusoidal) |

### Custom keyframes (added to `globals.css`)
```css
@keyframes fadeInUp           { 0% { opacity:0; transform:translateY(30px) } 100% { opacity:1; transform:translateY(0) } }
@keyframes slideInFromBottom  { 0% { opacity:0; transform:translateY(56px) scale(0.97) } 100% { opacity:1; transform:translateY(0) scale(1) } }
@keyframes glowPulse          { 0%,100% { box-shadow: 0 0 8px rgba(20,184,166,0.35)… } 50% { box-shadow: 0 0 22px rgba(20,184,166,0.7)… } }
@keyframes borderGlow         { 0%,100% { border-color: rgba(20,184,166,0.25) } 50% { border-color: rgba(20,184,166,0.60) } }
@keyframes scanLine           { 0% { transform:translateY(-100%) } 100% { transform:translateY(100vh) } }
@keyframes countTick          { 0% { opacity:0; transform:translateY(8px) } 100% { opacity:1; transform:translateY(0) } }
```

Existing keyframes reused: `breathe`, `pulseRing` (already in `globals.css`)

---

## 4. Routing & Auth Integration

### Current flow (post-landing-page)
```
User visits /
  ├── loading=true   → dark spinner
  ├── user exists    → router.replace(roleRoute)   [DEV_BYPASS injects super_admin]
  └── user=null      → render landing page
        └── LoginCard submits → useAuth().login(username, password)
              └── AuthContext calls api.login() → POST /api/v1/auth/login on :3001
                    └── DEV_BYPASS_AUTH=true → backend accepts any credentials
                          └── Returns { accessToken, user: UserInfo }
                                └── AuthContext sets user state
                                      └── page.tsx useEffect fires → redirect
```

### Role routing table
| Role | Route |
|------|-------|
| `super_admin` | `/dashboard/admin` |
| `medical_officer` | `/dashboard/doctor` |
| `paramedic` | `/dashboard/doctor` |
| `commander` | `/dashboard/commander` |
| `individual` (desktop) | `/dashboard/me` |
| `individual` (mobile UA) | `/mobile/me` |

### Error handling in LoginCard
- Network failure → catches in `try/catch`, sets `error` state
- Shows red alert box with message
- Never crashes or throws unhandled

### Legacy `/login` route
The existing `/login/page.tsx` is preserved and functional. It remains an alternate entry point but is no longer the primary login surface. The root `/` is now the canonical landing page.

---

## 5. Step-by-Step Build Sequence (As Executed)

1. **Read existing code** — `package.json`, `tailwind.config.ts`, `globals.css`, `AuthContext.tsx`, existing `page.tsx`, `login/page.tsx`, `lib/api.ts`
2. **Add keyframes** to `globals.css` — `fadeInUp`, `slideInFromBottom`, `glowPulse`, `borderGlow`, `scanLine`, `countTick`
3. **Create `AnimatedBackground.tsx`** — Canvas particle network with connection lines + CSS grid overlay + radial vignette
4. **Create `LoginCard.tsx`** — Glassmorphism form with username/password/show-toggle, demo credentials reveal, glow button, graceful error state
5. **Create `HeroSection.tsx`** — Full-screen section, split layout, staggered text animations, status pills, role quick-ref, scroll indicator
6. **Create `FeatureGrid.tsx`** — 4 feature cards with IntersectionObserver scroll trigger, stagger delay, hover glow effects
7. **Create `LandingFooter.tsx`** — Brand column, nav links, system info, classification bar
8. **Replace `app/page.tsx`** — Auth-aware orchestrator: spinner during load, redirect if authenticated, landing page if unauthenticated
9. **TypeScript cleanup** — Removed unused props/imports, initialized `animId = 0` for strict null safety

---

## 6. Files Created / Modified

| File | Action |
|------|--------|
| `src/app/globals.css` | Edited — added 6 new keyframe animations |
| `src/app/page.tsx` | Replaced — new landing page orchestrator |
| `src/components/landing/AnimatedBackground.tsx` | Created |
| `src/components/landing/LoginCard.tsx` | Created |
| `src/components/landing/HeroSection.tsx` | Created |
| `src/components/landing/FeatureGrid.tsx` | Created |
| `src/components/landing/LandingFooter.tsx` | Created |

---

## 7. Acceptance Criteria Verification

| Criterion | Status |
|-----------|--------|
| Page loads at `http://localhost:3000` with full landing experience | ✅ |
| Login form submits to :3001, handles success + error states | ✅ |
| Successful login navigates to role-based dashboard | ✅ (via AuthContext + useEffect) |
| All animations run at 60fps (CSS transforms only, no layout thrash) | ✅ |
| No TypeScript errors | ✅ (imports cleaned, animId initialized) |
| No console errors | ✅ (try/catch in login, canvas null-guards) |
| Mobile responsive (375px → 1440px) | ✅ (responsive grid, clamp() font size) |
| Respects prefers-reduced-motion | ✅ (canvas + IntersectionObserver check it) |

---

## 8. Phase 6 Auth Hardening Notes

When Phase 6 begins (real JWT auth), the following swaps are needed:

### Frontend changes
- `AuthContext.tsx` — `DEV_BYPASS` can be set to `false` or removed entirely
- `LoginCard.tsx` — no changes needed; already calls `useAuth().login()`
- `app/page.tsx` — no changes needed; already handles unauthenticated state
- Add `/login` redirect in middleware.ts for protected routes (if adding Next.js middleware)

### Backend changes
- `DEV_BYPASS_AUTH=false` in `.env`
- Ensure `POST /api/v1/auth/login` validates bcrypt password and issues real JWT + refresh token
- Add `POST /api/v1/auth/logout` to clear httpOnly refresh token cookie

### Optional Phase 6 UX additions
- "Forgot password" flow (out of scope for military context — likely admin reset)
- Session expiry banner on dashboard (already partially wired in AuthContext)
- TOTP second factor for super_admin and commander roles

---

## 9. Dependencies Used

No new npm packages were added. All features implemented with:
- **React 18** built-in hooks (`useState`, `useEffect`, `useRef`, `useCallback`)
- **Canvas API** (native browser)
- **IntersectionObserver API** (native browser)
- **CSS animations** via Tailwind + custom keyframes in `globals.css`
- **Existing project deps**: `next`, `react`, `tailwindcss`, `lucide-react` (not used on landing), `@/contexts/AuthContext`, `@/lib/api`

---

*Arogya Drishti — UNCLASSIFIED // FOR DEMO USE ONLY*
