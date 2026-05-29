import type { Server } from "socket.io";
import {
  maybeStreamFeedback,
  processTranscriptChunk,
  getSession,
} from "./session-manager.js";
import { highlightFillersInText } from "./lib/analysis.js";

/** Broadcast transcript analysis to all clients in a session room */
export async function pipelineTranscript(
  io: Server,
  sessionId: string,
  userId: string,
  socketId: string,
  text: string,
  isFinal: boolean,
  durationSeconds: number
): Promise<void> {
  // Interim results are cumulative — preview only, do not append
  if (!isFinal) {
    await pipelineInterimTranscript(io, sessionId, text);
    return;
  }

  const result = await processTranscriptChunk(
    sessionId,
    text,
    isFinal,
    durationSeconds,
    userId
  );

  if (!result) return;

  io.to(`session:${sessionId}`).emit("transcript:update", {
    text: result.highlightedText,
    sequence: result.sequence,
    fillers: result.fillers,
    isFinal,
  });

  io.to(`session:${sessionId}`).emit("metrics:update", result.metrics);
  io.to(`session:${sessionId}`).emit("structure:update", result.structure);

  void maybeStreamFeedback(sessionId, (chunk) => {
    io.to(socketId).emit("ai:feedback", chunk);
  });
}

/** Interim STT tokens — preview without mutating accumulated session text */
export async function pipelineInterimTranscript(
  io: Server,
  sessionId: string,
  interimText: string
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  const preview = [session.transcript.trim(), interimText.trim()]
    .filter(Boolean)
    .join(" ");

  io.to(`session:${sessionId}`).emit("transcript:update", {
    text: highlightFillersInText(preview),
    sequence: session.sequence,
    fillers: [],
    isFinal: false,
  });
}
