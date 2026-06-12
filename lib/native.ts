// Detects the Capacitor native shell. The iOS app configures its audio
// session with mixWithOthers + duckOthers, so coach audio coexists with the
// user's music there — web-only constraints (like defaulting coach audio off)
// don't apply inside the native app.
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

// ─── HealthKit bridge (iOS shell only) ───────────────────────────────────────
// Backed by HealthKitPlugin.swift, registered as "GymTwinHealth". Everything
// no-ops gracefully on web / Android / older shells without the plugin.

type HealthPlugin = {
  isAvailable: () => Promise<{ available: boolean }>;
  requestAuthorization: () => Promise<{ granted: boolean }>;
  saveWorkout: (opts: { durationMinutes: number; calories?: number }) => Promise<{ saved: boolean }>;
};

function healthPlugin(): HealthPlugin | null {
  if (!isNativeApp()) return null;
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, unknown> } }).Capacitor;
  return (cap?.Plugins?.GymTwinHealth as HealthPlugin | undefined) ?? null;
}

/**
 * Saves a completed workout into Apple Health (rings credit). Authorization
 * is requested lazily on first save; failures are swallowed — Health sync is
 * a bonus, never a blocker for finishing a workout.
 */
export async function saveWorkoutToAppleHealth(durationMinutes: number, calories?: number): Promise<boolean> {
  const plugin = healthPlugin();
  if (!plugin || durationMinutes <= 0) return false;
  try {
    const { available } = await plugin.isAvailable();
    if (!available) return false;
    const { granted } = await plugin.requestAuthorization();
    if (!granted) return false;
    const { saved } = await plugin.saveWorkout({ durationMinutes, calories });
    return saved;
  } catch {
    return false;
  }
}
