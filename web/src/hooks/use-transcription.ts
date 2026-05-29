"use client";

import { USE_DEEPGRAM } from "@/lib/constants";
import { useDeepgramRecognition } from "./use-deepgram-recognition";
import { useSpeechRecognition } from "./use-speech-recognition";

interface UseTranscriptionOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  sendAudioChunk?: (data: string, sequence: number) => void;
  language?: string;
}

/**
 * Unified STT hook — Deepgram (server-side) when enabled, else Web Speech API.
 */
export function useTranscription({
  onResult,
  onError,
  sendAudioChunk,
  language,
}: UseTranscriptionOptions) {
  const webSpeech = useSpeechRecognition({
    onResult,
    onError,
    language,
    enabled: !USE_DEEPGRAM,
  });

  const deepgram = useDeepgramRecognition({
    onError,
    sendAudioChunk: sendAudioChunk ?? (() => {}),
    enabled: USE_DEEPGRAM,
  });

  if (USE_DEEPGRAM) {
    return {
      ...deepgram,
      provider: "deepgram" as const,
    };
  }

  return {
    ...webSpeech,
    provider: "webspeech" as const,
  };
}
