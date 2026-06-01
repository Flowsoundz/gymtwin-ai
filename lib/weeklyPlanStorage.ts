import { WEEKLY_PLAN_KEY } from "@/lib/storageKeys";
import { getTodayWeeklyPlanLabel } from "@/lib/weeklyPlanEngine";
import type { WeeklyPlan } from "@/types";

export function readWeeklyPlan(): WeeklyPlan | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(WEEKLY_PLAN_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as WeeklyPlan;
  } catch {
    window.localStorage.removeItem(WEEKLY_PLAN_KEY);
    return null;
  }
}

export function saveWeeklyPlan(plan: WeeklyPlan): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(plan));
}

export function clearWeeklyPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WEEKLY_PLAN_KEY);
}

export function markTodayComplete(plan?: WeeklyPlan | null): WeeklyPlan | null {
  const activePlan = plan ?? readWeeklyPlan();
  if (!activePlan) return null;

  const todayLabel = getTodayWeeklyPlanLabel();
  const nextPlan: WeeklyPlan = {
    ...activePlan,
    days: activePlan.days.map((day) =>
      day.dayLabel === todayLabel ? { ...day, completed: true } : day
    ),
  };

  saveWeeklyPlan(nextPlan);
  return nextPlan;
}
