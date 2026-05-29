export const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "basically",
  "honestly",
  "you know",
  "actually",
  "literally",
] as const;

export const PITCH_STRUCTURE_ELEMENTS = [
  "problem",
  "market",
  "solution",
  "gtm",
  "business_model",
  "competition",
  "ask",
  "vision",
] as const;

export type InvestorPersonality =
  | "AGGRESSIVE_VC"
  | "TECHNICAL"
  | "FRIENDLY_ANGEL"
  | "SKEPTICAL_PARTNER"
  | "SHARK_TANK";

export interface SessionMetrics {
  confidenceScore: number;
  energyScore: number;
  clarityScore: number;
  pacingWpm: number;
  fillerCount: number;
  overallScore: number;
  structureScore: number;
}

export interface TranscriptDelta {
  text: string;
  isFinal: boolean;
  sequence: number;
  timestamp: number;
}

export interface AIFeedbackChunk {
  id: string;
  type: "feedback" | "question" | "structure" | "improvement";
  content: string;
  score?: number;
  done?: boolean;
}

export interface StructureDetection {
  element: string;
  detected: boolean;
  excerpt?: string;
  confidence?: number;
}

export interface RedisSessionState {
  sessionId: string;
  userId: string;
  transcript: string;
  metrics: SessionMetrics;
  structure: Record<string, boolean>;
  lastHeartbeat: number;
  sequence: number;
}
