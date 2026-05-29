import { v4 as uuidv4 } from "uuid";
import {
  analyzeStructure,
  computeMetrics,
  detectFillerWords,
  highlightFillersInText,
} from "./lib/analysis.js";
import { streamPitchFeedback, generateInvestorQuestion } from "./lib/llm.js";
import { getSessionState, setSessionState, deleteSessionState } from "./lib/redis.js";
import { mergeTranscriptSegment } from "./lib/transcript-merge.js";
import { correctPitchStt } from "./lib/stt-corrections.js";
import type {
  AIFeedbackChunk,
  InvestorPersonality,
  RedisSessionState,
  SessionMetrics,
  StructureDetection,
} from "./types.js";
import { PITCH_STRUCTURE_ELEMENTS } from "./types.js";

/** In-memory fallback when Redis unavailable — isolated per sessionId */
const localSessions = new Map<string, RedisSessionState>();

const FEEDBACK_INTERVAL_MS = 8000;
const lastFeedbackAt = new Map<string, number>();

export async function initSession(
  sessionId: string,
  userId: string
): Promise<RedisSessionState> {
  const existing = await getSession(sessionId);
  if (existing && existing.userId === userId) {
    existing.lastHeartbeat = Date.now();
    localSessions.set(sessionId, existing);
    await setSessionState(sessionId, existing);
    return existing;
  }

  const state: RedisSessionState = {
    sessionId,
    userId,
    transcript: "",
    metrics: {
      confidenceScore: 70,
      energyScore: 70,
      clarityScore: 70,
      pacingWpm: 0,
      fillerCount: 0,
      overallScore: 70,
      structureScore: 0,
    },
    structure: Object.fromEntries(PITCH_STRUCTURE_ELEMENTS.map((e) => [e, false])),
    lastHeartbeat: Date.now(),
    sequence: 0,
  };

  localSessions.set(sessionId, state);
  await setSessionState(sessionId, state);
  return state;
}

export async function getSession(sessionId: string): Promise<RedisSessionState | null> {
  const remote = await getSessionState(sessionId);
  if (remote) return remote;
  return localSessions.get(sessionId) || null;
}

export interface ProcessTranscriptResult {
  metrics: SessionMetrics;
  structure: StructureDetection[];
  highlightedText: string;
  fillers: string[];
  sequence: number;
}

export async function processTranscriptChunk(
  sessionId: string,
  text: string,
  isFinal: boolean,
  durationSeconds: number,
  expectedUserId?: string
): Promise<ProcessTranscriptResult | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  if (expectedUserId && session.userId !== expectedUserId) return null;
  if (!isFinal) return null;

  const cleaned = correctPitchStt(text);
  const { text: merged, appended } = mergeTranscriptSegment(session.transcript, cleaned);
  if (!appended) return null;

  session.sequence += 1;
  session.transcript = merged;
  session.lastHeartbeat = Date.now();

  const structureResults = analyzeStructure(session.transcript);
  for (const s of structureResults) {
    if (s.detected) session.structure[s.element] = true;
  }

  const structureCount = Object.values(session.structure).filter(Boolean).length;
  session.metrics = computeMetrics(session.transcript, durationSeconds, structureCount);

  localSessions.set(sessionId, session);
  await setSessionState(sessionId, session);

  const fillers = detectFillerWords(text);

  return {
    metrics: session.metrics,
    structure: structureResults,
    highlightedText: highlightFillersInText(session.transcript),
    fillers,
    sequence: session.sequence,
  };
}

export async function maybeStreamFeedback(
  sessionId: string,
  emit: (chunk: AIFeedbackChunk) => void
): Promise<void> {
  const now = Date.now();
  const last = lastFeedbackAt.get(sessionId) || 0;
  if (now - last < FEEDBACK_INTERVAL_MS) return;

  const session = await getSession(sessionId);
  if (!session || session.transcript.length < 80) return;

  lastFeedbackAt.set(sessionId, now);
  const id = uuidv4();

  emit({ id, type: "feedback", content: "", done: false });

  await streamPitchFeedback(sessionId, session.transcript, (token) => {
    emit({ id, type: "feedback", content: token, done: false });
  });

  emit({ id, type: "feedback", content: "", done: true });
}

export async function askInvestor(
  sessionId: string,
  personality: InvestorPersonality,
  emit: (chunk: AIFeedbackChunk) => void
): Promise<string> {
  const session = await getSession(sessionId);
  if (!session) return "";

  const id = uuidv4();
  const question = await generateInvestorQuestion(
    sessionId,
    session.transcript,
    personality
  );

  emit({ id, type: "question", content: question, done: true });
  return question;
}

export async function clearSession(sessionId: string): Promise<void> {
  localSessions.delete(sessionId);
  lastFeedbackAt.delete(sessionId);
  await deleteSessionState(sessionId);
}
