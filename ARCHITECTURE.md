# PitchPilot AI — Architecture

## Folder structure

```
pitch-ai/
├── web/                              # Next.js 15 frontend (Vercel)
│   ├── prisma/schema.prisma          # Database models
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── (auth)/               # Login, signup
│   │   │   ├── dashboard/            # App shell + pages
│   │   │   └── api/                  # REST endpoints
│   │   ├── components/
│   │   │   ├── landing/              # Marketing sections
│   │   │   ├── dashboard/            # Sidebar, activity feed
│   │   │   ├── pitch/                # Waveform, transcript, scores
│   │   │   ├── practice/             # Live session UI
│   │   │   ├── investor/             # Simulation UI
│   │   │   ├── analytics/            # Charts
│   │   │   └── ui/                   # Design system primitives
│   │   ├── hooks/                    # WebSocket, STT, shortcuts
│   │   ├── store/                    # Zustand session state
│   │   ├── lib/                      # Prisma, Redis, Supabase, PDF
│   │   └── types/
│   └── vercel.json
├── realtime-server/                    # Socket.io (Railway)
│   └── src/
│       ├── index.ts                  # WS server + events
│       ├── session-manager.ts        # Transcript pipeline
│       └── lib/
│           ├── analysis.ts           # Metrics + structure heuristics
│           ├── openai.ts             # Streaming GPT + cache
│           └── redis.ts              # Session sync
├── docker-compose.yml
├── .env.example
└── README.md
```

## Event flow (Socket.io)

| Client → Server | Server → Client |
|-----------------|-----------------|
| `session:join` | `session:ready` |
| `transcript:chunk` | `transcript:update`, `metrics:update`, `structure:update` |
| `audio:chunk` | `audio:ack` |
| `investor:ask` | `ai:feedback` |
| `heartbeat` | `heartbeat:ack` |
| `session:end` | `session:ended` |

## Session replay (future)

Transcript chunks stored in `TranscriptChunk` with sequence numbers enable full session replay with synchronized AI feedback timeline.
