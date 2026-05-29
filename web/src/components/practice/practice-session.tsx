"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2,
  Mic,
  MicOff,
  Monitor,
  Pause,
  Square,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Waveform } from "@/components/pitch/waveform";
import { LiveTranscript } from "@/components/pitch/live-transcript";
import { ScoreRing } from "@/components/pitch/score-ring";
import { StructureChecklist } from "@/components/pitch/structure-checklist";
import { FeedbackTimeline } from "@/components/pitch/feedback-timeline";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useSessionStore } from "@/store/session-store";
import { usePitchSocket } from "@/hooks/use-pitch-socket";
import { useTranscription } from "@/hooks/use-transcription";
import { waitForSessionReady } from "@/lib/wait-for-session-ready";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { formatDuration } from "@/lib/utils";
import {
  registerCameraStream,
  stopCameraStream,
} from "@/lib/camera-stream";

export function PracticeSession({ userId }: { userId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    stopCameraStream();
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const {
    sessionId,
    isRecording,
    isPaused,
    transcript,
    interimText,
    metrics,
    structure,
    feedback,
    durationSeconds,
    mirrorMode,
    teleprompterText,
    countdown,
    mode,
    setSessionId,
    setRecording,
    setPaused,
    tickDuration,
    setMirrorMode,
    setCountdown,
    setInterimText,
  } = useSessionStore();

  const { sendTranscript, endSession, pauseSession } = usePitchSocket(userId);

  const onSpeechResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        setInterimText("");
        sendTranscript(text, true);
      } else {
        setInterimText(text);
      }
    },
    [sendTranscript, setInterimText]
  );

  const liveTranscript = [transcript.trim(), interimText.trim()]
    .filter(Boolean)
    .join(" ");

  const { isListening, isSupported, start, stop, provider } = useTranscription({
    onResult: onSpeechResult,
    onError: (e) => console.warn("STT:", e),
  });

  const startSession = async () => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) {
      console.warn("Failed to create session");
      return;
    }
    const data = await res.json();
    const id = data.session?.id;
    if (!id) return;
    setSessionId(id);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setRecording(true);
      setPaused(false);

      void (async () => {
        const ready = await waitForSessionReady(20000);
        if (!ready) {
          setRecording(false);
          return;
        }
        await start();
        durationInterval.current = setInterval(() => {
          if (!useSessionStore.getState().isPaused) {
            tickDuration();
          }
        }, 1000);
      })();
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, setCountdown, setRecording, setPaused, start, tickDuration]);

  useEffect(() => {
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
      stop();
      setMirrorMode(false);
      stopCamera();
    };
  }, [stop, setMirrorMode, stopCamera]);

  useEffect(() => {
    if (!mirrorMode) {
      stopCamera();
      return;
    }

    let cancelled = false;

    void navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        registerCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [mirrorMode, stopCamera]);

  const togglePause = useCallback(() => {
    const next = !isPaused;
    setPaused(next);
    if (next) {
      stop();
      pauseSession();
      if (durationInterval.current) clearInterval(durationInterval.current);
    } else {
      void start();
      durationInterval.current = setInterval(() => {
        if (!useSessionStore.getState().isPaused) tickDuration();
      }, 1000);
    }
  }, [isPaused, setPaused, stop, start, pauseSession, tickDuration]);

  const stopSession = async () => {
    stop();
    setRecording(false);
    setPaused(false);
    if (durationInterval.current) clearInterval(durationInterval.current);
    endSession();

    if (!sessionId) return;

    const state = useSessionStore.getState();
    await fetch(`/api/sessions/${sessionId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: state.transcript,
        durationSeconds: state.durationSeconds,
        overallScore: state.metrics.overallScore,
        confidenceScore: state.metrics.confidenceScore,
        energyScore: state.metrics.energyScore,
        clarityScore: state.metrics.clarityScore,
        pacingWpm: state.metrics.pacingWpm,
        fillerCount: state.metrics.fillerCount,
        structureScore: state.metrics.structureScore,
        structure: state.structure,
        feedback: state.feedback.map((f) => ({
          type: f.type,
          content: f.content,
        })),
      }),
    });
  };

  useKeyboardShortcuts({
    " ": () => (isRecording ? togglePause() : startSession()),
    "mod+enter": () => (isRecording ? stopSession() : startSession()),
    m: () => setMirrorMode(!mirrorMode),
  });

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-[#09090b] p-6" : "p-8"}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Practice Session</h1>
          <p className="text-sm text-zinc-500">
            {isRecording ? formatDuration(durationSeconds) : "Press start to begin"} ·{" "}
            STT: {provider === "groq" ? "Groq Whisper" : "Web Speech"}
            {!isSupported && " · STT may be limited in this browser"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMirrorMode(!mirrorMode)}
          >
            <Monitor className="h-4 w-4" />
            Mirror
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </Button>
          {!isRecording ? (
            <Button onClick={startSession}>
              <Mic className="h-4 w-4" />
              Start pitch
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePause}
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button variant="danger" size="sm" onClick={stopSession}>
                <Square className="h-4 w-4" />
                End
              </Button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <span className="text-8xl font-bold text-white">{countdown}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GlassCard glow={isRecording}>
            <div
              className={
                mirrorMode
                  ? "grid grid-cols-2 gap-4 py-6 items-center"
                  : "flex flex-col items-center py-6"
              }
            >
              <div className="flex flex-col items-center">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={isRecording ? stopSession : startSession}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full ${
                    isRecording
                      ? "bg-red-500/20 ring-4 ring-red-500/30"
                      : "bg-violet-500/20 ring-4 ring-violet-500/30"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-10 w-10 text-red-400" />
                  ) : (
                    <Mic className="h-10 w-10 text-violet-400" />
                  )}
                  {isRecording && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                    </span>
                  )}
                </motion.button>
                <Waveform isActive={isListening && !isPaused} className="mt-6 w-full max-w-xs" />
              </div>

              {mirrorMode && (
                <div className="flex w-full items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="aspect-video w-full max-h-64 rounded-xl object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                </div>
              )}
            </div>
          </GlassCard>

          {teleprompterText && (
            <GlassCard>
              <p className="text-center text-lg leading-relaxed text-zinc-300">
                {teleprompterText}
              </p>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="mb-3 text-sm font-medium text-zinc-400">Live transcript</h3>
            <LiveTranscript text={liveTranscript} />
          </GlassCard>

          <GlassCard>
            <h3 className="mb-3 text-sm font-medium text-zinc-400">Pitch structure</h3>
            <StructureChecklist structure={structure} />
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <div className="flex flex-wrap justify-around gap-4">
              <ScoreRing label="Overall" value={metrics.overallScore} color="#8b5cf6" />
              <ScoreRing label="Clarity" value={metrics.clarityScore} color="#22d3ee" />
              <ScoreRing label="Energy" value={metrics.energyScore} color="#f472b6" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg bg-white/[0.03] p-2">
                <p className="text-zinc-500">Confidence</p>
                <p className="font-bold text-white">{metrics.confidenceScore}</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2">
                <p className="text-zinc-500">Pacing</p>
                <p className="font-bold text-white">{metrics.pacingWpm} wpm</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2 col-span-2">
                <p className="text-zinc-500">Filler words</p>
                <p className="font-bold text-amber-400">{metrics.fillerCount}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
              <Timer className="h-4 w-4" />
              AI Feedback
            </div>
            <FeedbackTimeline items={feedback} />
          </GlassCard>

          <GlassCard>
            <ActivityFeed />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
