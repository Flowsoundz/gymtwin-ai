import { BODY_PROFILE_KEY } from "@/lib/storageKeys";
import type { BodyProfile } from "@/types";

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
}

export function clearBodyProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BODY_PROFILE_KEY);
}
