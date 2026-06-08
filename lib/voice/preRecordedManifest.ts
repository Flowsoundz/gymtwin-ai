import type { CoachAvatar } from "@/types";

export type PreRecordedVoiceKey =
  | "session_start"
  | "resume_workout"
  | "rest_start"
  | "session_complete"
  | "safety_stop"
  | "rep_milestone_5"
  | "rep_milestone_10"
  | "form_clean"
  | "form_shallow"
  | "form_unstable";

type AvatarVoiceManifest = Partial<Record<PreRecordedVoiceKey, string>>;

export const PRE_RECORDED_VOICE_MANIFEST: Partial<Record<CoachAvatar, AvatarVoiceManifest>> = {
  Nova: {
    session_start: "/audio/coaches/nova/session_start.mp3",
    resume_workout: "/audio/coaches/nova/resume_workout.mp3",
    rest_start: "/audio/coaches/nova/rest_start.mp3",
    session_complete: "/audio/coaches/nova/session_complete.mp3",
    safety_stop: "/audio/coaches/nova/safety_stop.mp3",
    rep_milestone_5: "/audio/coaches/nova/rep_5.mp3",
    rep_milestone_10: "/audio/coaches/nova/rep_10.mp3",
    form_clean: "/audio/coaches/nova/form_clean.mp3",
    form_shallow: "/audio/coaches/nova/form_shallow.mp3",
    form_unstable: "/audio/coaches/nova/form_unstable.mp3",
  },
};

export function getPreRecordedVoiceClip(
  avatar: CoachAvatar,
  key: PreRecordedVoiceKey
): string | null {
  return PRE_RECORDED_VOICE_MANIFEST[avatar]?.[key] ?? null;
}
