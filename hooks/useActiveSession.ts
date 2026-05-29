"use client";

import { ACTIVE_SESSION_KEY } from "@/lib/storageKeys";
import type { ActiveSessionData } from "@/types";

export function readActiveSession(): ActiveSessionData | null {
  if (typeof window === "undefined") return null;

  const savedSession = window.localStorage.getItem(ACTIVE_SESSION_KEY);
  if (!savedSession) return null;

  try {
    return JSON.parse(savedSession) as ActiveSessionData;
  } catch {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    return null;
  }
}

export function saveActiveSession(session: ActiveSessionData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

export function clearStoredActiveSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function hasStoredActiveSession(): boolean {
  if (typeof window === "undefined") return false;
  return readActiveSession() !== null;
}
