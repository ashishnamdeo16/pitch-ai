"use client";

import { useCallback, useRef, useState } from "react";

interface UseDeepgramRecognitionOptions {
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  sendAudioChunk: (data: string, sequence: number) => void;
  enabled?: boolean;
}

/**
 * Captures microphone audio and streams webm chunks to the realtime server.
 * Deepgram STT runs server-side — API key never hits the browser.
 */
export function useDeepgramRecognition({
  onError,
  sendAudioChunk,
  enabled = true,
}: UseDeepgramRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(
    typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sequenceRef = useRef(0);

  const stop = useCallback(() => {
    setIsListening(false);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;
    if (!isSupported) {
      onError?.("MediaRecorder not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return;
        sequenceRef.current += 1;
        const buffer = await event.data.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        sendAudioChunk(base64, sequenceRef.current);
      };

      recorder.onerror = () => {
        onError?.("Audio recording error");
        stop();
      };

      // 250ms chunks — balances latency vs. websocket overhead
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsListening(true);
    } catch {
      onError?.("Microphone permission denied");
    }
  }, [enabled, isSupported, onError, sendAudioChunk, stop]);

  return {
    isListening,
    isSupported,
    start,
    stop,
    provider: "deepgram" as const,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
