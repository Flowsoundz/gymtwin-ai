"use client";

export type ConversationIntent =
  | "motivate_me"
  | "how_was_my_form"
  | "what_should_i_fix"
  | "make_it_easier"
  | "make_it_harder"
  | "repeat_that"
  | "start_camera"
  | "stop_camera"
  | "unknown";

export type ConversationResponseInput = {
  intent: ConversationIntent;
  selectedAvatarName: string;
  latestIssue?: string | null;
  bestCue?: string;
  cleanRepCount?: number;
  needsWorkRepCount?: number;
  trackingConfidence?: number;
  placementMessage?: string;
  coachBrainMessage?: string;
};

export type ConversationResponse = {
  intent: ConversationIntent;
  answer: string;
};

function normalizeTranscript(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(transcript: string, phrases: string[]) {
  return phrases.some((phrase) => transcript.includes(phrase));
}

export function parseConversationIntent(rawTranscript: string): ConversationIntent {
  const transcript = normalizeTranscript(rawTranscript);

  if (!transcript) return "unknown";
  if (includesAny(transcript, ["motivate me", "give me motivation", "pump me up"])) return "motivate_me";
  if (includesAny(transcript, ["how was my form", "how is my form", "was my form good"])) return "how_was_my_form";
  if (includesAny(transcript, ["what should i fix", "what do i fix", "what should i improve"])) return "what_should_i_fix";
  if (includesAny(transcript, ["make it easier"])) return "make_it_easier";
  if (includesAny(transcript, ["make it harder"])) return "make_it_harder";
  if (includesAny(transcript, ["repeat that", "say that again", "repeat that again"])) return "repeat_that";
  if (includesAny(transcript, ["start camera", "turn on camera", "camera on"])) return "start_camera";
  if (includesAny(transcript, ["stop camera", "turn off camera", "camera off"])) return "stop_camera";

  return "unknown";
}

export function getConversationResponse(input: ConversationResponseInput): ConversationResponse {
  const coachName = input.selectedAvatarName || "Coach";
  const cleanRepCount = input.cleanRepCount ?? 0;
  const needsWorkRepCount = input.needsWorkRepCount ?? 0;
  const confidence = input.trackingConfidence ?? 0;
  const cue = input.bestCue?.trim() || "Stay tall, move with control, and keep breathing.";
  const placementMessage = input.placementMessage?.trim() || "Set the phone farther back so I can see your full body clearly.";
  const coachBrainMessage = input.coachBrainMessage?.trim() || "I’m ready when you are.";

  switch (input.intent) {
    case "motivate_me":
      return {
        intent: input.intent,
        answer:
          cleanRepCount > needsWorkRepCount
            ? `${coachName} says: you’re stacking strong reps. Stay sharp and finish this set clean.`
            : `${coachName} says: one clean rep at a time. Lock in, stay calm, and own the next rep.`,
      };
    case "how_was_my_form":
      return {
        intent: input.intent,
        answer:
          cleanRepCount === 0 && needsWorkRepCount === 0
            ? `${coachName} needs a few tracked reps first, but your current cue is: ${cue}`
            : `You have ${cleanRepCount} clean rep${cleanRepCount === 1 ? "" : "s"} and ${needsWorkRepCount} rep${needsWorkRepCount === 1 ? "" : "s"} that need work. ${cue}`,
      };
    case "what_should_i_fix":
      return {
        intent: input.intent,
        answer:
          input.latestIssue === "shallow"
            ? "Go a little deeper on the next rep and stay in control."
            : input.latestIssue === "lost_tracking"
              ? `Step back and reset before your next rep. ${placementMessage}`
              : input.latestIssue === "unstable"
                ? "Slow the rep down and own the movement path."
                : cue,
      };
    case "make_it_easier":
      return {
        intent: input.intent,
        answer: "Say “make it easier” again if you want the workout to adjust down. For form, shorten the range and stay controlled.",
      };
    case "make_it_harder":
      return {
        intent: input.intent,
        answer: "Say “make it harder” again if you want the workout to adjust up. Earn it with clean reps first.",
      };
    case "repeat_that":
      return {
        intent: input.intent,
        answer: coachBrainMessage,
      };
    case "start_camera":
      return {
        intent: input.intent,
        answer:
          confidence >= 70
            ? "Camera starting. Hold still and I’ll lock tracking."
            : `Camera starting. ${placementMessage}`,
      };
    case "stop_camera":
      return {
        intent: input.intent,
        answer: "Camera stopping. We can keep going without live tracking.",
      };
    default:
      return {
        intent: "unknown",
        answer: `${coachName} is ready. Try “motivate me”, “how was my form?”, or “what should I fix?”`,
      };
  }
}
