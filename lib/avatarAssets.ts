import type { CoachAvatar } from "@/types";

export const ATLAS_RUNTIME_COACH_MODEL_PATH =
  "/models/gymtwin/male/GymTwin_Male_Rigged.glb";

// New optimized female model: Blender → Mixamo rig → GLB, 43k triangles.
// Exported with Z-up (Blender default without Y-up conversion); Coach3D
// applies a -π/2 X-rotation wrapper so it stands upright in Three.js.
export const GYMTWIN_FEMALE_MODEL_PATH =
  "/models/gymtwin/female/GymTwin_Female_43K_Rigged.glb";

// Legacy female model kept as fallback — not actively used by Nova.
export const NOVA_LEGACY_MODEL_PATH =
  "/models/GT_Female_40k_RiggedApp_v01.glb";

export const NOVA_RUNTIME_COACH_MODEL_PATH = GYMTWIN_FEMALE_MODEL_PATH;

export function isSharedRuntimeHumanoidModel(modelPath: string): boolean {
  return (
    modelPath.includes("atlas-coach-mobile") ||
    modelPath.includes("GymTwin_Male_Rigged") ||
    modelPath.includes("GT_Female_40k_RiggedApp_v01") ||
    modelPath.includes("GymTwin_Female_43K_Rigged")
  );
}

type AvatarProfile = {
  label: string;
  subtitle: string;
  role: string;
  personality: string;
  image: string;
  modelPaths: string[];
  accentGradient: string;
  accentText: string;
  readyLabel: string;
};

const avatarProfiles: Record<CoachAvatar, AvatarProfile> = {
  Nova: {
    label: "Nova",
    subtitle: "AI Coach",
    role: "Focused, motivating, form-first.",
    personality: "Precision coach",
    image: "/avatars/GTFMODEL.png",
    modelPaths: [NOVA_RUNTIME_COACH_MODEL_PATH],
    accentGradient: "from-fuchsia-500/28 via-blue-500/18 to-slate-950",
    accentText: "text-fuchsia-200",
    readyLabel: "Ready",
  },
  Atlas: {
    label: "Atlas",
    subtitle: "AI Coach",
    role: "Disciplined, strong, performance-first.",
    personality: "Performance coach",
    image: "/avatars/GTMMODEL.png",
    modelPaths: [ATLAS_RUNTIME_COACH_MODEL_PATH],
    accentGradient: "from-blue-500/28 via-indigo-500/18 to-slate-950",
    accentText: "text-blue-200",
    readyLabel: "Ready",
  },
};

export function getAvatarProfile(avatar: CoachAvatar): AvatarProfile {
  return avatarProfiles[avatar];
}

export function getAvatarAsset(avatar: CoachAvatar): string {
  return getAvatarProfile(avatar).image;
}

export function getAvatarLabel(avatar: CoachAvatar): string {
  return getAvatarProfile(avatar).label;
}

export function getAvatarSubtitle(avatar: CoachAvatar): string {
  return getAvatarProfile(avatar).subtitle;
}

export function getAvatarRole(avatar: CoachAvatar): string {
  return getAvatarProfile(avatar).role;
}

export function getAvatarPersonality(avatar: CoachAvatar): string {
  return getAvatarProfile(avatar).personality;
}

export function getAvatarModelPaths(avatar: CoachAvatar): string[] {
  return getAvatarProfile(avatar).modelPaths;
}
