import { BODY_PROFILE_KEY } from "@/lib/storageKeys";
import { calculateBMI } from "@/lib/bodyMetrics";
import type { BodyProfile } from "@/types";

const BODY_PROFILE_HISTORY_KEY = `${BODY_PROFILE_KEY}:history`;

export type BodyProfileHistoryEntry = {
  date: string;
  weightLbs?: number;
  goalWeightLbs?: number;
  bmi: number | null;
};

function isValidHistoryEntry(value: unknown): value is BodyProfileHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<BodyProfileHistoryEntry>;
  return typeof entry.date === "string" && "bmi" in entry;
}

export function readBodyProfileHistory(): BodyProfileHistoryEntry[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(BODY_PROFILE_HISTORY_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isValidHistoryEntry)
      .sort((left, right) => left.date.localeCompare(right.date));
  } catch {
    window.localStorage.removeItem(BODY_PROFILE_HISTORY_KEY);
    return [];
  }
}

function saveBodyProfileHistory(entries: BodyProfileHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BODY_PROFILE_HISTORY_KEY, JSON.stringify(entries));
}

export function readBodyProfile(): BodyProfile | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(BODY_PROFILE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as BodyProfile;
  } catch {
    window.localStorage.removeItem(BODY_PROFILE_KEY);
    return null;
  }
}

export function saveBodyProfile(profile: BodyProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BODY_PROFILE_KEY, JSON.stringify(profile));

  const snapshotDate = (profile.lastUpdated ?? new Date().toISOString()).slice(0, 10);
  const snapshot: BodyProfileHistoryEntry = {
    date: snapshotDate,
    weightLbs: profile.weightLbs,
    goalWeightLbs: profile.goalWeightLbs,
    bmi: calculateBMI(profile.heightInches, profile.weightLbs),
  };
  const existing = readBodyProfileHistory().filter((entry) => entry.date !== snapshotDate);
  const updated = [...existing, snapshot]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-30);
  saveBodyProfileHistory(updated);
}

export function clearBodyProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BODY_PROFILE_KEY);
  window.localStorage.removeItem(BODY_PROFILE_HISTORY_KEY);
}
