import { coachDialogue } from "@/data/fitnessLibrary";
import type { CoachName } from "@/types";

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getCoachQuote(
  coach: CoachName,
  phase: "intro" | "action" | "recovery" | "outro"
): string {
  return getRandomItem(coachDialogue[coach][phase]);
}
