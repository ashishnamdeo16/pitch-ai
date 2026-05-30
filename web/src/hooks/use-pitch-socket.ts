"use client";

import { useCallback, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { WS_URL } from "@/lib/constants";
import { mapWsSocketError } from "@/lib/user-messages";
import { useSessionStore } from "@/store/session-store";
import type { AIFeedbackItem, SessionMetrics, StructureItem } from "@/types";

async function fetchWsToken(sessionId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/ws/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * WebSocket hook with JWT auth, exponential backoff reconnect.
 */
export function usePitchSocket(userId: string) {
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const {
    sessionId,
    setConnected,
    setSessionReady,
    setTranscript,
    setMetrics,
    setStructure,
    addFeedback,
    appendFeedback,
    addActivity,
  } = useSessionStore();

  const joinSession = useCallback(
    async (socket: Socket, sid: string) => {
      setSessionReady(false);
      const token = await fetchWsToken(sid);
      if (!token) {
        addActivity({
          type: "ws",
          message:
            "Unable to connect to the live coach. Please refresh the page and sign in again.",
        });
        setConnected(false);
        return;
      }

      socket.emit("session:join", {
        sessionId: sid,
        userId,
        token,
        language: "en-US",
      });
    },
    [userId, addActivity, setConnected, setSessionReady]
  );

  const connect = useCallback(
    (sid: string) => {
      sessionIdRef.current = sid;

      if (socketRef.current?.connected) {
        void joinSession(socketRef.current, sid);
        return;
      }

      const socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      socket.on("connect", () => {
        setConnected(true);
        void joinSession(socket, sid);
        addActivity({
          type: "ws",
          message: "Connected to realtime coach",
        });
      });

      socket.on("disconnect", () => {
        setConnected(false);
        addActivity({ type: "ws", message: "Reconnecting…" });
      });

      socket.on("session:ready", () => {
        setSessionReady(true);
        addActivity({
          type: "session",
          message: "Session ready — start pitching",
        });
      });

      socket.on("error", (err: { code?: string; message?: string }) => {
        addActivity({
          type: "ws",
          message: mapWsSocketError(err.code, err.message),
        });
      });

      socket.on("transcript:update", (data: { text: string }) => {
        setTranscript(data.text);
      });

      socket.on("metrics:update", (metrics: SessionMetrics) => {
        setMetrics(metrics);
      });

      socket.on("structure:update", (structure: StructureItem[]) => {
        setStructure(structure);
      });

      socket.on(
        "ai:feedback",
        (chunk: {
          id: string;
          type: AIFeedbackItem["type"];
          content: string;
          done?: boolean;
        }) => {
          const existing = useSessionStore
            .getState()
            .feedback.find((f) => f.id === chunk.id);

          if (!existing && chunk.content) {
            addFeedback({
              id: chunk.id,
              type: chunk.type,
              content: chunk.content,
              done: chunk.done,
              timestamp: Date.now(),
            });
          } else if (existing && chunk.content) {
            appendFeedback(chunk.id, chunk.content);
          } else if (!existing) {
            addFeedback({
              id: chunk.id,
              type: chunk.type,
              content: "",
              done: false,
              timestamp: Date.now(),
            });
          }

          if (chunk.done) {
            addActivity({
              type: "ai",
              message:
                chunk.type === "question" ? "Investor question" : "AI coaching tip",
            });
          }
        }
      );

      socketRef.current = socket;
    },
    [
      userId,
      setConnected,
      setSessionReady,
      setTranscript,
      setMetrics,
      setStructure,
      addFeedback,
      appendFeedback,
      addActivity,
      joinSession,
    ]
  );

  const sendTranscript = useCallback((text: string, isFinal = true) => {
    if (!useSessionStore.getState().isSessionReady || !isFinal) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    socketRef.current?.emit("transcript:chunk", { text: trimmed, isFinal: true, wordCount });
  }, []);

  const askInvestor = useCallback((personality: string) => {
    socketRef.current?.emit("investor:ask", { personality });
  }, []);

  const endSession = useCallback(() => {
    socketRef.current?.emit("session:end");
    socketRef.current?.disconnect();
    setConnected(false);
  }, [setConnected]);

  const pauseSession = useCallback(() => {
    socketRef.current?.emit("session:pause");
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    connect(sessionId);
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSessionReady(false);
    };
    // Only reconnect when sessionId changes — not when connect callback identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      socketRef.current?.emit("heartbeat");
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  return {
    sendTranscript,
    askInvestor,
    endSession,
    pauseSession,
    socket: socketRef,
  };
}
