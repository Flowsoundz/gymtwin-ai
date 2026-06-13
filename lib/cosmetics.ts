import { EQUIPPED_AURA_KEY } from "@/lib/storageKeys";
import { getExperienceSnapshot, type ExperienceLevelName } from "@/lib/experienceLevels";

// ─── Aura cosmetics ───────────────────────────────────────────────────────────
// XP's payoff: each experience level unlocks an Aura that recolors the live 3D
// coach (platform / floor / energy ring via accentOverride) and the hero glow.
// Pure cosmetic, reuses the existing canvas color params — no new 3D assets.
// "default" is always owned and means "use the coach's native color".

export interface Aura {
  id: string;
  name: string;
  /** Hex accent driving the canvas platform/ring/floor. null = coach's native color. */
  accent: string | null;
  /** Tailwind gradient classes for the hero glow blur behind the coach. */
  heroGradient: string;
  /** Experience level that unlocks it. "Rookie" = owned from the start. */
  unlockLevel: ExperienceLevelName;
  blurb: string;
}

export const AURAS: Aura[] = [
  { id: "default",  name: "Signature",     accent: null,      heroGradient: "from-blue-500/24 via-cyan-400/10 to-indigo-400/18",     unlockLevel: "Rookie",   blurb: "Your coach's native glow." },
  { id: "ember",    name: "Ember",         accent: "#ff6a3d",  heroGradient: "from-orange-500/26 via-rose-500/12 to-amber-400/18",    unlockLevel: "Starter",  blurb: "Warm fire for the consistent." },
  { id: "emerald",  name: "Emerald Surge", accent: "#00ff88",  heroGradient: "from-emerald-400/28 via-cyan-400/12 to-emerald-300/20", unlockLevel: "Builder",  blurb: "Green energy of momentum." },
  { id: "violet",   name: "Violet Pulse",  accent: "#a855f7",  heroGradient: "from-violet-500/28 via-fuchsia-500/12 to-purple-400/18", unlockLevel: "Striker",  blurb: "Deep violet for the relentless." },
  { id: "ice",      name: "Ice Crystal",   accent: "#7dd3fc",  heroGradient: "from-sky-300/28 via-cyan-300/12 to-blue-300/18",        unlockLevel: "Vanguard", blurb: "Cold, clean, unbothered." },
  { id: "gold",     name: "Champion Gold", accent: "#fbbf24",  heroGradient: "from-amber-400/30 via-yellow-400/14 to-orange-400/18",  unlockLevel: "Elite",    blurb: "Earned by the few." },
  { id: "twin",     name: "Twin Prism",    accent: "#ff2da6",  heroGradient: "from-fuchsia-500/30 via-cyan-400/14 to-violet-500/22",  unlockLevel: "Twin",     blurb: "The signature of a finished twin." },
];

const LEVEL_ORDER: ExperienceLevelName[] = [
  "Rookie", "Starter", "Builder", "Striker", "Vanguard", "Elite", "Twin",
];

export function getAura(id: string): Aura {
  return AURAS.find((a) => a.id === id) ?? AURAS[0];
}

export function isAuraUnlocked(aura: Aura, totalXp: number): boolean {
  const reached = getExperienceSnapshot(totalXp).currentLevel.name;
  return LEVEL_ORDER.indexOf(reached) >= LEVEL_ORDER.indexOf(aura.unlockLevel);
}

/** Auras whose unlock level == the level just reached (for level-up callouts). */
export function aurasUnlockedAtLevel(levelName: ExperienceLevelName): Aura[] {
  return AURAS.filter((a) => a.unlockLevel === levelName && a.id !== "default");
}

function ls(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readEquippedAuraId(): string {
  return ls()?.getItem(EQUIPPED_AURA_KEY) ?? "default";
}

export function saveEquippedAuraId(id: string): void {
  try { ls()?.setItem(EQUIPPED_AURA_KEY, id); } catch { /* ignore */ }
}
