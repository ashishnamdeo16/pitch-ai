"use client";

import { hasWebSpeech, useSpeechRecognition } from "./use-speech-recognition";
import { useGroqTranscription } from "./use-groq-transcription";

interface UseTranscriptionOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string;
}

/**
 * STT: Web Speech API (primary) → Groq Whisper via /api/transcribe (fallback).
 */
export function useTranscription({
  onResult,
  onError,
  language,
}: UseTranscriptionOptions) {
  const useWebSpeech =
    typeof window !== "undefined" ? hasWebSpeech() : true;

  const webSpeech = useSpeechRecognition({
    onResult,
    onError,
    language,
    enabled: useWebSpeech,
  });

  const groq = useGroqTranscription({
    onResult,
    onError,
    enabled: !useWebSpeech,
  });

  if (useWebSpeech) {
    return {
      ...webSpeech,
      sttMode: "webspeech" as const,
      provider: "webspeech" as const,
    };
  }

  return {
    ...groq,
    sttMode: "groq" as const,
    provider: "groq" as const,
  };
}
