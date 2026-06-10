"use client";

import { useCallback, useRef, useState } from "react";
import type { CoachAvatar } from "@/types";

type MessageTurn = { role: "user" | "assistant"; content: string };

export type CoachConversationContext = {
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  repsDone: number;
  targetReps: number;
  cleanRepCount: number;
  needsWorkRepCount: number;
  feedbackMessage: string;
  isRestPhase: boolean;
  elapsedMinutes: number;
  sessionStreak?: number;
  lastSessionScore?: number;
};

type UseCoachConversationReturn = {
  sendMessage: (message: string, context: CoachConversationContext) => Promise<string | null>;
  isThinking: boolean;
  lastReply: string | null;
  clearHistory: () => void;
};

export function useCoachConversation(avatar: CoachAvatar): UseCoachConversationReturn {
  const historyRef = useRef<MessageTurn[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastReply, setLastReply] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, context: CoachConversationContext): Promise<string | null> => {
    if (!message.trim() || isThinking) return null;

    setIsThinking(true);
    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          avatar,
          history: historyRef.current,
          context,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json() as { error: string };
        if (error === "anthropic_not_configured") return null;
        return null;
      }

      const { reply } = await res.json() as { reply: string };
      if (!reply) return null;

      historyRef.current = [
        ...historyRef.current.slice(-8),
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ];

      setLastReply(reply);
      return reply;
    } catch {
      return null;
    } finally {
      setIsThinking(false);
    }
  }, [avatar, isThinking]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setLastReply(null);
  }, []);

  return { sendMessage, isThinking, lastReply, clearHistory };
}
