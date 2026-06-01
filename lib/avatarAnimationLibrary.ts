import type { CoachAnimationHint } from "@/lib/coachBrain";
import type { CoachAvatar, AvatarAnimationClip } from "@/types";

// Future asset path examples for real converted animation files:
// - public/animations/idle/atlas_idle_default.glb
// - public/animations/emotes/atlas_thumbs_up_default.glb
// - public/animations/dance/hype/atlas_dance_hype_01.glb
// - public/animations/fitness/squat/atlas_squat_demo_01.glb
// - public/animations/fitness/pushup/atlas_pushup_demo_01.glb
// - public/animations/fitness/plank/atlas_plank_demo_01.glb
//
// When a real file exists:
// 1. add `filePath: "/animations/.../your_file.glb"`
// 2. flip `isAvailable` to true
// 3. keep `embeddedClipName` only if the fallback should still prefer an embedded clip
//
// Do not add filePath values below until the referenced file is present in /public.
export const defaultAvatarAnimationLibrary: AvatarAnimationClip[] = [
  {
    id: "idle_default",
    label: "Idle Default",
    category: "idle",
    animationHint: "idle",
    embeddedClipName: "Idle",
    isAvailable: true,
    description: "Default standing idle clip with a stable neutral stance.",
  },
  {
    id: "listening_default",
    label: "Listening Default",
    category: "conversation",
    animationHint: "listening",
    embeddedClipName: "Idle",
    isAvailable: true,
    description: "Default listening pose using the embedded character clip when available.",
  },
  {
    id: "talking_default",
    label: "Talking Default",
    category: "conversation",
    animationHint: "talking",
    embeddedClipName: "Idle",
    isAvailable: true,
    description: "Default talking animation mapped to embedded idle until dedicated conversation clips are added.",
  },
  {
    id: "thumbs_up_default",
    label: "Thumbs Up Default",
    category: "reaction",
    animationHint: "thumbs_up",
    embeddedClipName: "Idle",
    isAvailable: true,
    description: "Positive reaction clip using the current embedded/default motion path.",
  },
  {
    id: "warning_default",
    label: "Warning Default",
    category: "reaction",
    animationHint: "warning",
    embeddedClipName: "Idle",
    isAvailable: true,
    description: "Warning-state reaction using embedded animation fallback and procedural emphasis.",
  },
  {
    id: "celebrate_default",
    label: "Celebrate Default",
    category: "celebration",
    animationHint: "celebrate",
    embeddedClipName: "Idle",
    isAvailable: true,
    description: "Celebration clip using the existing embedded/procedural celebrate behavior.",
  },
  {
    id: "dance_hype_placeholder",
    label: "Dance Hype",
    category: "dance",
    animationHint: "celebrate",
    // Future path: /animations/dance/hype/{avatar}_dance_hype_01.glb
    isAvailable: false,
    isPremium: true,
    description: "Animation placeholder for future dance or hype celebrations.",
  },
  {
    id: "squat_demo_placeholder",
    label: "Squat Demo",
    category: "workout_demo",
    animationHint: "pointing",
    // Future path: /animations/fitness/squat/{avatar}_squat_demo_01.glb
    isAvailable: false,
    description: "Animation placeholder for future squat demonstration packs.",
  },
  {
    id: "pushup_demo_placeholder",
    label: "Push-Up Demo",
    category: "workout_demo",
    animationHint: "pointing",
    // Future path: /animations/fitness/pushup/{avatar}_pushup_demo_01.glb
    isAvailable: false,
    description: "Animation placeholder for future push-up demonstration packs.",
  },
  {
    id: "plank_demo_placeholder",
    label: "Plank Demo",
    category: "workout_demo",
    animationHint: "pointing",
    // Future path: /animations/fitness/plank/{avatar}_plank_demo_01.glb
    isAvailable: false,
    description: "Animation placeholder for future plank demonstration packs.",
  },
];

const defaultEmbeddedClipNames = ["Idle", "idle", "Breathing", "breathing", "Armature|mixamo.com|Layer0"];

export function getAvatarAnimationLibrary(selectedAvatar?: CoachAvatar): AvatarAnimationClip[] {
  void selectedAvatar;
  return defaultAvatarAnimationLibrary;
}

export function getAvatarAnimationClipById(
  clipId: string,
  selectedAvatar?: CoachAvatar
): AvatarAnimationClip | null {
  return getAvatarAnimationLibrary(selectedAvatar).find((clip) => clip.id === clipId) ?? null;
}

export function getAnimationForHint(
  animationHint: CoachAnimationHint,
  selectedAvatar: CoachAvatar
): AvatarAnimationClip | null {
  const library = getAvatarAnimationLibrary(selectedAvatar);
  const exactMatch = library.find(
    (clip) => clip.animationHint === animationHint && clip.isAvailable
  );

  if (exactMatch) {
    return exactMatch;
  }

  const fallback = library.find((clip) => clip.animationHint === animationHint);
  return fallback ?? null;
}

export function getEmbeddedClipNameCandidates(
  animationHint: CoachAnimationHint,
  selectedAvatar: CoachAvatar,
  preferredClipId?: string | null
): string[] {
  const preferredClip = preferredClipId
    ? getAvatarAnimationClipById(preferredClipId, selectedAvatar)
    : getAnimationForHint(animationHint, selectedAvatar);

  const candidates = preferredClip?.embeddedClipName
    ? [preferredClip.embeddedClipName, ...defaultEmbeddedClipNames]
    : defaultEmbeddedClipNames;

  return Array.from(new Set(candidates));
}
