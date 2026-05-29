import { exerciseLibrary } from "@/data/fitnessLibrary";
import type {
  Equipment,
  WorkoutGoal,
  WorkoutLevel,
  WorkoutMovement,
} from "@/types";

export function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function cleanMovementName(name: string) {
  return name.replace(/-instance-\d+$/, "");
}

export function buildRoutine(
  goal: WorkoutGoal,
  level: WorkoutLevel,
  equipment: Equipment,
  lengthMinutes: number
): WorkoutMovement[] {
  const matchingPool = exerciseLibrary.filter(
    (ex) =>
      ex.compatibleGoals.includes(goal) &&
      ex.compatibleLevels.includes(level) &&
      ex.compatibleEquipment.includes(equipment)
  );

  let targetCoreCount = 3;
  if (lengthMinutes <= 10) targetCoreCount = 2;
  if (lengthMinutes === 30) targetCoreCount = 4;
  if (lengthMinutes >= 45) targetCoreCount = 5;

  const finalRoutine: WorkoutMovement[] = [];
  const warmupPool = exerciseLibrary.filter(
    (ex) => ex.category === "warmup" && ex.compatibleEquipment.includes(equipment)
  );
  const fallbackWarmup = exerciseLibrary.find((ex) => ex.id === "w-1")!;
  finalRoutine.push(
    warmupPool.length > 0 ? { ...getRandomItem(warmupPool) } : { ...fallbackWarmup }
  );

  const corePool = [...matchingPool.filter((ex) => ex.phase === "core")];
  const usedCategories = new Set<string>();

  for (let i = 0; i < targetCoreCount; i++) {
    if (corePool.length === 0) break;
    let selectionPool = corePool.filter((ex) => !usedCategories.has(ex.category));
    if (selectionPool.length === 0) {
      usedCategories.clear();
      selectionPool = corePool;
    }
    const selectedExercise = getRandomItem(selectionPool);
    finalRoutine.push({ ...selectedExercise });
    usedCategories.add(selectedExercise.category);

    const removeIndex = corePool.findIndex((ex) => ex.id === selectedExercise.id);
    if (removeIndex !== -1) corePool.splice(removeIndex, 1);
  }

  const cooldownPool = exerciseLibrary.filter(
    (ex) => ex.category === "cooldown" && ex.compatibleEquipment.includes(equipment)
  );
  const fallbackCooldown = exerciseLibrary.find((ex) => ex.id === "cl-1")!;
  finalRoutine.push(
    cooldownPool.length > 0 ? { ...getRandomItem(cooldownPool) } : { ...fallbackCooldown }
  );

  const intensityScaler =
    level === "Advanced" ? 1.3 : level === "Intermediate" ? 1.15 : 1.0;

  return finalRoutine.map((exercise, index) => {
    const adjustedExercise = { ...exercise };
    if (adjustedExercise.phase === "core") {
      adjustedExercise.baseReps = Math.round(adjustedExercise.baseReps * intensityScaler);
      if (targetCoreCount >= 4) {
        adjustedExercise.sets = Math.max(2, adjustedExercise.sets - 1);
      }
    }
    return { ...adjustedExercise, id: `${adjustedExercise.id}-instance-${index}` };
  });
}
