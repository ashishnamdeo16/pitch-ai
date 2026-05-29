# PitchPilot AI

**Real-time AI pitch coach for startup founders** — live transcript analysis, investor simulation, structure detection, and analytics. Built for YC-level polish.

![PitchPilot AI](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Socket.io](https://img.shields.io/badge/Socket.io-realtime-green?style=flat-square)

## Architecture

```
pitch-ai/
├── web/                    # Next.js 15 (App Router) — Vercel
├── realtime-server/        # Socket.io WebSocket — Railway
├── prisma/                 # (in web/prisma) PostgreSQL schema
├── docker-compose.yml      # Local Postgres + Redis
└── .env.example
```

### Real-time pipeline

```
Microphone → Web Speech API (client)
    → transcript:chunk (Socket.io)
    → Redis session sync
    → Heuristic metrics + structure detection (<50ms)
    → GPT-4o streaming feedback (throttled)
    → metrics:update | transcript:update | ai:feedback (client)
```

**Engineering highlights:**
- **Audio chunk buffering** — `audio:chunk` events with sequence ACKs for future Deepgram integration
- **Redis-backed sessions** — horizontal scaling + concurrent user isolation via `sessionId` rooms
- **AI response caching** — SHA-256 hash of transcript window, 5min TTL
- **WebSocket heartbeat** — 25s ping + client heartbeat emit
- **Exponential backoff reconnect** — socket.io-client with transport fallback
- **Rate limiting** — per-socket transcript events + API route limits via Upstash

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS v4, Framer Motion |
| Realtime | Socket.io (separate Railway server) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Supabase Auth |
| Cache | Upstash Redis |
| AI | OpenAI GPT-4o (streaming) |
| STT | Web Speech API (Deepgram optional) |
| Deploy | Vercel (web) + Railway (WS) |

## Quick start

### 1. Prerequisites

- Node.js 20+
- Docker (optional, for local Postgres/Redis)
- Supabase project
- OpenAI API key

### 2. Clone & install

```bash
cd pitch-ai
npm install
cd web && npm install
cd ../realtime-server && npm install
```

### 3. Environment

```bash
cp .env.example web/.env.local
cp .env.example realtime-server/.env
```

Fill in Supabase, OpenAI, and Redis credentials. For local dev without cloud services:

```bash
docker compose up -d
```

Set in `web/.env.local`:

```env
DATABASE_URL="postgresql://pitchpilot:pitchpilot@localhost:5432/pitchpilot"
DIRECT_URL="postgresql://pitchpilot:pitchpilot@localhost:5432/pitchpilot"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

### 4. Database

```bash
cd web
npx prisma db push
npx prisma generate
```

### 5. Run

**Terminal 1 — WebSocket server:**
```bash
cd realtime-server
npm run dev
```

**Terminal 2 — Next.js:**
```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Frontend)

1. Import `web/` directory
2. Set environment variables from `.env.example`
3. Build command: `prisma generate && next build`
4. Set `NEXT_PUBLIC_WS_URL` to your Railway WebSocket URL

### Railway (WebSocket server)

1. Deploy `realtime-server/` directory
2. Set `WS_PORT`, `OPENAI_API_KEY`, `UPSTASH_REDIS_*`, `WS_CORS_ORIGIN`
3. Health check: `GET /health`
4. See `realtime-server/railway.toml`

### Supabase

1. Create project → copy URL + anon key + service role
2. Enable Email auth
3. Use Supabase Postgres connection strings for `DATABASE_URL` / `DIRECT_URL`

## Features

- **Real-time pitch analysis** — filler words, confidence, energy, pacing, clarity
- **Investor simulation** — 5 personalities including Shark Tank mode
- **Structure analyzer** — Problem, Market, Solution, GTM, Business Model, Competition, Ask, Vision
- **Analytics dashboard** — score trends, filler graphs, leaderboard UI
- **Practice mode** — mirror, fullscreen, countdown, teleprompter
- **PDF reports** — exportable session reports via jsPDF
- **Multi-language** — STT language selector in settings

## Keyboard shortcuts (Practice)

| Key | Action |
|-----|--------|
| `Space` | Pause / start |
| `Cmd+Enter` | End / start session |
| `M` | Toggle mirror mode |

## API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/sessions` | GET, POST | List/create sessions |
| `/api/sessions/[id]` | GET, PATCH | Session detail/update |
| `/api/analytics` | GET | Score & filler trends |
| `/api/reports/[sessionId]` | POST | Generate PDF report |

## Database models

See `web/prisma/schema.prisma` for:
- User, PitchSession, TranscriptChunk, AIAnalysis
- InvestorQuestion, StructureTag, Report, SubscriptionPlan
- TeamRoom, TeamRoomMember

## Production checklist

- [ ] Configure Supabase RLS policies
- [ ] Set up Stripe for subscription tiers
- [ ] Enable Deepgram for production STT
- [ ] Configure CDN for session recordings
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Review rate limits for your scale

## License

MIT — built for founders shipping fast.
