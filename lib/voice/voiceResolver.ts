import { getCoachQuote } from "@/lib/coachEngine";
import {
  getPreRecordedVoiceClip,
  type PreRecordedVoiceKey,
} from "@/lib/voice/preRecordedManifest";
import type {
  CoachVoiceContext,
  CoachVoiceIntent,
  CoachVoicePriority,
  ResolvedCoachVoiceIntent,
} from "@/lib/voice/voiceIntents";

const QUIET_REP_MILESTONES = new Set([5, 10, 15, 20, 25]);

const HYPE_PHRASES: Record<number, string> = {
  1: "Nice. First rep is yours.",
  5: "Five strong. Stay smooth.",
  10: "Ten in. Keep that same pace.",
  15: "Fifteen. You're still moving well.",
  20: "Twenty. Stay with it.",
  25: "Twenty-five. That's real work.",
};

const NORMAL_PHRASES: Record<number, string> = {
  5: "Five good reps.",
  10: "Ten. Keep it tidy.",
  15: "Fifteen. Nice control.",
  20: "Twenty. Stay locked in.",
  25: "Twenty-five. Strong finish.",
};

const FORM_CUE_QUIET = {
  clean: null,
  shallow: "A little deeper.",
  unstable: "Slow it down.",
} as const;

const FORM_CUE_NORMAL = {
  clean: "Yep, that's clean.",
  shallow: "Give me a little more depth.",
  unstable: "Easy pace. Stay in control.",
} as const;

const FORM_CUE_HYPE = {
  clean: "That's it. Clean rep.",
  shallow: "Go a touch deeper. You've got it.",
  unstable: "Tighten up and own the rep.",
} as const;

function clipForIntent(
  context: CoachVoiceContext,
  key: PreRecordedVoiceKey | null
): string | null {
  if (!key) return null;
  return getPreRecordedVoiceClip(context.selectedAvatar, key);
}

function withDefaults(
  text: string,
  priority: CoachVoicePriority,
  clipUrl: string | null,
  emphasis: "standard" | "distance" = "distance"
): ResolvedCoachVoiceIntent {
  return {
    text,
    caption: text,
    clipUrl,
    priority,
    emphasis,
  };
}

export function resolveCoachVoiceIntent(
  intent: CoachVoiceIntent,
  context: CoachVoiceContext
): ResolvedCoachVoiceIntent | null {
  switch (intent.type) {
    case "direct_text":
      return withDefaults(
        intent.text,
        intent.priority ?? "transition",
        null,
        intent.emphasis ?? "distance"
      );
    case "coach_quote": {
      const quote = getCoachQuote(context.selectedCoach, intent.phase);
      const fullLine = intent.prefix ? `${intent.prefix} ${quote}` : quote;
      return withDefaults(fullLine, intent.priority ?? "transition", null);
    }
    case "session_start": {
      const quote = getCoachQuote(context.selectedCoach, "intro");
      const line = `We're up. Start with ${intent.movementName}. ${quote}`;
      return withDefaults(
        line,
        intent.priority ?? "transition",
        clipForIntent(context, "session_start")
      );
    }
    case "resume_workout":
      return withDefaults(
        "Back in. Pick up right where you left off.",
        intent.priority ?? "transition",
        clipForIntent(context, "resume_workout")
      );
    case "rest_start":
      return withDefaults(
        `Take ${intent.seconds} seconds. Breathe and get ready for the next one.`,
        intent.priority ?? "transition",
        clipForIntent(context, "rest_start")
      );
    case "next_movement":
      return withDefaults(
        `Next up: ${intent.movementName}. Set yourself and move well.`,
        intent.priority ?? "transition",
        clipForIntent(context, "next_movement")
      );
    case "session_complete":
      return withDefaults(
        "Nice work. Session done. Catch your breath and recover well.",
        intent.priority ?? "encouragement",
        clipForIntent(context, "session_complete")
      );
    case "safety_stop":
      return withDefaults(
        "Stopping here. Reset first, then we'll decide the next move.",
        intent.priority ?? "safety",
        clipForIntent(context, "safety_stop")
      );
    case "difficulty_change":
      return withDefaults(
        intent.direction === "easy"
          ? "Good call. Let's nudge the challenge up."
          : "Good adjustment. Let's clean it up and keep moving.",
        intent.priority ?? "transition",
        clipForIntent(
          context,
          intent.direction === "easy" ? "difficulty_easier" : "difficulty_harder"
        )
      );
    case "rep_milestone": {
      let text: string | null = null;
      if (intent.talkativeness === "hype") {
        text = HYPE_PHRASES[intent.repCount] ?? null;
      } else if (intent.talkativeness === "normal") {
        text = NORMAL_PHRASES[intent.repCount] ?? null;
      } else {
        text = QUIET_REP_MILESTONES.has(intent.repCount)
          ? `${intent.repCount}. Keep it smooth.`
          : null;
      }
      if (!text) return null;
      const clipKey =
        intent.repCount === 5
          ? "rep_milestone_5"
          : intent.repCount === 10
            ? "rep_milestone_10"
            : null;
      return withDefaults(
        text,
        intent.priority ?? "encouragement",
        clipForIntent(context, clipKey)
      );
    }
    case "form_correction": {
      const cueMap =
        intent.talkativeness === "quiet"
          ? FORM_CUE_QUIET
          : intent.talkativeness === "hype"
            ? FORM_CUE_HYPE
            : FORM_CUE_NORMAL;
      const text = cueMap[intent.label];
      if (!text) return null;
      const clipKey =
        intent.label === "clean"
          ? "form_clean"
          : intent.label === "shallow"
            ? "form_shallow"
            : "form_unstable";
      return withDefaults(
        text,
        intent.priority ?? (intent.label === "clean" ? "encouragement" : "form_correction"),
        clipForIntent(context, clipKey)
      );
    }
    default:
      return null;
  }
}
