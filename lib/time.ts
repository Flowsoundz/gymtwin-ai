export function todayString() {
  return new Date().toDateString();
}

export function yesterdayString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toDateString();
}

export function secondsToClock(totalSeconds: number) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.max(0, totalSeconds) % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function calculateActualMinutes(sessionStartedAt: number | null) {
  if (!sessionStartedAt) return 1;
  const elapsedMs = Date.now() - sessionStartedAt;
  return Math.max(1, Math.round(elapsedMs / 60000));
}
