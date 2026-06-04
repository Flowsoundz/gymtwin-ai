import { NUTRITION_LOG_KEY } from "@/lib/storageKeys";
import type { DailyNutritionLog, FoodItem } from "@/types";

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(date: string): string {
  return `${NUTRITION_LOG_KEY}:${date}`;
}

function dateKeyWithOffset(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function cloneMealForDate(item: FoodItem, targetDate: string, index: number): FoodItem {
  const timestamp = new Date(`${targetDate}T12:00:00.000Z`);
  const sourceTimestamp = new Date(item.timestamp);
  if (!Number.isNaN(sourceTimestamp.getTime())) {
    timestamp.setUTCHours(
      sourceTimestamp.getUTCHours(),
      sourceTimestamp.getUTCMinutes(),
      sourceTimestamp.getUTCSeconds(),
      sourceTimestamp.getUTCMilliseconds()
    );
  }

  const fallbackId = `${targetDate}-${index}-${item.name.toLowerCase().replace(/\s+/g, "-")}`;

  return {
    ...item,
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : fallbackId,
    timestamp: timestamp.toISOString(),
  };
}

export function readTodayNutritionLog(): DailyNutritionLog {
  const today = todayDateKey();
  const empty: DailyNutritionLog = { date: today, consumed: [], burnedCalculated: 0 };
  if (typeof window === "undefined") return empty;

  const raw = window.localStorage.getItem(storageKey(today));
  if (!raw) return empty;

  try {
    return JSON.parse(raw) as DailyNutritionLog;
  } catch {
    window.localStorage.removeItem(storageKey(today));
    return empty;
  }
}

export function readYesterdayNutritionLog(): DailyNutritionLog {
  return readNutritionLogForDate(dateKeyWithOffset(-1));
}

export function saveTodayNutritionLog(log: DailyNutritionLog): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(log.date), JSON.stringify(log));
}

export function appendFoodItem(item: FoodItem): DailyNutritionLog {
  const log = readTodayNutritionLog();
  const updated: DailyNutritionLog = { ...log, consumed: [...log.consumed, item] };
  saveTodayNutritionLog(updated);
  return updated;
}

export function removeFoodItem(id: string): DailyNutritionLog {
  const log = readTodayNutritionLog();
  const updated: DailyNutritionLog = { ...log, consumed: log.consumed.filter((f) => f.id !== id) };
  saveTodayNutritionLog(updated);
  return updated;
}

export function copyYesterdayMealsToToday(): DailyNutritionLog {
  const today = todayDateKey();
  const yesterdayLog = readYesterdayNutritionLog();
  const todayLog = readTodayNutritionLog();
  const updated: DailyNutritionLog = {
    ...todayLog,
    date: today,
    consumed: yesterdayLog.consumed.map((item, index) => cloneMealForDate(item, today, index)),
  };
  saveTodayNutritionLog(updated);
  return updated;
}

export function readNutritionLogForDate(date: string): DailyNutritionLog {
  const empty: DailyNutritionLog = { date, consumed: [], burnedCalculated: 0 };
  if (typeof window === "undefined") return empty;
  const raw = window.localStorage.getItem(storageKey(date));
  if (!raw) return empty;
  try {
    return JSON.parse(raw) as DailyNutritionLog;
  } catch {
    return empty;
  }
}

export function readLast7DaysSummary(): Array<{ date: string; label: string; calories: number }> {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    const label = i === 6 ? "Today" : DAY_LABELS[d.getDay()];
    const log = readNutritionLogForDate(date);
    const calories = log.consumed.reduce((s, f) => s + f.calories, 0);
    return { date, label, calories };
  });
}
