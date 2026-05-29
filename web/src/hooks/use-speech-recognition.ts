"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string;
  enabled?: boolean;
}

/**
 * Web Speech API streaming STT with interim results.
 */
export function useSpeechRecognition({
  onResult,
  onError,
  language = "en-US",
  enabled = true,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled) return;

    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    if (!SR) {
      setIsSupported(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) onResultRef.current(interim, false);
      if (final) onResultRef.current(final, true);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      onErrorRef.current?.(e.error);
      if (e.error !== "no-speech") {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [language, enabled]);

  const start = useCallback(async () => {
    if (!enabled) return;
    if (!recognitionRef.current) {
      onErrorRef.current?.("Speech recognition not supported");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      isListeningRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      onErrorRef.current?.("Microphone permission denied");
    }
  }, [enabled]);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  return {
    isListening,
    isSupported: enabled ? isSupported : false,
    start,
    stop,
    provider: "webspeech" as const,
  };
}
