export interface SessionMetrics {
  confidenceScore: number;
  energyScore: number;
  clarityScore: number;
  pacingWpm: number;
  fillerCount: number;
  overallScore: number;
  structureScore: number;
}

export interface StructureItem {
  element: string;
  detected: boolean;
  excerpt?: string;
  confidence?: number;
}

export interface AIFeedbackItem {
  id: string;
  type: "feedback" | "question" | "structure" | "improvement";
  content: string;
  score?: number;
  done?: boolean;
  timestamp: number;
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: number;
}

export interface PitchSessionSummary {
  id: string;
  title: string;
  overallScore: number | null;
  durationSeconds: number;
  fillerCount: number;
  createdAt: string;
  mode: string;
}
