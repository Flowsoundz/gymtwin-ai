import type { CoachAvatar } from "@/types";

export type PreRecordedVoiceKey =
  | "session_start"
  | "resume_workout"
  | "rest_start"
  | "next_movement"
  | "session_complete"
  | "safety_stop"
  | "difficulty_easier"
  | "difficulty_harder"
  | "rep_milestone_5"
  | "rep_milestone_10"
  | "form_clean"
  | "form_shallow"
  | "form_unstable";

type AvatarVoiceManifest = Partial<Record<PreRecordedVoiceKey, string>>;

export const PRE_RECORDED_VOICE_MANIFEST: Partial<Record<CoachAvatar, AvatarVoiceManifest>> = {
  Nova: {
    session_start: "/audio/coaches/nova/session_start.wav",
    resume_workout: "/audio/coaches/nova/resume_workout.wav",
    rest_start: "/audio/coaches/nova/rest_start.wav",
    next_movement: "/audio/coaches/nova/next_movement.wav",
    session_complete: "/audio/coaches/nova/session_complete.wav",
    safety_stop: "/audio/coaches/nova/safety_stop.wav",
    difficulty_easier: "/audio/coaches/nova/difficulty_easier.wav",
    difficulty_harder: "/audio/coaches/nova/difficulty_harder.wav",
    rep_milestone_5: "/audio/coaches/nova/rep_5.wav",
    rep_milestone_10: "/audio/coaches/nova/rep_10.wav",
    form_shallow: "/audio/coaches/nova/form_shallow.wav",
    form_unstable: "/audio/coaches/nova/form_unstable.wav",
  },
};

export function getPreRecordedVoiceClip(
  avatar: CoachAvatar,
  key: PreRecordedVoiceKey
): string | null {
  return PRE_RECORDED_VOICE_MANIFEST[avatar]?.[key] ?? null;
}
