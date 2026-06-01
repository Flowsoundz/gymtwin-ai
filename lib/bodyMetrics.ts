import type { BodyProfile } from "@/types";

export function calculateBMI(heightInches?: number, weightLbs?: number): number | null {
  if (!heightInches || !weightLbs || heightInches <= 0 || weightLbs <= 0) {
    return null;
  }

  const bmi = (weightLbs / (heightInches * heightInches)) * 703;
  return Number(bmi.toFixed(1));
}

export function getBMICategory(bmi: number | null): string {
  if (bmi === null || Number.isNaN(bmi)) return "Unavailable";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight";
  return "Obesity range";
}

export function getBodyProfileSummary(profile: BodyProfile): string {
  const { weightLbs, goalWeightLbs, activityGoal } = profile;

  if (!weightLbs && !goalWeightLbs && !activityGoal) {
    return "Add your manual body metrics to track fitness progress over time.";
  }

  if (weightLbs && goalWeightLbs) {
    const delta = Number((goalWeightLbs - weightLbs).toFixed(1));
    if (delta === 0) {
      return "You’re at your current goal weight. Keep training consistently.";
    }

    if (delta < 0) {
      return `You’re ${Math.abs(delta)} lb from your goal weight. Focus on consistency and recovery.`;
    }

    return `You’re ${delta} lb above your current weight target. Build gradually and keep form clean.`;
  }

  if (activityGoal) {
    return `Current activity goal: ${activityGoal}. Keep your workouts aligned with that target.`;
  }

  if (weightLbs) {
    return "Current weight is saved. Add a goal weight to track progress more clearly.";
  }

  return "Body profile saved. Keep updating your metrics as your training evolves.";
}
