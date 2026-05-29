import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server, type Socket } from "socket.io";
import cors from "cors";
import {
  initSession,
  askInvestor,
  clearSession,
} from "./session-manager.js";
import type { InvestorPersonality } from "./types.js";
import {
  attachDeepgram,
  detachDeepgram,
  pipelineTranscript,
} from "./transcript-pipeline.js";
import { forwardAudioChunk } from "./lib/deepgram.js";
import { verifyWsToken } from "./lib/ws-auth.js";

const PORT = parseInt(process.env.PORT || process.env.WS_PORT || "3001", 10);
const HEARTBEAT_MS = parseInt(process.env.WS_HEARTBEAT_MS || "25000", 10);
const CORS_ORIGIN = process.env.WS_CORS_ORIGIN || "http://localhost:3000";
const IS_PROD = process.env.NODE_ENV === "production";

const VALID_PERSONALITIES: InvestorPersonality[] = [
  "AGGRESSIVE_VC",
  "TECHNICAL",
  "FRIENDLY_ANGEL",
  "SKEPTICAL_PARTNER",
  "SHARK_TANK",
];

const app = express();
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "pitchpilot-realtime",
    ts: Date.now(),
    uptime: process.uptime(),
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
  pingInterval: HEARTBEAT_MS,
  pingTimeout: HEARTBEAT_MS + 5000,
  maxHttpBufferSize: 512000, // 512KB — sufficient for webm chunks, limits abuse
});

/** Per-socket rate limits keyed by event type */
const rateLimits = new Map<string, Map<string, { count: number; resetAt: number }>>();

function checkRateLimit(
  socketId: string,
  bucket: string,
  limit: number
): boolean {
  const now = Date.now();
  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, new Map());
  }
  const buckets = rateLimits.get(socketId)!;
  let entry = buckets.get(bucket);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    buckets.set(bucket, entry);
  }
  entry.count += 1;
  return entry.count <= limit;
}

const LIMITS = {
  transcript: parseInt(process.env.RATE_LIMIT_TRANSCRIPT_PER_MIN || "120", 10),
  audio: parseInt(process.env.RATE_LIMIT_AUDIO_PER_MIN || "240", 10),
  investor: parseInt(process.env.RATE_LIMIT_INVESTOR_PER_MIN || "20", 10),
};

io.on("connection", (socket: Socket) => {
  let sessionId: string | null = null;
  let userId: string | null = null;
  let durationSeconds = 0;
  let durationTimer: ReturnType<typeof setInterval> | null = null;
  let sttProvider: "webspeech" | "deepgram" = "webspeech";
  let authenticated = false;

  socket.on(
    "session:join",
    async (payload: {
      sessionId: string;
      userId: string;
      token: string;
      stt?: "webspeech" | "deepgram";
      language?: string;
    }) => {
      if (!payload.token) {
        socket.emit("error", { code: "AUTH_REQUIRED", message: "Token required" });
        socket.disconnect(true);
        return;
      }

      const claims = verifyWsToken(payload.token);
      if (
        !claims ||
        claims.sessionId !== payload.sessionId ||
        claims.userId !== payload.userId
      ) {
        socket.emit("error", { code: "AUTH_INVALID", message: "Invalid token" });
        socket.disconnect(true);
        return;
      }

      sessionId = payload.sessionId;
      userId = payload.userId;
      sttProvider = payload.stt ?? "webspeech";
      authenticated = true;

      await socket.join(`session:${sessionId}`);
      await initSession(sessionId, userId);

      durationTimer = setInterval(() => {
        durationSeconds += 1;
      }, 1000);

      if (sttProvider === "deepgram") {
        try {
          await attachDeepgram(
            io,
            sessionId,
            socket.id,
            userId,
            payload.language ?? "en-US",
            () => durationSeconds
          );
        } catch (err) {
          console.error("[deepgram] failed to start:", err);
          socket.emit("stt:error", {
            provider: "deepgram",
            message: "Deepgram unavailable — use browser speech",
          });
          sttProvider = "webspeech";
        }
      }

      socket.emit("session:ready", {
        sessionId,
        heartbeatMs: HEARTBEAT_MS,
        stt: sttProvider,
      });
    }
  );

  socket.on(
    "transcript:chunk",
    async (payload: { text: string; isFinal?: boolean }) => {
      if (!authenticated || !sessionId || !userId) return;
      if (!checkRateLimit(socket.id, "transcript", LIMITS.transcript)) {
        socket.emit("error", { code: "RATE_LIMIT", message: "Too many events" });
        return;
      }

      const text = (payload.text || "").slice(0, 4000);
      if (!text) return;

      await pipelineTranscript(
        io,
        sessionId,
        userId,
        socket.id,
        text,
        payload.isFinal ?? false,
        durationSeconds
      );
    }
  );

  socket.on("audio:chunk", (payload: { data: string; sequence: number }) => {
    if (!authenticated || !sessionId) return;
    if (!checkRateLimit(socket.id, "audio", LIMITS.audio)) {
      socket.emit("error", { code: "RATE_LIMIT", message: "Audio rate limited" });
      return;
    }
    if (sttProvider === "deepgram" && payload.data) {
      forwardAudioChunk(sessionId, payload.data.slice(0, 700000));
    }
    socket.emit("audio:ack", { sequence: payload.sequence });
  });

  socket.on(
    "investor:ask",
    async (payload: { personality: string }) => {
      if (!authenticated || !sessionId || !userId) return;
      if (!checkRateLimit(socket.id, "investor", LIMITS.investor)) {
        socket.emit("error", { code: "RATE_LIMIT", message: "Investor rate limited" });
        return;
      }

      const personality = VALID_PERSONALITIES.includes(
        payload.personality as InvestorPersonality
      )
        ? (payload.personality as InvestorPersonality)
        : "SKEPTICAL_PARTNER";

      await askInvestor(sessionId, personality, (chunk) => {
        socket.emit("ai:feedback", chunk);
      });
    }
  );

  socket.on("heartbeat", () => {
    socket.emit("heartbeat:ack", { ts: Date.now() });
  });

  socket.on("session:pause", () => {
    if (durationTimer) clearInterval(durationTimer);
    socket.emit("session:paused");
  });

  socket.on("session:end", () => {
    if (durationTimer) clearInterval(durationTimer);
    if (sessionId) {
      detachDeepgram(sessionId);
      io.to(`session:${sessionId}`).emit("session:ended", { durationSeconds });
      void clearSession(sessionId);
    }
  });

  socket.on("disconnect", () => {
    if (durationTimer) clearInterval(durationTimer);
    if (sessionId) detachDeepgram(sessionId);
    rateLimits.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`PitchPilot realtime server on :${PORT}${IS_PROD ? " (prod)" : ""}`);
});
