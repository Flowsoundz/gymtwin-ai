// Detects the Capacitor native shell. The iOS app configures its audio
// session with mixWithOthers + duckOthers, so coach audio coexists with the
// user's music there — web-only constraints (like defaulting coach audio off)
// don't apply inside the native app.
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}
