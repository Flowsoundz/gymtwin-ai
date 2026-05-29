"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VoiceCommand =
  | "start_camera"
  | "stop_camera"
  | "complete_set"
  | "skip_rest"
  | "too_easy"
  | "too_hard"
  | "pain_stop"
  | "switch_squat"
  | "switch_pushup"
  | "switch_plank"
  | "mute"
  | "unmute"
  | "unknown";

type UseVoiceCommandsOptions = {
  onCommand: (command: VoiceCommand, rawTranscript: string) => void;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultLike = {
  0: {
    transcript: string;
  };
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

function normalizeTranscript(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(transcript: string, phrases: string[]) {
  return phrases.some((phrase) => transcript.includes(phrase));
}

export function parseVoiceCommand(rawTranscript: string): VoiceCommand {
  const transcript = normalizeTranscript(rawTranscript);

  if (!transcript) return "unknown";
  if (includesAny(transcript, ["emergency stop", "stop workout", "pain"])) return "pain_stop";
  if (includesAny(transcript, ["turn off camera", "stop camera", "camera off"])) return "stop_camera";
  if (includesAny(transcript, ["turn on camera", "start camera", "camera on"])) return "start_camera";
  if (includesAny(transcript, ["complete set", "finished set", "done"])) return "complete_set";
  if (includesAny(transcript, ["skip rest", "skip break", "next exercise"])) return "skip_rest";
  if (includesAny(transcript, ["too easy", "make it harder"])) return "too_easy";
  if (includesAny(transcript, ["too hard", "make it easier"])) return "too_hard";
  if (includesAny(transcript, ["switch to squat", "squat mode"])) return "switch_squat";
  if (includesAny(transcript, ["switch to push up", "switch to pushup", "push up mode", "pushup mode"])) return "switch_pushup";
  if (includesAny(transcript, ["switch to plank", "plank mode"])) return "switch_plank";
  if (includesAny(transcript, ["unmute", "voice on"])) return "unmute";
  if (includesAny(transcript, ["mute coach", "mute"])) return "mute";

  return "unknown";
}

export function useVoiceCommands({ onCommand }: UseVoiceCommandsOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const onCommandRef = useRef(onCommand);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setErrorMessage("Voice commands are not supported in this browser yet.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const result = event.results[event.resultIndex];
        if (!result || !result.isFinal) return;

        const rawTranscript = result[0]?.transcript?.trim() || "";
        if (!rawTranscript) return;

        setTranscript(rawTranscript);
        setErrorMessage("");
        onCommandRef.current(parseVoiceCommand(rawTranscript), rawTranscript);
      };

      recognition.onerror = (event) => {
        const error = event.error || "unknown";
        setIsListening(false);
        if (error === "not-allowed" || error === "service-not-allowed") {
          setErrorMessage("Microphone permission was blocked. Enable microphone access in your browser settings and try again.");
          return;
        }
        if (error === "no-speech") {
          setErrorMessage("No speech was detected. Try again when you are ready.");
          return;
        }
        if (error === "audio-capture") {
          setErrorMessage("No microphone was found for voice commands.");
          return;
        }
        setErrorMessage("Voice commands are not available right now.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    setErrorMessage("");
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
  };
}
