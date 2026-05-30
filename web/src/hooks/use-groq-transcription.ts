"use client";

import { useCallback, useRef, useState } from "react";
import { mapSpeechError, parseApiError } from "@/lib/user-messages";

interface UseGroqTranscriptionOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

const CHUNK_MS = 10_000;

/**
 * Firefox / unsupported browsers — 10s MediaRecorder chunks → Groq Whisper via /api/transcribe.
 */
export function useGroqTranscription({
  onResult,
  onError,
  enabled = true,
}: UseGroqTranscriptionOptions) {
  const [isListening, setIsListening] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const clearChunkTimer = useCallback(() => {
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    clearChunkTimer();
    if (recorderRef.current?.state !== "inactive") {
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [clearChunkTimer]);

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      if (blob.size === 0) return;
      try {
        const formData = new FormData();
        formData.append("audio", blob, "audio.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        if (!res.ok) {
          onError?.(await parseApiError(res));
          return;
        }
        const data = (await res.json()) as { text?: string };
        const text = data.text?.trim();
        if (text) onResult(text, true);
      } catch {
        onError?.(mapSpeechError("Transcription failed"));
      }
    },
    [onError, onResult]
  );

  const startNextChunk = useCallback(() => {
    if (!isListeningRef.current || !streamRef.current) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        void transcribeBlob(event.data);
      }
    };

    recorder.onstop = () => {
      if (isListeningRef.current) {
        startNextChunk();
      }
    };

    recorder.onerror = () => {
      onError?.(mapSpeechError("Audio recording error"));
      stop();
    };

    recorder.start();
    recorderRef.current = recorder;

    clearChunkTimer();
    chunkTimerRef.current = setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, CHUNK_MS);
  }, [clearChunkTimer, onError, stop, transcribeBlob]);

  const start = useCallback(async () => {
    if (!enabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      isListeningRef.current = true;
      setIsListening(true);
      startNextChunk();
    } catch {
      onError?.(mapSpeechError("not-allowed"));
    }
  }, [enabled, onError, startNextChunk]);

  return {
    isListening,
    isSupported: typeof window !== "undefined" && typeof MediaRecorder !== "undefined",
    start,
    stop,
    provider: "groq" as const,
  };
}
