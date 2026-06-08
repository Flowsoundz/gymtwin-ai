import type { CoachAvatar, CoachName, CoachTalkativeness, WorkoutAudioLevel } from "@/types";

export type CoachVoicePriority =
  | "ambient"
  | "encouragement"
  | "transition"
  | "countdown"
  | "form_correction"
  | "safety";

export type CoachQuotePhase = "intro" | "action" | "recovery" | "outro";

export type CoachVoiceIntent =
  | {
      type: "direct_text";
      text: string;
      priority?: CoachVoicePriority;
      emphasis?: "standard" | "distance";
    }
  | {
      type: "coach_quote";
      phase: CoachQuotePhase;
      prefix?: string;
      priority?: CoachVoicePriority;
    }
  | {
      type: "session_start";
      movementName: string;
      priority?: CoachVoicePriority;
    }
  | {
      type: "resume_workout";
      priority?: CoachVoicePriority;
    }
  | {
      type: "rest_start";
      seconds: number;
      priority?: CoachVoicePriority;
    }
  | {
      type: "next_movement";
      movementName: string;
      priority?: CoachVoicePriority;
    }
  | {
      type: "session_complete";
      priority?: CoachVoicePriority;
    }
  | {
      type: "safety_stop";
      priority?: CoachVoicePriority;
    }
  | {
      type: "difficulty_change";
      direction: "easy" | "hard";
      priority?: CoachVoicePriority;
    }
  | {
      type: "rep_milestone";
      repCount: number;
      talkativeness: CoachTalkativeness;
      priority?: CoachVoicePriority;
    }
  | {
      type: "form_correction";
      label: "clean" | "shallow" | "unstable";
      talkativeness: CoachTalkativeness;
      priority?: CoachVoicePriority;
    };

export type CoachVoiceContext = {
  selectedCoach: CoachName;
  selectedAvatar: CoachAvatar;
  coachVoiceVolume: WorkoutAudioLevel;
};

export type ResolvedCoachVoiceIntent = {
  text: string;
  caption: string;
  clipUrl: string | null;
  priority: CoachVoicePriority;
  emphasis: "standard" | "distance";
};
