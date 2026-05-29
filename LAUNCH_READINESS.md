# PitchPilot AI — Launch Readiness Report

**Date:** May 28, 2026  
**Launch scenario:** Product Hunt launch, ~50,000 visitors in 24 hours  
**Overall readiness:** **6.5 / 10** — Safe for a **marketing launch** (landing + signup funnel). **Not yet safe** for heavy concurrent live-pitch usage without scaling the realtime tier.

---

## Executive Summary

PitchPilot AI is a two-tier app: a **Next.js frontend on Vercel** (static landing + authenticated dashboard/API) and a **Socket.io realtime server** (Railway or similar) for live pitch coaching with optional Deepgram STT.

For a Product Hunt spike, **~95% of traffic will hit the landing page and auth flows**, which Vercel CDN handles well. The **risk zone is concurrent live practice sessions** — each session opens a WebSocket, streams audio to Deepgram, and runs heuristic analysis. A single realtime node supports roughly **100–150 concurrent active sessions** before latency and CPU become problematic.

This hardening pass closed several **Critical** gaps from the prior audit: WebSocket JWT auth, session finalize/persistence, PATCH allowlisting, rate limits, userId alignment, analytics honesty, and investor race conditions.

---

## Traffic Model (50k visitors / 24h)

| Segment | Est. % | ~Visitors | Infra impact |
|---------|--------|-----------|--------------|
| Landing page only | 70% | 35,000 | Vercel CDN — low risk |
| Signup / login | 15% | 7,500 | Supabase Auth + Prisma writes — moderate |
| Dashboard browse | 10% | 5,000 | SSR + DB reads — moderate |
| **Live practice (WS + STT)** | **5%** | **2,500** | **High — realtime + Deepgram + DB** |

**Peak concurrent users (rough):** If 10% of live-practice visitors overlap at peak → **~250 concurrent WS sessions** → exceeds single-node capacity.

**Recommendation:** Launch on PH with landing + waitlist/demo video as primary CTA. Cap or queue live practice if realtime CPU > 70%, or scale to 2+ realtime replicas behind a load balancer with Redis adapter.

---

## Hardening Completed (This Pass)

| Area | Change |
|------|--------|
| **WebSocket auth** | HMAC JWT via `/api/ws/token`; `session:join` requires valid token matching session + Prisma userId |
| **User ID alignment** | Practice/investor pages pass `dbUser.id` (not Supabase UUID) |
| **Session persistence** | `/api/sessions/[id]/finalize` writes transcript, structure tags, AI feedback on session end |
| **PATCH hardening** | Allowlisted fields only; no mass assignment |
| **Rate limiting** | Redis-backed limits on sessions, analytics, finalize, reports, ws/token; fail-closed in production without Redis |
| **Realtime limits** | Per-socket buckets: transcript 120/min, audio 240/min, investor 20/min; 512KB max buffer |
| **initSession fix** | No longer wipes state on reconnect for same user |
| **Investor race** | Waits for `session:ready` before `investor:ask` |
| **Analytics** | Removed fake demo charts and leaderboard |
| **Pause/resume** | STT + timer sync on practice session |
| **Error boundary** | Wrapped dashboard content |
| **Build verification** | `web` and `realtime-server` builds pass |

---

## Deployment Risks — Ranked by Severity

### 🔴 Critical (fix before or during launch day)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| C1 | **Single realtime node capacity** | WS connections drop, STT fails under ~150+ concurrent sessions | Deploy 2+ Railway replicas; add Socket.io Redis adapter; monitor `/health` + CPU |
| C2 | **`WS_TOKEN_SECRET` not set in production** | WS auth throws or falls back to dev secret | Set identical `WS_TOKEN_SECRET` on Vercel **and** Railway; rotate from dev value |
| C3 | **Deepgram cost spike** | 2,500 practice users × ~5 min audio ≈ significant API spend | Set Deepgram budget alerts; consider `NEXT_PUBLIC_USE_DEEPGRAM=false` fallback for overflow |
| C4 | **Supabase connection pool exhaustion** | API 500s on signup/session create during spikes | Use Supabase pooler URL (`?pgbouncer=true`); tune Prisma connection limit; upgrade Supabase tier |
| C5 | **No horizontal WS sticky sessions** | Multi-node deploy breaks sessions without Redis adapter | Use `@socket.io/redis-adapter` + sticky load balancer before scaling past 1 node |

### 🟠 High (address within first 48h of launch)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| H1 | **Upstash Redis outage → API rate limits block all writes** | Fail-closed in prod rejects requests | Monitor Upstash; document fallback to temporarily relax limits |
| H2 | **No CI/CD or automated tests** | Regressions ship silently | Add smoke test: signup → create session → WS join → finalize |
| H3 | **No Prisma migrations** | Schema drift between envs | Run `prisma migrate deploy` before prod; stop using `db push` in prod |
| H4 | **PDF reports depend on finalize** | Empty reports if user closes tab before finalize | Add `beforeunload` beacon or periodic autosave |
| H5 | **CORS misconfiguration** | WS fails from production domain | Set `WS_CORS_ORIGIN=https://your-domain.com` and `NEXT_PUBLIC_WS_URL=wss://realtime.your-domain.com` |
| H6 | **Secrets in repo history / chat** | Credential compromise | Rotate Supabase, Deepgram, Upstash, DB password before launch |

### 🟡 Medium (acceptable for PH with monitoring)

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| M1 | **No Stripe / subscription enforcement** | Pricing page promises paid tiers that don't exist | Add "Beta — free during launch" banner |
| M2 | **Heuristic-only AI (no OpenAI)** | Investor questions are template-based | Set expectations in UI copy |
| M3 | **No Supabase RLS** | Defense relies on app-layer auth only | Add RLS policies post-launch |
| M4 | **Mobile nav missing** | Poor UX on mobile PH traffic | Acceptable for v1; ~40% mobile PH users |
| M5 | **Teleprompter settings unwired** | Settings page field ignored | Low priority unless marketed |
| M6 | **Vercel serverless cold starts** | First API call slow after idle | Keep `regions: iad1`; consider cron ping on `/api/analytics` |

### 🟢 Low (post-launch backlog)

| # | Risk | Impact |
|---|------|--------|
| L1 | Unused npm dependencies | Slightly larger bundle |
| L2 | No session replay UI | Transcript stored but not playable |
| L3 | No admin dashboard | Manual DB inspection only |
| L4 | Leaderboard removed | No social proof in analytics |

---

## Production Environment Checklist

### Vercel (`web/`)

```bash
# Required
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
WS_TOKEN_SECRET=<32+ char random, same as Railway>
SESSION_SECRET=<32+ char random>
NEXT_PUBLIC_WS_URL=wss://realtime.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_USE_DEEPGRAM=true
DEEPGRAM_API_KEY=

# Optional
OPENAI_API_KEY=  # not required; heuristics used if absent
```

### Railway (`realtime-server/`)

```bash
WS_PORT=3001
WS_CORS_ORIGIN=https://yourdomain.com
WS_TOKEN_SECRET=<same as Vercel>
SESSION_SECRET=<same as Vercel>
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
REDIS_URL=  # if using ioredis for session state
DEEPGRAM_API_KEY=
NODE_ENV=production
```

### Supabase

- [ ] Auth redirect URLs include production domain
- [ ] Connection pooler enabled
- [ ] Database backups on
- [ ] Auth rate limits reviewed

---

## Pre-Launch Smoke Test (15 min)

1. **Landing** — Load `/` on mobile + desktop; verify LCP < 3s
2. **Auth** — Signup → email confirm (if enabled) → login → dashboard
3. **Practice** — Start session → speak 30s → see transcript + scores → Stop → verify DB row `status=COMPLETED`
4. **Finalize** — Check `/api/sessions/[id]` returns transcript chunks + analyses
5. **PDF** — Generate report from Reports page; confirm non-empty content
6. **Investor** — Ask question; verify response after "Connecting…"
7. **WS auth** — Open DevTools; confirm `session:join` includes `token`; reject works without token
8. **Health** — `GET https://realtime.../health` returns `{ status: "ok" }`

---

## Capacity Estimates

| Resource | Single instance | 50k PH day |
|----------|---------------|------------|
| Vercel bandwidth | Unlimited (plan-dependent) | ~50k × 200KB landing ≈ 10GB — fine |
| Supabase Auth | 50k MAU on free tier — check limits | May need Pro |
| Realtime node | ~100–150 concurrent WS | Peak ~250 — **needs scale** |
| Deepgram | Pay per minute | Budget $50–200 for launch day |
| Upstash Redis | 10k cmds/day free | Upgrade if rate limits hit |
| PostgreSQL | Session writes ~2.5k/day | Fine on Supabase Pro |

---

## Go / No-Go Recommendation

| Launch type | Verdict |
|-------------|---------|
| **Product Hunt (landing + signup)** | ✅ **GO** — with production secrets rotated and monitoring in place |
| **Product Hunt (full live demo for all visitors)** | ⚠️ **CONDITIONAL** — scale realtime to 2+ nodes first |
| **Paid SaaS launch** | ❌ **NO-GO** — needs Stripe, RLS, CI, migrations, SLA |

---

## Monitoring (Launch Day)

Set alerts for:

- Realtime `/health` uptime (UptimeRobot or Railway metrics)
- Vercel 5xx rate > 1%
- Supabase connection count > 80% of limit
- Deepgram daily spend threshold
- Upstash command limit
- Railway CPU > 75% sustained 5 min

---

## Files Changed in Hardening Pass

- `web/src/lib/ws-token.ts`, `web/src/app/api/ws/token/route.ts`
- `realtime-server/src/lib/ws-auth.ts`, `realtime-server/src/index.ts`
- `web/src/app/api/sessions/[id]/finalize/route.ts`
- `web/src/hooks/use-pitch-socket.ts`
- `web/src/components/practice/practice-session.tsx`
- `web/src/lib/db-user.ts`, `web/src/lib/wait-for-session-ready.ts`
- `web/src/lib/redis.ts` (fail-closed)
- `web/src/components/analytics/analytics-charts.tsx`
- `web/src/components/investor/investor-simulation.tsx`
- `web/src/app/dashboard/layout.tsx` (ErrorBoundary)
- `.env.example` (`WS_TOKEN_SECRET`)

---

*Generated as part of pre-launch hardening. Re-run smoke tests after every production deploy.*
