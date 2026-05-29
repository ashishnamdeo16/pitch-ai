"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string;
  enabled?: boolean;
}

export function hasWebSpeech(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
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

    if (!hasWebSpeech()) {
      setIsSupported(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      if (interim) onResultRef.current(interim.trim(), false);
      if (final) {
        const text = final.trim();
        if (text) onResultRef.current(text, true);
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "no-speech") return;

      if (e.error === "not-allowed") {
        onErrorRef.current?.("Microphone permission denied");
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }

      if (isListeningRef.current) {
        setTimeout(() => {
          if (!isListeningRef.current || !recognitionRef.current) return;
          try {
            recognitionRef.current.start();
          } catch {
            /* already started */
          }
        }, 500);
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
