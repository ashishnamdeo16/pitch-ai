import { create } from "zustand";
import type {
  AIFeedbackItem,
  ActivityEvent,
  SessionMetrics,
  StructureItem,
} from "@/types";

interface SessionState {
  sessionId: string | null;
  isConnected: boolean;
  isSessionReady: boolean;
  isRecording: boolean;
  isPaused: boolean;
  transcript: string;
  interimText: string;
  metrics: SessionMetrics;
  structure: StructureItem[];
  feedback: AIFeedbackItem[];
  activity: ActivityEvent[];
  durationSeconds: number;
  investorPersonality: string;
  mode: "practice" | "investor" | "demo_day" | "shark_tank";
  mirrorMode: boolean;
  teleprompterText: string;
  countdown: number | null;

  setSessionId: (id: string | null) => void;
  setConnected: (v: boolean) => void;
  setSessionReady: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  setTranscript: (t: string) => void;
  setInterimText: (t: string) => void;
  setMetrics: (m: Partial<SessionMetrics>) => void;
  setStructure: (s: StructureItem[]) => void;
  addFeedback: (f: AIFeedbackItem) => void;
  appendFeedback: (id: string, token: string) => void;
  addActivity: (a: Omit<ActivityEvent, "id" | "timestamp">) => void;
  tickDuration: () => void;
  setInvestorPersonality: (p: string) => void;
  setMode: (m: SessionState["mode"]) => void;
  setMirrorMode: (v: boolean) => void;
  setTeleprompter: (t: string) => void;
  setCountdown: (n: number | null) => void;
  reset: () => void;
}

const defaultMetrics: SessionMetrics = {
  confidenceScore: 70,
  energyScore: 70,
  clarityScore: 70,
  pacingWpm: 0,
  fillerCount: 0,
  overallScore: 70,
  structureScore: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  isConnected: false,
  isSessionReady: false,
  isRecording: false,
  isPaused: false,
  transcript: "",
  interimText: "",
  metrics: defaultMetrics,
  structure: [],
  feedback: [],
  activity: [],
  durationSeconds: 0,
  investorPersonality: "SKEPTICAL_PARTNER",
  mode: "practice",
  mirrorMode: false,
  teleprompterText: "",
  countdown: null,

  setSessionId: (id) => set({ sessionId: id }),
  setConnected: (v) => set({ isConnected: v, ...(v ? {} : { isSessionReady: false }) }),
  setSessionReady: (v) => set({ isSessionReady: v }),
  setRecording: (v) => set({ isRecording: v }),
  setPaused: (v) => set({ isPaused: v }),
  setTranscript: (t) => set({ transcript: t, interimText: "" }),
  setInterimText: (t) => set({ interimText: t }),
  setMetrics: (m) => set({ metrics: { ...get().metrics, ...m } }),
  setStructure: (s) => set({ structure: s }),
  addFeedback: (f) =>
    set((state) => ({
      feedback: [f, ...state.feedback].slice(0, 50),
    })),
  appendFeedback: (id, token) =>
    set((state) => ({
      feedback: state.feedback.map((f) =>
        f.id === id ? { ...f, content: f.content + token } : f
      ),
    })),
  addActivity: (a) =>
    set((state) => ({
      activity: [
        {
          ...a,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
        ...state.activity,
      ].slice(0, 30),
    })),
  tickDuration: () =>
    set((state) => ({ durationSeconds: state.durationSeconds + 1 })),
  setInvestorPersonality: (p) => set({ investorPersonality: p }),
  setMode: (m) => set({ mode: m }),
  setMirrorMode: (v) => set({ mirrorMode: v }),
  setTeleprompter: (t) => set({ teleprompterText: t }),
  setCountdown: (n) => set({ countdown: n }),
  reset: () =>
    set({
      sessionId: null,
      isConnected: false,
      isSessionReady: false,
      isRecording: false,
      isPaused: false,
      transcript: "",
      interimText: "",
      metrics: defaultMetrics,
      structure: [],
      feedback: [],
      activity: [],
      durationSeconds: 0,
      countdown: null,
    }),
}));
