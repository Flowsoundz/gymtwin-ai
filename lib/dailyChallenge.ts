import { DAILY_CHALLENGE_KEY } from "@/lib/storageKeys";

// ─── Daily Challenge ──────────────────────────────────────────────────────────
// One small bonus task per day, deterministic from the date (same challenge all
// day, no server needed). Roughly one day in seven is a Double XP day — the
// variable-reward hook. Completion streak + lifetime bonus XP live in
// localStorage; nothing here touches workout stats or cloud sync.

export interface DailyChallenge {
  emoji: string;
  label: string;
  xp: number;
  doubleXp: boolean;
}

const POOL: Array<Omit<DailyChallenge, "doubleXp">> = [
  { emoji: "🏃", label: "40 high knees", xp: 10 },
  { emoji: "🧱", label: "30-second plank", xp: 15 },
  { emoji: "🦵", label: "15 air squats", xp: 10 },
  { emoji: "💪", label: "10 push-ups", xp: 15 },
  { emoji: "🪑", label: "30-second wall sit", xp: 10 },
  { emoji: "⚡", label: "12 burpees", xp: 25 },
  { emoji: "🤸", label: "20 jumping jacks", xp: 10 },
  { emoji: "🧘", label: "60-second full-body stretch", xp: 10 },
  { emoji: "🔥", label: "20 mountain climbers", xp: 15 },
  { emoji: "🦶", label: "25 calf raises", xp: 10 },
];

function dayNumber(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}

function todayString(): string {
  return new Date().toDateString();
}

function yesterdayString(): string {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return y.toDateString();
}

export function getTodayChallenge(): DailyChallenge {
  const day = dayNumber();
  const pick = POOL[((day % POOL.length) + POOL.length) % POOL.length];
  const doubleXp = (day * 31) % 7 === 0;
  return { ...pick, xp: doubleXp ? pick.xp * 2 : pick.xp, doubleXp };
}

export interface ChallengeState {
  lastCompletedDate: string | null;
  streak: number;
  totalXp: number;
}

function ls(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readChallengeState(): ChallengeState {
  try {
    const raw = ls()?.getItem(DAILY_CHALLENGE_KEY);
    if (!raw) return { lastCompletedDate: null, streak: 0, totalXp: 0 };
    const p = JSON.parse(raw) as Partial<ChallengeState>;
    return {
      lastCompletedDate: typeof p.lastCompletedDate === "string" ? p.lastCompletedDate : null,
      streak: typeof p.streak === "number" ? p.streak : 0,
      totalXp: typeof p.totalXp === "number" ? p.totalXp : 0,
    };
  } catch {
    return { lastCompletedDate: null, streak: 0, totalXp: 0 };
  }
}

export function isCompletedToday(state = readChallengeState()): boolean {
  return state.lastCompletedDate === todayString();
}

/** Marks today's challenge complete; returns the updated state. */
export function completeTodayChallenge(): ChallengeState {
  const state = readChallengeState();
  if (isCompletedToday(state)) return state;
  const challenge = getTodayChallenge();
  const next: ChallengeState = {
    lastCompletedDate: todayString(),
    streak: state.lastCompletedDate === yesterdayString() ? state.streak + 1 : 1,
    totalXp: state.totalXp + challenge.xp,
  };
  try { ls()?.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}
