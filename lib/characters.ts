export type CharacterId =
  | "nova"
  | "atlas"
  | "anime-female"
  | "anime-male"
  | "virtual-idol"
  | "cyber-artist";

export type Character = {
  id: CharacterId;
  name: string;
  subtitle: string;
  personality: string;
  modelPath: string;
  accentColor: string;
  rimColor: string;
  avatar: string;
  available: boolean;
};

export const CHARACTERS: Record<CharacterId, Character> = {
  nova: {
    id: "nova",
    name: "Nova",
    subtitle: "AI Coach",
    personality: "Precision coach. Focused, motivating, form-first.",
    modelPath: "/models/gymtwin/female/GymTwin_Female_43K_Rigged.glb",
    accentColor: "#ff00dd",
    rimColor: "#dd00ff",
    avatar: "/avatars/GTFMODEL.png",
    available: true,
  },
  atlas: {
    id: "atlas",
    name: "Atlas",
    subtitle: "AI Coach",
    personality: "Performance coach. Disciplined, strong, results-first.",
    modelPath: "/models/gymtwin/male/GymTwin_Male_43K_Rigged_UPRIGHT.glb",
    accentColor: "#00aaff",
    rimColor: "#0066ff",
    avatar: "/avatars/GTMMODEL.png",
    available: true,
  },
  "anime-female": {
    id: "anime-female",
    name: "Sakura",
    subtitle: "AI Coach",
    personality: "Energetic, encouraging, high-intensity specialist.",
    modelPath: "",
    accentColor: "#ff6eb4",
    rimColor: "#ff4da6",
    avatar: "/avatars/GTFMODEL.png",
    available: false,
  },
  "anime-male": {
    id: "anime-male",
    name: "Ryu",
    subtitle: "AI Coach",
    personality: "Calm, focused, martial arts and flexibility.",
    modelPath: "",
    accentColor: "#ff6600",
    rimColor: "#ff4400",
    avatar: "/avatars/GTMMODEL.png",
    available: false,
  },
  "virtual-idol": {
    id: "virtual-idol",
    name: "Lyra",
    subtitle: "AI Coach",
    personality: "High-energy, dance-based training specialist.",
    modelPath: "",
    accentColor: "#00ffcc",
    rimColor: "#00ddaa",
    avatar: "/avatars/GTFMODEL.png",
    available: false,
  },
  "cyber-artist": {
    id: "cyber-artist",
    name: "Vex",
    subtitle: "AI Coach",
    personality: "Underground, unconventional, calisthenics expert.",
    modelPath: "",
    accentColor: "#aaff00",
    rimColor: "#88dd00",
    avatar: "/avatars/GTMMODEL.png",
    available: false,
  },
};

export const AVAILABLE_CHARACTERS = Object.values(CHARACTERS).filter(
  (c) => c.available
);

export function getCharacter(id: CharacterId): Character {
  return CHARACTERS[id];
}

// Mixamo idle clip name — same for all characters using the shared rig
export const MIXAMO_IDLE_CLIP = "Armature|mixamo.com|Layer0";

// Master animation pack — all characters use this for fitness demos
export const MASTER_ANIMATION_PACK = "/models/animations/fitness-animations.glb";
