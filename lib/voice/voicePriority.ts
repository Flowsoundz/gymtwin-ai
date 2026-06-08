import type { CoachVoicePriority } from "@/lib/voice/voiceIntents";

const PRIORITY_SCORE: Record<CoachVoicePriority, number> = {
  ambient: 1,
  encouragement: 2,
  transition: 3,
  countdown: 4,
  form_correction: 5,
  safety: 6,
};

export function getCoachVoicePriorityScore(priority: CoachVoicePriority): number {
  return PRIORITY_SCORE[priority];
}
