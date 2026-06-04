import type { BodyProfile, MacroTargets } from "@/types";

export function calculateDailyTargets(
  weightLbs: number = 180,
  heightInches: number = 70,
  age: number = 34,
  goal: "lean-muscle" | "fat-loss" = "lean-muscle"
): MacroTargets {
  const weightKg = weightLbs * 0.45359237;
  const heightCm = heightInches * 2.54;
  // Mifflin-St Jeor BMR for men
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  // TDEE at moderate activity (1.55×)
  const tdee = Math.round(bmr * 1.55);
  // Lean Muscle Synthesis: +300 kcal buffer above TDEE; fat-loss: -500 kcal deficit
  const targetCalories = goal === "lean-muscle" ? tdee + 300 : tdee - 500;

  // 40% Protein / 40% Carbs / 20% Fats split (4/4/9 kcal per gram).
  // Protein carries a 1.0 g/lb floor so a fat-loss deficit never starves recovery.
  const proteinFromSplit = (targetCalories * 0.40) / 4;
  const proteinFloor = weightLbs * 1.0;

  return {
    calories: targetCalories,
    protein: Math.round(Math.max(proteinFromSplit, proteinFloor)),
    carbs: Math.round((targetCalories * 0.40) / 4),
    fats: Math.round((targetCalories * 0.20) / 9),
  };
}

export function calculateTargetsFromProfile(
  bodyProfile: BodyProfile | null | undefined
): MacroTargets {
  const weight = bodyProfile?.weightLbs ?? 180;
  const height = bodyProfile?.heightInches ?? 70;
  const age = bodyProfile?.age ?? 34;
  const isLoss = (bodyProfile?.activityGoal ?? "").toLowerCase().includes("fat") ||
                 (bodyProfile?.activityGoal ?? "").toLowerCase().includes("lose");
  return calculateDailyTargets(weight, height, age, isLoss ? "fat-loss" : "lean-muscle");
}

// MET ≈ 7 for moderate-intensity resistance training
export function estimateWorkoutCaloriesBurned(
  actualSessionMinutes: number,
  weightLbs: number = 180
): number {
  const weightKg = weightLbs * 0.45359237;
  return Math.round(7 * weightKg * (actualSessionMinutes / 60));
}
