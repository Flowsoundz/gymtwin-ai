import type {
  CoachName,
  Equipment,
  PersonalizedExercise,
  PersonalizedWorkoutPlan,
  WorkoutAdjustments,
  WorkoutGoal,
  WorkoutLevel,
  WorkoutMovement,
} from "@/types";

type GoalCategory = "fat_loss" | "muscle_gain" | "tone" | "mobility";
type EquipmentType = "bodyweight" | "dumbbells" | "bands" | "bench";

interface ExerciseTemplate {
  name: string;
  muscleGroup: string;
  equipment: EquipmentType;
  goals: GoalCategory[];
  levels: WorkoutLevel[];
  phase: "warmup" | "main" | "cooldown";
  baseReps?: number;
  baseDuration?: number;
  baseSets: number;
  baseRest: number;
  coachingCue: string;
  easierOption: string;
  harderOption: string;
}

export function cleanMovementName(name: string) {
  return name.replace(/-instance-\d+$/, "");
}

// ─── Exercise Database ────────────────────────────────────────────────────────

const ALL_GOALS: GoalCategory[] = ["fat_loss", "muscle_gain", "tone", "mobility"];
const ALL_LEVELS: WorkoutLevel[] = ["Beginner", "Intermediate", "Advanced"];
const UPPER_LEVELS: WorkoutLevel[] = ["Intermediate", "Advanced"];

const exerciseTemplates: ExerciseTemplate[] = [
  // ── WARMUP ──────────────────────────────────────────────────────────────────
  { name: "March in Place", muscleGroup: "Full Body", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 40, baseSets: 1, baseRest: 10, coachingCue: "Drive each knee toward hip height. Pump your arms in rhythm. Keep your spine tall.", easierOption: "Slow the pace to a comfortable walk", harderOption: "Add a high kick with each knee drive" },
  { name: "Arm Circle Swings", muscleGroup: "Shoulders & Upper Back", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 30, baseSets: 1, baseRest: 10, coachingCue: "Start with small circles and gradually widen them. Keep your neck relaxed throughout.", easierOption: "Make smaller, gentler circles", harderOption: "Open into full chest circles at the end" },
  { name: "Hip Circle Rotations", muscleGroup: "Hips & Lower Back", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 30, baseSets: 1, baseRest: 10, coachingCue: "Hands on hips. Trace large, slow circles. Go both directions.", easierOption: "Hold a wall for balance", harderOption: "Drop deeper into each rotation" },
  { name: "Standing Cat-Cow", muscleGroup: "Spine & Core", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 40, baseSets: 1, baseRest: 10, coachingCue: "Hinge slightly forward. Round your spine toward the ceiling, then arch it gently. Smooth, continuous flow.", easierOption: "Reduce the range of each arch and round", harderOption: "Add a full spinal segmentation and chin drop" },
  { name: "Lateral Leg Swings", muscleGroup: "Hip Flexors & Glutes", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 35, baseSets: 1, baseRest: 10, coachingCue: "Hold a wall for support. Swing each leg forward and back with control — let the hip relax.", easierOption: "Shorten the swing arc", harderOption: "Add a brief pause at the top of each swing" },
  { name: "Torso Twists", muscleGroup: "Spine & Obliques", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 35, baseSets: 1, baseRest: 10, coachingCue: "Feet shoulder-width. Arms extended. Rotate from the thoracic spine — keep hips stable.", easierOption: "Arms bent across chest to reduce lever", harderOption: "Extend arms fully and pause at each end" },
  { name: "Light Seal Jacks", muscleGroup: "Full Body", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 40, baseSets: 1, baseRest: 10, coachingCue: "Step out laterally while opening your arms wide to chest height. Controlled rhythm.", easierOption: "Step one foot at a time instead of both together", harderOption: "Convert to full jumping jacks" },
  { name: "Knee Raise March", muscleGroup: "Hip Flexors & Core", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "warmup", baseDuration: 40, baseSets: 1, baseRest: 10, coachingCue: "Drive each knee toward your chest. Brace your core. Stay tall through your spine.", easierOption: "Reduce knee height to a comfortable level", harderOption: "Add a calf raise on the standing leg each time" },

  // ── MAIN · BODYWEIGHT CONDITIONING (fat_loss, tone) ────────────────────────
  { name: "Jumping Jacks", muscleGroup: "Full Body & Cardio", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 20, baseSets: 3, baseRest: 30, coachingCue: "Full extension overhead, feet wide apart. Land softly. Maintain a steady cadence.", easierOption: "Step one foot out at a time instead of jumping", harderOption: "Add a squat at the bottom of each jack" },
  { name: "Mountain Climbers", muscleGroup: "Core & Shoulders", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 16, baseSets: 3, baseRest: 30, coachingCue: "Flat back, wrists under shoulders. Drive knees in without rotating your hips.", easierOption: "Slow the pace to a controlled step-through", harderOption: "Add a cross-body drive bringing knee toward opposite elbow" },
  { name: "Alternating Reverse Lunges", muscleGroup: "Legs & Glutes", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 14, baseSets: 3, baseRest: 35, coachingCue: "Step straight back and drop your back knee close to the floor. Keep your front shin vertical.", easierOption: "Reduce lunge depth and hold a wall for balance", harderOption: "Add a forward knee drive at the top of each rep" },
  { name: "High Knees", muscleGroup: "Legs & Cardio", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 20, baseSets: 3, baseRest: 25, coachingCue: "Drive knees up past hip height in a fast run. Keep your arms pumping and stay on your toes.", easierOption: "March at a brisk pace instead", harderOption: "Sprint in place, making the movement as explosive as possible" },
  { name: "Flutter Kicks", muscleGroup: "Core & Hip Flexors", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 20, baseSets: 3, baseRest: 25, coachingCue: "Lower back pressed flat into the floor. Legs low and alternating in a scissor motion. Breathe steadily.", easierOption: "Raise legs higher to reduce lower back load", harderOption: "Lower legs closer to the floor on each kick" },
  { name: "Shadow Boxing", muscleGroup: "Arms & Cardio", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 30, baseSets: 3, baseRest: 25, coachingCue: "Light stance. Throw controlled jab-cross combinations. Exhale sharply on each punch. Stay moving.", easierOption: "Slow the pace and focus on arm extension form", harderOption: "Add footwork and duck-under combinations between punches" },
  { name: "Squat Jumps", muscleGroup: "Legs, Glutes & Cardio", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 40, coachingCue: "Squat to parallel, drive explosively upward, land softly with bent knees. Control the descent.", easierOption: "Remove the jump — perform a slow tempo squat instead", harderOption: "Hold the squat position for 1 second before each jump" },
  { name: "Burpee Step-Outs", muscleGroup: "Full Body & Cardio", equipment: "bodyweight", goals: ["fat_loss"], levels: UPPER_LEVELS, phase: "main", baseReps: 8, baseSets: 3, baseRest: 45, coachingCue: "Step your feet out to a plank one at a time. Drive through your chest. Step back in. Stand tall.", easierOption: "Skip the push-up and simply stand up at the end", harderOption: "Add a full push-up at the bottom of each rep" },
  { name: "Lateral Shuffles", muscleGroup: "Legs & Agility", equipment: "bodyweight", goals: ["fat_loss"], levels: ALL_LEVELS, phase: "main", baseReps: 20, baseSets: 3, baseRest: 30, coachingCue: "Hips low, push off one foot and travel side-to-side. Stay low. Quick feet.", easierOption: "Slow shuffle pace and remove the low hip position", harderOption: "Touch the floor with your hand each time you change direction" },
  { name: "Push-Up to Plank Hold", muscleGroup: "Chest, Core & Shoulders", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 40, coachingCue: "Perform a push-up, then hold the top plank for 2 seconds before the next rep. Rigid spine throughout.", easierOption: "Use knee push-ups and shorten the hold", harderOption: "Add a 5-second plank hold after each push-up" },

  // ── MAIN · BODYWEIGHT STRENGTH (muscle_gain, tone) ──────────────────────────
  { name: "Push-Ups", muscleGroup: "Chest & Triceps", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 60, coachingCue: "Elbows at 45° from your torso. One rigid line from shoulders to heels. Full range of motion each rep.", easierOption: "Perform from your knees with the same form", harderOption: "Slow the lowering phase to 3 seconds" },
  { name: "Diamond Push-Ups", muscleGroup: "Triceps & Chest", equipment: "bodyweight", goals: ["muscle_gain"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 60, coachingCue: "Hands form a diamond shape under your sternum. Keep elbows tucking back along your ribs.", easierOption: "Widen hand placement slightly and reduce depth", harderOption: "Elevate your feet on a chair" },
  { name: "Pike Push-Ups", muscleGroup: "Shoulders & Upper Chest", equipment: "bodyweight", goals: ["muscle_gain"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 60, coachingCue: "Hips high in an inverted V. Lower your head toward the floor between your hands, then press up.", easierOption: "Reduce the hip height to a standard incline push-up", harderOption: "Elevate your feet to increase the angle" },
  { name: "Bodyweight Squats", muscleGroup: "Quads & Glutes", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 60, coachingCue: "Feet shoulder-width. Push hips back and down. Keep heels flat. Chest up. Drive through your heels.", easierOption: "Squat to a chair seat and stand back up", harderOption: "Pause for 3 seconds at the bottom of each rep" },
  { name: "Glute Bridges", muscleGroup: "Glutes & Hamstrings", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 45, coachingCue: "Feet flat, hip-width. Press through your heels, drive hips up. Squeeze glutes hard at the top.", easierOption: "Reduce rep range and hold the top for 1 second", harderOption: "Elevate your feet on a chair for a full hip extension stretch" },
  { name: "Single-Leg Glute Bridge", muscleGroup: "Glutes & Core", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 45, coachingCue: "One leg extended, other foot flat. Press through the grounded heel. Keep your hips level.", easierOption: "Return to both feet if hips rotate or wobble", harderOption: "Add a 2-second hold at the top of each rep" },
  { name: "Reverse Lunge with Hold", muscleGroup: "Quads, Glutes & Balance", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 60, coachingCue: "Step back, drop knee near the floor, pause 1 second. Push through your front heel to return.", easierOption: "Skip the hold and use wall support", harderOption: "Hold dumbbells or add a forward torso lean" },
  { name: "Plank Shoulder Taps", muscleGroup: "Core & Shoulders", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 45, coachingCue: "High plank position. Tap opposite shoulder while resisting any rotation. Slow and stable wins.", easierOption: "Widen your foot stance to increase stability", harderOption: "Add a 1-second pause with the arm extended" },
  { name: "Chair Tricep Dips", muscleGroup: "Triceps & Chest", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 60, coachingCue: "Hands gripping the chair edge behind you, legs extended. Lower until elbows reach 90°, press up.", easierOption: "Bend your knees to reduce bodyweight load", harderOption: "Elevate your feet on another surface" },
  { name: "Wall Sit Hold", muscleGroup: "Quads & Glutes", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseDuration: 30, baseSets: 3, baseRest: 60, coachingCue: "Back flat against wall, thighs parallel to the floor. Press your lower back into the wall throughout.", easierOption: "Raise your hips slightly above parallel", harderOption: "Extend your arms forward or hold weight on your thighs" },

  // ── MAIN · DUMBBELL CONDITIONING (fat_loss, tone) ───────────────────────────
  { name: "Dumbbell Thrusters", muscleGroup: "Full Body", equipment: "dumbbells", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 45, coachingCue: "Squat with dumbbells at shoulders. Drive up explosively and press them overhead. One fluid movement.", easierOption: "Separate into a squat and then a press", harderOption: "Add a pause at the bottom of each squat" },
  { name: "Dumbbell Swings", muscleGroup: "Posterior Chain & Cardio", equipment: "dumbbells", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 40, coachingCue: "Hinge at the hips. Drive the dumbbell forward with a powerful hip snap. Control the descent.", easierOption: "Use a lighter weight and reduce swing height to chest", harderOption: "Increase weight or add a pause at the top" },
  { name: "Renegade Rows", muscleGroup: "Back, Core & Shoulders", equipment: "dumbbells", goals: ["fat_loss", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 8, baseSets: 3, baseRest: 50, coachingCue: "High plank on dumbbells. Row one dumbbell toward your hip while bracing against rotation.", easierOption: "Widen feet and remove the alternating row — just hold plank", harderOption: "Add a push-up between each row" },
  { name: "Dumbbell High Pulls", muscleGroup: "Back & Shoulders", equipment: "dumbbells", goals: ["fat_loss"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 40, coachingCue: "Hinge forward, pull dumbbells up to shoulder height with elbows flaring out. Controlled return.", easierOption: "Use lighter weight and reduce height to waist level", harderOption: "Add a slight explosive hip drive at the top" },

  // ── MAIN · DUMBBELL STRENGTH (muscle_gain, tone) ────────────────────────────
  { name: "Dumbbell Floor Press", muscleGroup: "Chest & Triceps", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 75, coachingCue: "Lie flat, knees bent. Press dumbbells symmetrically above your chest. Lower to elbows touching floor.", easierOption: "Use lighter weight and a smaller range of motion", harderOption: "Pause for 2 seconds with elbows on the floor before each press" },
  { name: "Dumbbell Romanian Deadlift", muscleGroup: "Hamstrings & Glutes", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 75, coachingCue: "Hinge at the hips with a flat back. Lower dumbbells along your shins until a hamstring stretch. Drive hips forward to return.", easierOption: "Keep a slight knee bend and reduce lowering depth", harderOption: "Perform single-leg with opposite leg elevated slightly behind" },
  { name: "Dumbbell Bent-Over Row", muscleGroup: "Back & Biceps", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 75, coachingCue: "Hinge to 45°, flat back. Draw dumbbells to lower ribs. Squeeze shoulder blades. Controlled descent.", easierOption: "Use a support arm on a chair and row one arm at a time", harderOption: "Add a 2-second hold at the top of each rep" },
  { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders & Triceps", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 75, coachingCue: "Seated or standing. Dumbbells at ear height. Press straight up and slightly inward. Don't lock out your elbows.", easierOption: "Use lighter weight or alternate arms", harderOption: "Slow the lowering phase to 3 seconds" },
  { name: "Dumbbell Goblet Squat", muscleGroup: "Quads, Glutes & Core", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 60, coachingCue: "Hold dumbbell vertically at chest. Squat deep, elbows inside knees. Keep the chest tall throughout.", easierOption: "Squat to chair height and use lighter weight", harderOption: "Add a 3-second pause at the bottom" },
  { name: "Dumbbell Bicep Curl", muscleGroup: "Biceps & Forearms", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 60, coachingCue: "Elbows pinned to your sides. Curl with full range. Squeeze at the top. Slow on the way down.", easierOption: "Alternate arms or use lighter weight", harderOption: "Slow the lowering phase to 3 seconds (eccentric focus)" },
  { name: "Dumbbell Tricep Overhead Extension", muscleGroup: "Triceps", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 60, coachingCue: "Hold one dumbbell overhead with both hands. Lower it behind your head by bending elbows. Keep upper arms still.", easierOption: "Use a lighter weight or do lying skull crushers instead", harderOption: "Perform one arm at a time for greater range" },
  { name: "Dumbbell Lateral Raise", muscleGroup: "Side Delts", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 60, coachingCue: "Slight elbow bend. Raise arms to shoulder height only. Lead with your elbows, not your wrists. Slow descent.", easierOption: "Alternate arms or use very light weight", harderOption: "Add a 2-second pause at the top of each raise" },
  { name: "Dumbbell Walking Lunges", muscleGroup: "Quads, Glutes & Balance", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 75, coachingCue: "Step forward into each lunge. Keep your front shin vertical. Drive through the heel to bring feet together.", easierOption: "Do stationary lunges without walking", harderOption: "Add a brief pause at the bottom of each step" },
  { name: "Dumbbell Chest Fly", muscleGroup: "Chest & Front Delts", equipment: "dumbbells", goals: ["muscle_gain"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 75, coachingCue: "Lie on floor, slight bend in elbows. Open arms wide until a chest stretch. Squeeze back to center.", easierOption: "Use a smaller arc and lighter weight", harderOption: "Add a 2-second hold at the stretched position" },

  // ── MAIN · BAND CONDITIONING (fat_loss, tone) ───────────────────────────────
  { name: "Banded Lateral Walks", muscleGroup: "Glutes & Hips", equipment: "bands", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 35, coachingCue: "Band above knees. Hips slightly bent. Step side-to-side maintaining band tension. Never let knees cave in.", easierOption: "Use a lighter resistance band", harderOption: "Add a squat between each lateral step" },
  { name: "Banded Jumping Jacks", muscleGroup: "Full Body & Cardio", equipment: "bands", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 20, baseSets: 3, baseRest: 30, coachingCue: "Band around wrists. Keep arms at shoulder height against resistance. Full extension on each jack.", easierOption: "Step instead of jump and reduce arm extension", harderOption: "Hold peak position for a count before returning" },
  { name: "Banded Good Mornings", muscleGroup: "Hamstrings & Lower Back", equipment: "bands", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 35, coachingCue: "Band under feet and across shoulders. Hinge at hips with a flat back. Feel the hamstring stretch. Drive hips forward.", easierOption: "Use lighter band tension and reduce hip hinge depth", harderOption: "Add a slow 3-second lowering phase" },

  // ── MAIN · BAND STRENGTH (muscle_gain, tone) ────────────────────────────────
  { name: "Banded Push-Ups", muscleGroup: "Chest & Triceps", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 60, coachingCue: "Band across your upper back, gripped in each hand. The band adds resistance at the top. Full push-up form.", easierOption: "Use a lighter band or remove it for bodyweight push-ups", harderOption: "Slow the full rep to a 3-second down, 2-second up tempo" },
  { name: "Banded Squats", muscleGroup: "Quads, Glutes & Hips", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 55, coachingCue: "Band above knees. Push knees outward against the band throughout. Squat deep with chest up.", easierOption: "Use a lighter band and squat to chair height", harderOption: "Add a 3-second pause at the bottom" },
  { name: "Banded Face Pulls", muscleGroup: "Rear Delts & Upper Back", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 45, coachingCue: "Loop band at face height. Pull handles toward ears with elbows high and flaring out. Squeeze your rear delts.", easierOption: "Use lighter resistance and reduce elbow flare", harderOption: "Add a 2-second hold at peak contraction" },
  { name: "Banded Bicep Curls", muscleGroup: "Biceps & Forearms", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 50, coachingCue: "Stand on the band. Curl with elbows pinned to your sides. Squeeze at the top. Slow return.", easierOption: "Use a lighter band or alternate arms", harderOption: "Slow the lowering phase to 3 seconds" },
  { name: "Banded Tricep Pushdowns", muscleGroup: "Triceps", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 50, coachingCue: "Band anchored overhead. Elbows at your sides, pinned. Push hands straight down to full extension. Control the return.", easierOption: "Use a lighter band or a shorter range of motion", harderOption: "Add a 2-second hold at the bottom" },
  { name: "Banded Hip Thrusts", muscleGroup: "Glutes & Hamstrings", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 45, coachingCue: "Band across your hips. Upper back on a surface or floor. Drive hips up powerfully. Squeeze glutes at top.", easierOption: "Perform without band or keep feet closer to hips", harderOption: "Pause 3 seconds at the top of each thrust" },
  { name: "Banded Pallof Press", muscleGroup: "Core & Anti-Rotation", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 45, coachingCue: "Band anchored to the side. Hold at sternum. Press straight out and hold, resist any rotation. Pull back in.", easierOption: "Stand closer to anchor to reduce tension", harderOption: "Step farther from anchor or add a pause extended" },

  // ── MAIN · BENCH CONDITIONING (fat_loss, tone) ──────────────────────────────
  { name: "Bench Step-Up Knee Drives", muscleGroup: "Legs, Glutes & Cardio", equipment: "bench", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 35, coachingCue: "Step fully onto the bench. Drive the trailing knee up at the top. Control the descent.", easierOption: "Use a lower step and skip the knee drive", harderOption: "Add a hop off the bench for plyometric impact" },

  // ── MAIN · BENCH STRENGTH (muscle_gain, tone) ───────────────────────────────
  { name: "Bench Dips", muscleGroup: "Triceps & Chest", equipment: "bench", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 60, coachingCue: "Hands gripping the bench behind you, legs straight. Lower until elbows reach 90°, press back up. Keep hips close to the bench.", easierOption: "Bend your knees to reduce the load", harderOption: "Elevate your feet on another surface" },
  { name: "Incline Push-Ups", muscleGroup: "Lower Chest & Triceps", equipment: "bench", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 55, coachingCue: "Hands on bench edge, body in a straight diagonal line. Lower chest toward bench with controlled descent.", easierOption: "Raise the incline height to reduce difficulty", harderOption: "Add a 2-second hold at the chest-to-bench position" },
  { name: "Decline Push-Ups", muscleGroup: "Upper Chest & Shoulders", equipment: "bench", goals: ["muscle_gain", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 60, coachingCue: "Feet on bench, hands on floor. Keep your body rigid. Lower chest to floor with full control.", easierOption: "Reduce foot elevation or switch to standard push-ups", harderOption: "Add a clap push-up for plyometric intensity" },
  { name: "Bulgarian Split Squats", muscleGroup: "Quads, Glutes & Balance", equipment: "bench", goals: ["muscle_gain"], levels: UPPER_LEVELS, phase: "main", baseReps: 8, baseSets: 3, baseRest: 75, coachingCue: "Back foot resting lightly on bench. Lower your hips vertically. Keep front shin as vertical as possible.", easierOption: "Reduce depth or use a lower foot elevation", harderOption: "Hold dumbbells for added resistance" },
  { name: "Step-Ups with Pause", muscleGroup: "Quads & Glutes", equipment: "bench", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 55, coachingCue: "Step fully onto the bench, stand tall. Pause 1 second at top. Lower with control. Alternate legs.", easierOption: "Use a lower bench and skip the pause", harderOption: "Add dumbbells or increase bench height" },

  // ── MAIN · MOBILITY ─────────────────────────────────────────────────────────
  { name: "90/90 Hip Rotation", muscleGroup: "Hips & Glutes", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 45, baseSets: 2, baseRest: 20, coachingCue: "Both legs at 90° angles in front and behind. Rotate between sides with control. Sit tall, no hands if able.", easierOption: "Use both hands on the floor for support throughout", harderOption: "Lift the front shin off the floor at the peak of each rotation" },
  { name: "World's Greatest Stretch", muscleGroup: "Hip Flexors, Hips & Thoracic Spine", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 40, baseSets: 2, baseRest: 20, coachingCue: "Step into a long lunge. Hand inside the front foot. Open your chest by rotating and reaching up. Smooth and slow.", easierOption: "Keep both hands on the floor and just hold the lunge", harderOption: "Add a hip drop and thoracic extension at the peak" },
  { name: "Kneeling Hip Flexor Stretch", muscleGroup: "Hip Flexors & Quads", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 45, baseSets: 2, baseRest: 15, coachingCue: "Half-kneeling. Tuck your pelvis slightly forward. Shift weight forward until a stretch in the front hip. Don't arch your lower back.", easierOption: "Place a folded towel under your knee for padding", harderOption: "Raise the same-side arm overhead to deepen the stretch" },
  { name: "Seated Forward Fold", muscleGroup: "Hamstrings & Lower Back", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 45, baseSets: 2, baseRest: 15, coachingCue: "Legs extended. Fold from the hips, not the spine. Reach toward your toes. Breathe into the stretch on each exhale.", easierOption: "Bend your knees slightly to relieve tension", harderOption: "Flex your feet and dorsiflex to add calf stretch" },
  { name: "Thread the Needle", muscleGroup: "Thoracic Spine & Shoulders", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 40, baseSets: 2, baseRest: 15, coachingCue: "On hands and knees. Slide one arm under your body, rotating your chest toward the floor. Feel the thoracic opening.", easierOption: "Reduce the range of rotation", harderOption: "Press your bottom shoulder firmly into the floor and hold longer" },
  { name: "Pigeon Pose Hold", muscleGroup: "Glutes & Hip External Rotators", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 50, baseSets: 2, baseRest: 20, coachingCue: "Front shin crosses your body, back leg extended behind. Sink your hips evenly toward the floor. Breathe deeply.", easierOption: "Use a folded blanket under your hip for support", harderOption: "Fold your torso forward over your front shin" },
  { name: "Spinal Rotation Stretch", muscleGroup: "Spine & Obliques", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 40, baseSets: 2, baseRest: 15, coachingCue: "Seated. One leg extended, other foot crossed over. Twist toward the bent knee using your elbow as a lever. Breathe into the rotation.", easierOption: "Reduce the twist range and support with both hands behind you", harderOption: "Extend the top arm overhead as you rotate" },
  { name: "Child's Pose with Lateral Reach", muscleGroup: "Lats & Spine", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 45, baseSets: 2, baseRest: 15, coachingCue: "Knees wide, arms reaching long. Walk your hands to one side to feel a lateral stretch. Switch sides.", easierOption: "Keep knees close together for a simpler fold", harderOption: "Press your hips back further to deepen the side stretch" },
  { name: "Cat-Cow Flow", muscleGroup: "Spine & Core", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 45, baseSets: 2, baseRest: 15, coachingCue: "On hands and knees. Inhale, arch your back and look up. Exhale, round your spine and tuck your chin. Fluid motion.", easierOption: "Reduce the range of each spinal movement", harderOption: "Add a full neck rotation at each extreme position" },
  { name: "Deep Squat Hold", muscleGroup: "Hips, Ankles & Thoracic Spine", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 45, baseSets: 2, baseRest: 20, coachingCue: "Feet slightly turned out. Sink into a deep squat. Elbows press knees outward. Spine tall. Breathe from the belly.", easierOption: "Hold onto a door frame or squat rack for support", harderOption: "Release the support and try to balance fully in the squat" },
  { name: "Standing Hip Hinge Drill", muscleGroup: "Hamstrings & Lower Back", equipment: "bodyweight", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 40, baseSets: 2, baseRest: 15, coachingCue: "Feet hip-width. Push your hips back slowly, keeping a flat back. Feel the hamstring load. Drive hips forward to return.", easierOption: "Bend knees more if hamstrings are very tight", harderOption: "Add a pause at the bottom and reach arms forward" },
  { name: "Banded Overhead Lat Stretch", muscleGroup: "Lats & Shoulders", equipment: "bands", goals: ["mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 45, baseSets: 2, baseRest: 15, coachingCue: "Anchor band at floor level. Hold overhead and lean away from the anchor. Feel the lat stretch.", easierOption: "Use a lighter band and reduce the lean angle", harderOption: "Rotate your torso away from the band at the stretch peak" },

  // ── COOLDOWN ────────────────────────────────────────────────────────────────
  { name: "Child's Pose Hold", muscleGroup: "Spine, Hips & Lats", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 60, baseSets: 1, baseRest: 0, coachingCue: "Sink your glutes toward your heels. Arms extended. Forehead toward the floor. Inhale 4 counts, exhale 6 counts.", easierOption: "Place a pillow under your glutes for support", harderOption: "Walk arms further forward to deepen the lat stretch" },
  { name: "Seated Hamstring Stretch", muscleGroup: "Hamstrings & Lower Back", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 45, baseSets: 1, baseRest: 0, coachingCue: "Leg extended, fold from the hip. Each exhale, melt a little deeper. Don't force or bounce.", easierOption: "Bend the knee until the stretch becomes manageable", harderOption: "Flex your foot back to add a calf component" },
  { name: "Standing Quad Stretch", muscleGroup: "Quads & Hip Flexors", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 30, baseSets: 1, baseRest: 0, coachingCue: "Hold your ankle behind you. Stand tall. Gently press the hip forward. Hold a wall if needed.", easierOption: "Hold a wall and allow a small hip hike", harderOption: "Close your eyes for the balance challenge" },
  { name: "Kneeling Hip Flexor Release", muscleGroup: "Hip Flexors & Quads", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 45, baseSets: 1, baseRest: 0, coachingCue: "Half-kneeling. Tuck your pelvis subtly forward. Breathe into the front of your hip. Let gravity do the work.", easierOption: "Use a soft mat under your knee", harderOption: "Raise your same-side arm to deepen the stretch" },
  { name: "Cross-Body Shoulder Stretch", muscleGroup: "Posterior Deltoid & Upper Back", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 30, baseSets: 1, baseRest: 0, coachingCue: "Draw one arm across your chest. Gently apply pressure with the other arm. Keep your shoulder down.", easierOption: "Reduce the pressure and just let the arm rest across the chest", harderOption: "Add a slight torso rotation away from the stretched arm" },
  { name: "Supine Spinal Twist", muscleGroup: "Spine, Glutes & IT Band", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 45, baseSets: 1, baseRest: 0, coachingCue: "On your back. Draw one knee across your body. Arms wide. Both shoulders stay flat on the floor.", easierOption: "Keep the top knee bent and reduce the rotation", harderOption: "Extend the top leg straight to increase the IT band stretch" },
  { name: "Figure-4 Glute Stretch", muscleGroup: "Glutes & Hip Rotators", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 45, baseSets: 1, baseRest: 0, coachingCue: "On your back. Cross one ankle over the opposite thigh. Gently press that knee outward while pulling the thigh in.", easierOption: "Keep the bottom foot flat on the floor", harderOption: "Flex the top ankle and press the knee more actively outward" },
  { name: "Deep Breathing Rest", muscleGroup: "Full Body Recovery", equipment: "bodyweight", goals: ALL_GOALS, levels: ALL_LEVELS, phase: "cooldown", baseDuration: 60, baseSets: 1, baseRest: 0, coachingCue: "Lie on your back. Eyes closed. Breathe in through the nose for 4, hold 2, out through the mouth for 6. Repeat.", easierOption: "Reduce the hold and breathe naturally if dizziness occurs", harderOption: "Add a full body scan from feet to head on each breath cycle" },

  // ── Library expansion (2026-06-12): +32 movements ──
  { name: "Sumo Squats", muscleGroup: "Glutes & Inner Thighs", equipment: "bodyweight", goals: ["fat_loss", "muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 14, baseSets: 3, baseRest: 40, coachingCue: "Wide stance, toes angled out. Knees track over toes as you sit between your hips.", easierOption: "Reduce depth to a comfortable range", harderOption: "Add a three-second pause at the bottom" },
  { name: "Curtsy Lunges", muscleGroup: "Glutes & Quads", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 45, coachingCue: "Step one leg diagonally behind the other. Keep your hips facing forward the entire rep.", easierOption: "Hold a wall for balance", harderOption: "Add a knee drive as you stand" },
  { name: "Lateral Lunges", muscleGroup: "Inner Thighs & Glutes", equipment: "bodyweight", goals: ["fat_loss", "tone", "mobility"], levels: ["Beginner", "Intermediate"], phase: "main", baseReps: 10, baseSets: 2, baseRest: 40, coachingCue: "Step wide and sit into one hip while the other leg stays long and straight.", easierOption: "Shorten the side step", harderOption: "Touch the floor by your instep each rep" },
  { name: "Calf Raise Pulses", muscleGroup: "Calves", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 18, baseSets: 3, baseRest: 30, coachingCue: "Rise tall onto the balls of your feet, pause one second at the top, lower with control.", easierOption: "Hold a wall for balance", harderOption: "Do them one leg at a time" },
  { name: "Skater Hops", muscleGroup: "Legs & Glutes", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 45, coachingCue: "Bound side to side, landing soft on one leg like a speed skater. Arms swing across.", easierOption: "Step instead of hopping", harderOption: "Touch the floor on each landing" },
  { name: "Reverse Crunches", muscleGroup: "Lower Abs", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ["Beginner", "Intermediate"], phase: "main", baseReps: 12, baseSets: 3, baseRest: 35, coachingCue: "Curl your knees to your chest and peel the tailbone off the floor — no momentum.", easierOption: "Keep feet lightly tapping the floor", harderOption: "Slow the lowering to three seconds" },
  { name: "Bicycle Crunches", muscleGroup: "Core & Obliques", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 16, baseSets: 3, baseRest: 35, coachingCue: "Opposite elbow toward opposite knee with a full torso rotation. Slow beats sloppy.", easierOption: "Keep both feet on the floor and just rotate", harderOption: "Hover both legs the whole set" },
  { name: "Russian Twists", muscleGroup: "Obliques", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 16, baseSets: 3, baseRest: 40, coachingCue: "Lean back to forty-five degrees and rotate your rib cage side to side, not just the arms.", easierOption: "Keep heels on the floor", harderOption: "Hold a dumbbell at your chest" },
  { name: "Side Plank Hold", muscleGroup: "Obliques & Core", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: UPPER_LEVELS, phase: "main", baseDuration: 30, baseSets: 2, baseRest: 35, coachingCue: "Stack feet and shoulders. Lift your hips into one straight line, top arm to the ceiling.", easierOption: "Drop the bottom knee for support", harderOption: "Add a top-leg raise while holding" },
  { name: "Hollow Body Hold", muscleGroup: "Deep Core", equipment: "bodyweight", goals: ["muscle_gain"], levels: ["Advanced"], phase: "main", baseDuration: 25, baseSets: 3, baseRest: 45, coachingCue: "Press your lower back into the floor, then float shoulders and legs, arms by your ears.", easierOption: "Bend the knees toward the chest", harderOption: "Rock gently without losing the shape" },
  { name: "Bird Dog Reaches", muscleGroup: "Core & Lower Back", equipment: "bodyweight", goals: ["tone", "mobility"], levels: ["Beginner"], phase: "main", baseReps: 10, baseSets: 2, baseRest: 30, coachingCue: "From all fours, extend opposite arm and leg until level with your back. Pause, switch.", easierOption: "Lift only the arm or only the leg", harderOption: "Add a crunch connecting elbow to knee" },
  { name: "Dead Bug Extensions", muscleGroup: "Deep Core", equipment: "bodyweight", goals: ["tone", "mobility"], levels: ["Beginner", "Intermediate"], phase: "main", baseReps: 10, baseSets: 3, baseRest: 35, coachingCue: "Lower back glued down while the opposite arm and leg reach long. Slow and deliberate.", easierOption: "Move only the legs", harderOption: "Hold light dumbbells overhead" },
  { name: "Inchworm Walkouts", muscleGroup: "Full Body", equipment: "bodyweight", goals: ["fat_loss", "tone", "mobility"], levels: ["Beginner", "Intermediate"], phase: "main", baseReps: 6, baseSets: 2, baseRest: 40, coachingCue: "Hinge, walk your hands out to a plank, pause, then walk back and stand tall.", easierOption: "Bend your knees generously", harderOption: "Add a push-up at the bottom" },
  { name: "Plank Up-Downs", muscleGroup: "Chest & Core", equipment: "bodyweight", goals: ["fat_loss", "muscle_gain", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 45, coachingCue: "Move from forearm plank to high plank one arm at a time without rocking the hips.", easierOption: "Drop to your knees", harderOption: "Speed up while keeping hips frozen" },
  { name: "Superman Holds", muscleGroup: "Lower Back & Glutes", equipment: "bodyweight", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseDuration: 25, baseSets: 3, baseRest: 35, coachingCue: "Lying face down, lift arms and legs together. Squeeze the glutes, eyes on the floor.", easierOption: "Lift only the chest", harderOption: "Add small arm and leg pulses" },
  { name: "Fast Feet Taps", muscleGroup: "Full Body", equipment: "bodyweight", goals: ["fat_loss"], levels: ALL_LEVELS, phase: "main", baseDuration: 25, baseSets: 3, baseRest: 35, coachingCue: "Quarter-squat stance, sprint-tap your feet as fast as you can. Stay on the balls of your feet.", easierOption: "Slow to a quick march", harderOption: "Drop to the floor every ten taps" },
  { name: "Jump Rope Pattern", muscleGroup: "Full Body", equipment: "bodyweight", goals: ["fat_loss", "tone"], levels: ["Beginner", "Intermediate"], phase: "main", baseDuration: 45, baseSets: 3, baseRest: 40, coachingCue: "Invisible rope: tiny hops, soft ankles, small wrist circles at your sides.", easierOption: "March instead of hopping", harderOption: "Double-bounce sprint pace" },
  { name: "Box Breathing Squat Hold", muscleGroup: "Legs & Focus", equipment: "bodyweight", goals: ["tone", "mobility"], levels: ALL_LEVELS, phase: "main", baseDuration: 30, baseSets: 2, baseRest: 30, coachingCue: "Hold a half squat while box-breathing: four counts in, hold, out, hold.", easierOption: "Raise the squat height", harderOption: "Sink to full depth" },
  { name: "Dumbbell Hammer Curls", muscleGroup: "Biceps & Forearms", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 40, coachingCue: "Neutral grip, thumbs up the whole rep. Pin your elbows to your sides.", easierOption: "Lighter weight, slower tempo", harderOption: "Add a three-second lowering phase" },
  { name: "Dumbbell Front Raises", muscleGroup: "Front Shoulders", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ["Beginner", "Intermediate"], phase: "main", baseReps: 12, baseSets: 3, baseRest: 40, coachingCue: "Lift straight arms to shoulder height only. No swinging, no shrugging.", easierOption: "Alternate one arm at a time", harderOption: "Hold two seconds at the top" },
  { name: "Dumbbell Upright Rows", muscleGroup: "Shoulders & Traps", equipment: "dumbbells", goals: ["muscle_gain"], levels: UPPER_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 45, coachingCue: "Pull the weights up your body line to chest height, elbows leading above the wrists.", easierOption: "Reduce the range to sternum height", harderOption: "Slow the descent to three seconds" },
  { name: "Dumbbell Deadlift to Press", muscleGroup: "Full Body", equipment: "dumbbells", goals: ["fat_loss", "muscle_gain", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 55, coachingCue: "Hinge to lift, stand tall, then press overhead in one smooth chain.", easierOption: "Split it: all deadlifts, then all presses", harderOption: "Add a squat between the lift and press" },
  { name: "Dumbbell Pullover", muscleGroup: "Chest & Lats", equipment: "dumbbells", goals: ["muscle_gain"], levels: UPPER_LEVELS, phase: "main", baseReps: 10, baseSets: 3, baseRest: 50, coachingCue: "Lying down, lower one dumbbell behind your head with soft elbows, then pull it back over your chest.", easierOption: "Reduce the range behind the head", harderOption: "Pause two seconds at full stretch" },
  { name: "Dumbbell Side Bends", muscleGroup: "Obliques", equipment: "dumbbells", goals: ["fat_loss", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 2, baseRest: 35, coachingCue: "Slide the weight down one thigh, then pull yourself upright using the opposite side.", easierOption: "Use bodyweight only", harderOption: "Heavier weight, slower tempo" },
  { name: "Dumbbell Calf Raises", muscleGroup: "Calves", equipment: "dumbbells", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 35, coachingCue: "Weights at your sides, rise to your toes with a controlled pause at the top.", easierOption: "Drop the weights", harderOption: "Do them on a stair edge for range" },
  { name: "Banded Rows", muscleGroup: "Upper Back", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 40, coachingCue: "Loop the band, pull the handles to your belly button squeezing the shoulder blades together.", easierOption: "Step closer to reduce tension", harderOption: "Pause two seconds at full squeeze" },
  { name: "Banded Overhead Press", muscleGroup: "Shoulders", equipment: "bands", goals: ["muscle_gain", "tone"], levels: ["Beginner", "Intermediate"], phase: "main", baseReps: 12, baseSets: 3, baseRest: 40, coachingCue: "Stand on the band and press to lockout, finishing tall with biceps by your ears.", easierOption: "Press one arm at a time", harderOption: "Widen your stance for more tension" },
  { name: "Banded Pull-Aparts", muscleGroup: "Rear Shoulders", equipment: "bands", goals: ["tone", "mobility"], levels: ALL_LEVELS, phase: "main", baseReps: 15, baseSets: 3, baseRest: 30, coachingCue: "Arms at shoulder height, stretch the band across your chest. Control the return.", easierOption: "Use a lighter band", harderOption: "Hold the open position two seconds" },
  { name: "Banded Monster Walks", muscleGroup: "Glutes & Hips", equipment: "bands", goals: ["fat_loss", "tone", "mobility"], levels: ALL_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 35, coachingCue: "Band above the knees, quarter squat, step forward and out like a monster — knees never cave.", easierOption: "Take smaller steps", harderOption: "Lower the band to your ankles" },
  { name: "Banded Woodchoppers", muscleGroup: "Core & Obliques", equipment: "bands", goals: ["fat_loss", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 40, coachingCue: "Anchor low, rotate and pull the band up across your body like swinging an axe in reverse.", easierOption: "Slow the rotation down", harderOption: "Add a step into each chop" },
  { name: "Bench Box Jumps", muscleGroup: "Legs & Power", equipment: "bench", goals: ["fat_loss"], levels: ["Advanced"], phase: "main", baseReps: 8, baseSets: 3, baseRest: 60, coachingCue: "Jump onto the bench landing in a soft quarter squat. Step down every rep — never jump down.", easierOption: "Step up explosively instead of jumping", harderOption: "Add a squat on top of the bench" },
  { name: "Bench Hip Thrusts", muscleGroup: "Glutes", equipment: "bench", goals: ["muscle_gain", "tone"], levels: UPPER_LEVELS, phase: "main", baseReps: 12, baseSets: 3, baseRest: 50, coachingCue: "Upper back on the bench, drive your hips to a full lockout and squeeze for two seconds.", easierOption: "Do glute bridges on the floor", harderOption: "Add a dumbbell across your hips" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function mapGoalToCategory(goal: WorkoutGoal): GoalCategory {
  switch (goal) {
    case "Lose weight": return "fat_loss";
    case "Stamina": return "fat_loss";
    case "Build muscle": return "muscle_gain";
    case "Tone": return "tone";
    case "Mobility": return "mobility";
    default: return "tone";
  }
}

function getEquipmentPool(equipment: Equipment): EquipmentType[] {
  switch (equipment) {
    case "None": return ["bodyweight"];
    case "Dumbbells": return ["bodyweight", "dumbbells"];
    case "Resistance Bands": return ["bodyweight", "bands"];
    case "Bench": return ["bodyweight", "bench"];
    default: return ["bodyweight"];
  }
}

function getExerciseCounts(sessionLengthMinutes: number): { warmupCount: number; mainCount: number; cooldownCount: number } {
  if (sessionLengthMinutes <= 10) return { warmupCount: 1, mainCount: 2, cooldownCount: 1 };
  if (sessionLengthMinutes <= 15) return { warmupCount: 1, mainCount: 3, cooldownCount: 1 };
  if (sessionLengthMinutes <= 20) return { warmupCount: 2, mainCount: 4, cooldownCount: 1 };
  if (sessionLengthMinutes <= 30) return { warmupCount: 2, mainCount: 5, cooldownCount: 2 };
  if (sessionLengthMinutes <= 45) return { warmupCount: 2, mainCount: 6, cooldownCount: 2 };
  return { warmupCount: 2, mainCount: 6, cooldownCount: 2 };
}

function applyModifiers(
  template: ExerciseTemplate,
  level: WorkoutLevel,
  goalCategory: GoalCategory,
  adjustments?: WorkoutAdjustments
): PersonalizedExercise {
  let sets = template.baseSets;
  let reps = template.baseReps;
  let duration = template.baseDuration;
  let rest = template.baseRest;

  // Level modifier: adjust volume and rest
  if (level === "Beginner") {
    sets = Math.max(2, sets - 1);
    if (reps) reps = Math.max(5, Math.round(reps * 0.8));
    if (duration) duration = Math.max(20, Math.round(duration * 0.8));
    rest = Math.round(rest * 1.2);
  } else if (level === "Advanced") {
    sets = sets + 1;
    if (reps) reps = Math.round(reps * 1.2);
    if (duration) duration = Math.round(duration * 1.2);
    rest = Math.max(20, Math.round(rest * 0.85));
  }

  // Goal modifier: adjust rep density and rest periods
  if (reps) {
    if (goalCategory === "fat_loss") {
      reps = Math.round(reps * 1.25);
      rest = Math.max(20, Math.round(rest * 0.75));
    } else if (goalCategory === "muscle_gain") {
      reps = Math.max(4, Math.round(reps * 0.85));
      rest = Math.round(rest * 1.25);
    }
  }

  // Adaptive adjustments from post-workout feedback history
  if (adjustments) {
    sets = Math.max(1, Math.round(sets * adjustments.volumeModifier));
    if (reps) reps = Math.max(3, Math.round(reps * adjustments.repModifier));
    if (duration) duration = Math.max(15, Math.round(duration * adjustments.repModifier));
    rest = Math.max(15, Math.round(rest * adjustments.restModifier));
  }

  const equipLabel =
    template.equipment === "bodyweight" ? "Bodyweight" :
    template.equipment === "dumbbells" ? "Dumbbells" :
    template.equipment === "bands" ? "Resistance Bands" : "Bench";

  return {
    name: template.name,
    sets,
    reps,
    duration,
    rest,
    equipment: equipLabel,
    muscleGroup: template.muscleGroup,
    coachingCue: template.coachingCue,
    easierOption: template.easierOption,
    harderOption: template.harderOption,
  };
}

function selectUnique<T extends { name: string; muscleGroup: string }>(
  pool: T[],
  count: number,
  deprioritized: string[] = []
): T[] {
  const selected: T[] = [];
  const usedGroups = new Set<string>();

  // Put deprioritized groups at the end so they're only picked when nothing else fits
  const preferred = pool.filter(
    (ex) => !deprioritized.some((g) => ex.muscleGroup.toLowerCase().includes(g.toLowerCase()))
  );
  const fallback = pool.filter(
    (ex) => deprioritized.some((g) => ex.muscleGroup.toLowerCase().includes(g.toLowerCase()))
  );
  const ordered = [...preferred, ...fallback];
  const remaining = [...ordered];

  for (let i = 0; i < count; i++) {
    if (remaining.length === 0) break;

    let candidates = remaining.filter((ex) => !usedGroups.has(ex.muscleGroup));
    if (candidates.length === 0) {
      usedGroups.clear();
      candidates = remaining;
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    selected.push(pick);
    usedGroups.add(pick.muscleGroup);
    const idx = remaining.findIndex((ex) => ex.name === pick.name);
    if (idx !== -1) remaining.splice(idx, 1);
  }

  return selected;
}

function getWorkoutTitle(goal: WorkoutGoal, level: WorkoutLevel, equipment: Equipment): string {
  const levelLabel = level === "Beginner" ? "Foundation" : level === "Intermediate" ? "Builder" : "Accelerator";
  const equipLabel = equipment === "None" ? "Bodyweight" : equipment === "Dumbbells" ? "Dumbbell" : equipment === "Resistance Bands" ? "Band" : "Bench";

  switch (goal) {
    case "Lose weight": return `${equipLabel} Conditioning ${levelLabel}`;
    case "Build muscle": return `${equipLabel} Strength ${levelLabel}`;
    case "Stamina": return `${equipLabel} Endurance ${levelLabel}`;
    case "Tone": return `${equipLabel} Sculpt ${levelLabel}`;
    case "Mobility": return `${levelLabel} Mobility & Recovery Flow`;
    default: return `${equipLabel} Full-Body ${levelLabel}`;
  }
}

function getGoalFocus(goal: WorkoutGoal): string {
  switch (goal) {
    case "Lose weight": return "Fat Loss & Conditioning";
    case "Build muscle": return "Strength & Hypertrophy";
    case "Stamina": return "Cardiovascular Endurance";
    case "Tone": return "Muscle Definition & Balance";
    case "Mobility": return "Mobility & Joint Health";
    default: return "General Fitness";
  }
}

function getCoachNote(goal: WorkoutGoal, level: WorkoutLevel, coach: CoachName): string {
  const isIntense = coach === "Intense" || coach === "Motivational" || coach === "High Energy";

  if (goal === "Lose weight" || goal === "Stamina") {
    return isIntense
      ? "This session demands discipline. Keep your rest periods strict — the conditioning only works if you don't cheat the clock. Every rep counts."
      : "Focus on keeping your movement quality consistent even when your heart rate climbs. Short rests are intentional — embrace them.";
  }
  if (goal === "Build muscle") {
    return isIntense
      ? "Every set should be near maximal effort. Controlled lowering, explosive drive. If the last 2 reps aren't hard, you're leaving gains on the table."
      : level === "Beginner"
        ? "Your form is more important than the weight right now. Master the movement patterns first — the strength will follow naturally."
        : "Focus on the muscle you're targeting. Feel each rep from stretch to contraction. Quality over speed.";
  }
  if (goal === "Mobility") {
    return "Move slowly and never force a stretch. The goal is gradual tissue adaptation, not immediate range. Breathe into each position — tension releases on the exhale.";
  }
  return isIntense
    ? "Consistent work beats sporadic intensity. Bring full focus to each movement. Make every rep deliberate."
    : "Enjoy this session. A balanced workout that trains your whole body is a sustainable habit. Stay consistent and results compound over time.";
}

function getProgressionIntent(goal: WorkoutGoal, level: WorkoutLevel): string {
  if (goal === "Lose weight" || goal === "Stamina") {
    return level === "Beginner"
      ? "Next session: try completing the same workout with 5 fewer seconds of rest on each exercise. Endurance is built progressively."
      : "Next session: aim to shorten your rest by 5–10 seconds, or increase the reps by 2 per set. Track which exercises feel harder than last time.";
  }
  if (goal === "Build muscle") {
    return level === "Beginner"
      ? "Next session: once all sets feel manageable, add 1–2 reps per set before increasing resistance. Your nervous system needs repetition before adding load."
      : "Next session: when you complete all sets at the top of the rep range cleanly, increase your resistance by the smallest increment available.";
  }
  if (goal === "Mobility") {
    return "Next session: aim to deepen each position by 5–10% — not by forcing, but by relaxing more completely into the stretch. Consistency over weeks creates lasting change.";
  }
  return level === "Beginner"
    ? "Next session: focus on improving movement quality in 1–2 exercises you found challenging. Incremental improvements compound into significant results."
    : "Next session: add 1 rep per set to your main block exercises, or reduce rest by 5 seconds to increase training density.";
}

function estimateDuration(warmup: PersonalizedExercise[], main: PersonalizedExercise[], cooldown: PersonalizedExercise[]): number {
  const totalSeconds = [...warmup, ...main, ...cooldown].reduce((sum, ex) => {
    const activeTime = ex.duration ?? (ex.reps! * 3);
    return sum + (activeTime * ex.sets) + (ex.rest * ex.sets);
  }, 0);
  return Math.max(1, Math.round(totalSeconds / 60));
}

// ─── Main Generation Function ─────────────────────────────────────────────────

export function generatePersonalizedPlan(
  goal: WorkoutGoal,
  level: WorkoutLevel,
  equipment: Equipment,
  sessionLength: string,
  coach: CoachName,
  adjustments?: WorkoutAdjustments
): PersonalizedWorkoutPlan {
  const goalCategory = mapGoalToCategory(goal);
  const equipPool = getEquipmentPool(equipment);
  const sessionMinutes = Number(sessionLength) || 20;
  const counts = getExerciseCounts(sessionMinutes);

  // ── Warmup selection ──────────────────────────────────────────────────────
  const warmupTemplates = exerciseTemplates.filter(
    (ex) => ex.phase === "warmup" && ex.equipment === "bodyweight"
  );
  const warmupSelected = selectUnique(warmupTemplates, counts.warmupCount);

  // ── Main block selection ──────────────────────────────────────────────────
  let mainTemplates = exerciseTemplates.filter(
    (ex) =>
      ex.phase === "main" &&
      ex.goals.includes(goalCategory) &&
      equipPool.includes(ex.equipment) &&
      ex.levels.includes(level)
  );

  // Exclude muscle groups marked as severely sore
  if (adjustments?.excludedMuscleGroups.length) {
    mainTemplates = mainTemplates.filter(
      (ex) =>
        !adjustments.excludedMuscleGroups.some((g) =>
          ex.muscleGroup.toLowerCase().includes(g.toLowerCase())
        )
    );
  }

  // Fallback: relax the level restriction if pool is too small
  const mainPool =
    mainTemplates.length >= counts.mainCount
      ? mainTemplates
      : exerciseTemplates.filter(
          (ex) =>
            ex.phase === "main" &&
            ex.goals.includes(goalCategory) &&
            equipPool.includes(ex.equipment) &&
            !adjustments?.excludedMuscleGroups.some((g) =>
              ex.muscleGroup.toLowerCase().includes(g.toLowerCase())
            )
        );

  const mainSelected = selectUnique(
    mainPool,
    counts.mainCount,
    adjustments?.deprioritizedGroups ?? []
  );

  // ── Cooldown selection ────────────────────────────────────────────────────
  const cooldownTemplates = exerciseTemplates.filter(
    (ex) => ex.phase === "cooldown" && ex.equipment === "bodyweight"
  );
  const cooldownSelected = selectUnique(cooldownTemplates, counts.cooldownCount);

  // ── Apply modifiers (level + goal + adaptive adjustments) ─────────────────
  const warmup = warmupSelected.map((t) => applyModifiers(t, level, goalCategory));
  const mainBlock = mainSelected.map((t) => applyModifiers(t, level, goalCategory, adjustments));
  const cooldown = cooldownSelected.map((t) => applyModifiers(t, level, goalCategory));

  // Fallback: if no main exercises found, generate safe beginner bodyweight session
  if (mainBlock.length === 0) {
    const fallback = exerciseTemplates.filter(
      (ex) => ex.phase === "main" && ex.equipment === "bodyweight" && ex.goals.includes("tone")
    );
    const fallbackSelected = selectUnique(fallback, 3);
    return {
      title: "Bodyweight Foundation",
      estimatedDuration: sessionMinutes,
      goalFocus: "General Fitness",
      difficulty: "Beginner",
      warmup: warmupSelected.slice(0, 1).map((t) => applyModifiers(t, "Beginner", "tone")),
      mainBlock: fallbackSelected.map((t) => applyModifiers(t, "Beginner", "tone")),
      cooldown: cooldownSelected.slice(0, 1).map((t) => applyModifiers(t, "Beginner", "tone")),
      coachNotes: "We built a safe, full-body bodyweight session for you. Focus on learning the movement patterns — your future workouts will adapt as you provide feedback.",
      progressionIntent: "Complete this session and rate its difficulty. Your next workout will be calibrated to your feedback.",
    };
  }

  // Prepend the adaptive note to coach notes when meaningful adjustments are active
  const baseNote = getCoachNote(goal, level, coach);
  const coachNotes =
    adjustments && adjustments.intensityNote !== "Training load is balanced — no adjustments needed."
      ? `${adjustments.intensityNote} ${baseNote}`
      : baseNote;

  const recoveryTag = adjustments?.isRecoverySession ? " · Recovery" : "";

  return {
    title: getWorkoutTitle(goal, level, equipment) + recoveryTag,
    estimatedDuration: estimateDuration(warmup, mainBlock, cooldown),
    goalFocus: getGoalFocus(goal),
    difficulty: adjustments?.isRecoverySession ? `${level} · Recovery` : level,
    warmup,
    mainBlock,
    cooldown,
    coachNotes,
    progressionIntent: getProgressionIntent(goal, level),
  };
}

// ─── Plan → WorkoutMovement Converter ────────────────────────────────────────

function muscleGroupToCategory(muscleGroup: string): WorkoutMovement["category"] {
  const g = muscleGroup.toLowerCase();
  if (g.includes("legs") || g.includes("quads") || g.includes("glutes") || g.includes("hamstrings")) return "legs";
  if (g.includes("chest") || g.includes("back") || g.includes("shoulders") || g.includes("arms") || g.includes("triceps") || g.includes("biceps") || g.includes("delt")) return "upper body";
  if (g.includes("core") || g.includes("obliques") || g.includes("abs") || g.includes("anti-rotation")) return "core";
  if (g.includes("cardio") || g.includes("full body") || g.includes("agility")) return "cardio";
  if (g.includes("mobility") || g.includes("hips") || g.includes("spine") || g.includes("hip flexors") || g.includes("joint") || g.includes("recovery")) return "mobility";
  return "core";
}

export function planToWorkoutMovements(plan: PersonalizedWorkoutPlan): WorkoutMovement[] {
  const sections: { exercises: PersonalizedExercise[]; phase: WorkoutMovement["phase"] }[] = [
    { exercises: plan.warmup, phase: "warmup" },
    { exercises: plan.mainBlock, phase: "core" },
    { exercises: plan.cooldown, phase: "cooldown" },
  ];

  const movements: WorkoutMovement[] = [];

  sections.forEach(({ exercises, phase }) => {
    exercises.forEach((ex, idx) => {
      const activeSeconds = ex.duration ?? Math.max(20, ex.reps! * 3);
      movements.push({
        id: `personalized-${phase}-${idx}`,
        name: ex.name,
        category: phase === "warmup" ? "warmup" : phase === "cooldown" ? "cooldown" : muscleGroupToCategory(ex.muscleGroup),
        compatibleGoals: [],
        compatibleLevels: [],
        compatibleEquipment: [],
        baseReps: ex.reps ?? 1,
        sets: ex.sets,
        restPeriod: ex.rest,
        activeSeconds,
        formGuide: ex.coachingCue,
        breathingCue: "Breathe steadily and maintain control throughout each rep.",
        phase,
      });
    });
  });

  return movements;
}
