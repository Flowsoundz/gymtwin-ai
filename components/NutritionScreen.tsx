"use client";

import { useMemo, useState } from "react";
import {
  CONVENIENCE_CARDS,
  PANTRY_CARDS,
  QUICK_RECOVERY_RECIPES,
  buildRecipeAsFoodItem,
  getNutritionRecipesForGoal,
  inferNutritionGoal,
  openNutritionPartner,
  type NutritionRecipe,
} from "@/lib/nutritionExperience";
import { readLast7DaysSummary, readYesterdayNutritionLog } from "@/lib/nutritionStorage";
import type { BodyProfile, FoodItem, MacroTargets } from "@/types";

type NutritionScreenProps = {
  targets: MacroTargets;
  todayFoodLog: FoodItem[];
  caloriesBurnedToday: number;
  activeSessionCalories: number;
  bodyProfile: BodyProfile | null;
  onBack: () => void;
  onOpenFoodCamera: () => void;
  onCopyYesterdayMeals: () => void;
  onRemoveFoodItem: (id: string) => void;
  onLogRecommendedMeal?: (item: FoodItem) => void;
  primaryButton: string;
};

type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

const GOAL_COPY: Record<
  ReturnType<typeof inferNutritionGoal>,
  {
    subtitle: string;
    status: string;
    recommendationTitle: string;
    recommendationSubtitle: string;
    quickRecoverySubtitle: string;
    convenienceSubtitle: string;
    pantrySubtitle: string;
    mealIds: string[];
  }
> = {
  build_muscle: {
    subtitle: "Fuel your goal with protein-forward meals, faster recovery, and repeatable healthy choices.",
    status: "Prioritize protein and recovery meals that support growth and training consistency.",
    recommendationTitle: "Recommended Today",
    recommendationSubtitle: "Meals chosen to support muscle recovery, steady energy, and a strong protein target.",
    quickRecoverySubtitle: "Fast options when you need something now but still want your macros to work for you.",
    convenienceSubtitle: "Use a healthy convenience layer when consistency matters more than prep time.",
    pantrySubtitle: "Keep your core staples ready so high-protein meals stay easy to repeat.",
    mealIds: ["chicken_rice_power_bowl", "salmon_recovery_bowl", "greek_yogurt_power_bowl"],
  },
  fat_loss: {
    subtitle: "Stay aligned with your calorie target using high-satiety, protein-forward meals.",
    status: "Focus on high-protein, high-satiety meals that keep calories under control.",
    recommendationTitle: "Recommended Today",
    recommendationSubtitle: "Meals selected to help you stay full, recover well, and keep calories tighter.",
    quickRecoverySubtitle: "Fast recovery choices that support your training without drifting off-plan.",
    convenienceSubtitle: "Healthy shortcuts for busy days when structure matters more than perfection.",
    pantrySubtitle: "Keep lighter staples and smart snacks ready so healthy choices stay automatic.",
    mealIds: ["turkey_taco_salad", "salmon_cauli_bowl", "berry_protein_smoothie"],
  },
  balanced: {
    subtitle: "Build better eating momentum with balanced meals, quick recovery, and simple healthy defaults.",
    status: "Choose balanced meals that support training, energy, and everyday consistency.",
    recommendationTitle: "Recommended Today",
    recommendationSubtitle: "Balanced meals chosen to keep energy stable and recovery easy to manage.",
    quickRecoverySubtitle: "Simple, fast options when you want to keep the day moving.",
    convenienceSubtitle: "Healthy convenience options that help you stay consistent through the week.",
    pantrySubtitle: "Restock the basics that make balanced meals easier to repeat.",
    mealIds: ["chicken_rice_power_bowl", "turkey_taco_salad", "berry_protein_smoothie"],
  },
  recovery: {
    subtitle: "Lean into recovery-focused meals that help you bounce back without extra effort.",
    status: "Use easy, protein-forward meals that support recovery and reduce decision fatigue.",
    recommendationTitle: "Recovery Fuel",
    recommendationSubtitle: "Meals chosen to help you bounce back from training with less friction.",
    quickRecoverySubtitle: "Fast options when you want recovery support now.",
    convenienceSubtitle: "Healthy convenience picks when energy is low and prep needs to stay simple.",
    pantrySubtitle: "Keep recovery staples ready so better choices stay easy on tired days.",
    mealIds: ["salmon_recovery_bowl", "berry_protein_smoothie", "greek_yogurt_recovery_bowl"],
  },
};

const MEAL_META: Record<MealCategory, { label: string; emoji: string; range: string }> = {
  breakfast: { label: "Breakfast", emoji: "🌅", range: "5 – 11am" },
  lunch:     { label: "Lunch",     emoji: "☀️",  range: "11am – 3pm" },
  dinner:    { label: "Dinner",    emoji: "🌙",  range: "3 – 9pm" },
  snack:     { label: "Snacks",    emoji: "⚡",  range: "Anytime" },
};

function getMealCategory(timestamp: string): MealCategory {
  const h = new Date(timestamp).getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 21) return "dinner";
  return "snack";
}

function MacroBar({
  label, emoji, consumed, target, fillClass, glowClass, accentClass,
}: {
  label: string; emoji: string; consumed: number; target: number;
  fillClass: string; glowClass: string; accentClass: string;
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const over = target > 0 && consumed > target;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-300">{emoji} {label}</span>
        <span className="text-slate-500">
          {consumed}g / <span className={accentClass}>{target}g</span>
          {over ? <span className="ml-1 text-red-400">↑</span> : null}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillClass} ${glowClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SevenDayChart({ targets }: { targets: MacroTargets }) {
  const data = useMemo(() => readLast7DaysSummary(), []);
  const max = Math.max(...data.map((d) => d.calories), targets.calories, 1);
  const gridLines = [0.25, 0.5, 0.75, 1];
  const nonZeroEntries = data.filter((entry) => entry.calories > 0);
  const calorieDelta =
    nonZeroEntries.length >= 2
      ? nonZeroEntries[nonZeroEntries.length - 1].calories - nonZeroEntries[0].calories
      : null;
  const hasLoggedTrend = nonZeroEntries.length > 0;

  return (
    <div className="rounded-[1.65rem] border border-white/8 bg-slate-950/58 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-300">7-Day Trend</p>
          <h3 className="mt-1 text-lg font-black text-white">Calorie Intake</h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
            Target {targets.calories} kcal
          </div>
          <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
            calorieDelta === null
              ? "border-white/8 bg-slate-900/70 text-slate-500"
              : calorieDelta > 0
                ? "border-red-400/18 bg-red-500/10 text-red-200"
                : calorieDelta < 0
                  ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
                  : "border-blue-400/18 bg-blue-500/10 text-blue-200"
          }`}>
            {calorieDelta === null ? "No Delta Yet" : `${calorieDelta > 0 ? "+" : ""}${calorieDelta} kcal · 7D`}
          </div>
        </div>
      </div>
      {!hasLoggedTrend ? (
        <div className="rounded-[1.3rem] border border-dashed border-white/10 bg-slate-950/45 px-4 py-6 text-center">
          <p className="text-sm font-black text-white">Your calorie trend will build here.</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Start logging meals and this chart will show your daily intake, target line, and 7-day movement at a glance.
          </p>
        </div>
      ) : null}
      <div className="relative h-28">
        {gridLines.map((ratio, index) => (
          <div
            key={ratio}
            className="pointer-events-none absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${ratio * 100}%` }}
          >
            <span className="w-9 shrink-0 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
              {Math.round(max * ratio)}
            </span>
            <div
              className={`h-px flex-1 border-t border-dashed ${
                index === gridLines.length - 1 ? "border-blue-400/14" : "border-white/[0.09]"
              }`}
            />
          </div>
        ))}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-fuchsia-400/20"
          style={{ bottom: `${(targets.calories / max) * 100}%` }}
        />
        <div className="absolute inset-x-0 bottom-0 left-0 flex h-24 items-end gap-2 pl-11">
        {data.map(({ date, label, calories }) => {
          const h = Math.max(8, Math.round((calories / max) * 100));
          const isToday = label === "Today";
          return (
            <div key={date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-20 w-full items-end rounded-full bg-white/[0.04] px-1 py-1">
                <div
                  className={`w-full rounded-full transition-all duration-500 ${
                    calories === 0
                      ? "bg-white/10"
                      : calories > targets.calories
                        ? "bg-gradient-to-t from-rose-600 to-red-400"
                        : isToday
                          ? "bg-gradient-to-t from-fuchsia-500 to-purple-400"
                          : "bg-gradient-to-t from-blue-500 to-cyan-400"
                  }`}
                  style={{ height: `${h}%` }}
                />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.14em] ${isToday ? "text-fuchsia-400" : "text-slate-600"}`}>
                {label}
              </span>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

function MealSection({
  category,
  items,
  onRemove,
}: {
  category: MealCategory;
  items: FoodItem[];
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(items.length > 0);
  const meta = MEAL_META[category];
  const totalCal = items.reduce((s, f) => s + f.calories, 0);

  return (
    <div className="rounded-[1.45rem] border border-white/8 bg-slate-950/50 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{meta.emoji}</span>
          <div className="text-left">
            <p className="text-sm font-black text-slate-200">{meta.label}</p>
            <p className="text-[10px] text-slate-600">{meta.range}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalCal > 0 ? (
            <span className="text-xs font-bold text-slate-400">{totalCal} kcal</span>
          ) : (
            <span className="text-[10px] text-slate-600">Nothing logged</span>
          )}
          <span className={`text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {open ? (
        <div className="border-t border-white/8 px-4 pb-3 pt-2 space-y-2">
          {items.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-slate-600">No meals in this window yet</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-slate-900/60 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-200">{item.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {item.servingSize} · {item.calories} kcal · P{item.protein}g C{item.carbs}g F{item.fats}g
                  </p>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="ml-3 shrink-0 rounded-full border border-white/8 bg-slate-950 px-2 py-1 text-[10px] font-black text-slate-600 transition hover:border-red-400/20 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function NutritionSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function RecommendationSectionCard({ card }: { card: NutritionRecipe }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(2,6,23,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200">
            {card.badge}
          </span>
          <h4 className="mt-3 truncate text-base font-black text-white">{card.title}</h4>
        </div>
        <div className="shrink-0 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
          {card.prepMinutes} min
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-300">{card.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-blue-400/18 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-200">
          {card.calories} cal
        </span>
        <span className="rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
          {card.protein}g protein
        </span>
      </div>
    </div>
  );
}

function RecipeDetailModal({
  recipe,
  onClose,
  onOpenPartner,
  onLogMeal,
}: {
  recipe: NutritionRecipe;
  onClose: () => void;
  onOpenPartner: () => void;
  onLogMeal?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-4 backdrop-blur-md sm:items-center">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.65)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">{recipe.badge}</p>
            <h3 className="mt-2 text-2xl font-black text-white">{recipe.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{recipe.whyItFits}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-400/18 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-200">
            {recipe.calories} cal
          </span>
          <span className="rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200">
            {recipe.protein}g protein
          </span>
          <span className="rounded-full border border-fuchsia-400/18 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200">
            {recipe.prepMinutes} min
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Ingredients</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient}>• {ingredient}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.5rem] border border-white/8 bg-slate-900/60 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Steps</p>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
              {recipe.steps.map((step, index) => (
                <li key={step}>
                  <span className="mr-2 text-cyan-300">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {onLogMeal ? (
            <button
              type="button"
              onClick={onLogMeal}
              className="rounded-2xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-4 py-3 text-sm font-black text-white transition hover:brightness-105"
            >
              Log This Meal
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenPartner}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-slate-100 transition hover:border-white/20 hover:text-white"
          >
            {recipe.secondaryCta}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NutritionScreen({
  targets,
  todayFoodLog,
  caloriesBurnedToday,
  activeSessionCalories,
  bodyProfile,
  onBack,
  onOpenFoodCamera,
  onCopyYesterdayMeals,
  onRemoveFoodItem,
  onLogRecommendedMeal,
  primaryButton,
}: NutritionScreenProps) {
  const totalConsumed = todayFoodLog.reduce((s, f) => s + f.calories, 0);
  const totalProtein  = todayFoodLog.reduce((s, f) => s + f.protein, 0);
  const totalCarbs    = todayFoodLog.reduce((s, f) => s + f.carbs, 0);
  const totalFats     = todayFoodLog.reduce((s, f) => s + f.fats, 0);

  const totalWorkoutCredit = caloriesBurnedToday + activeSessionCalories;
  const remaining = targets.calories + totalWorkoutCredit - totalConsumed;
  const remainingColor =
    remaining < 0 ? "text-red-400" :
    remaining < targets.calories * 0.12 ? "text-fuchsia-400" :
    "text-blue-400";
  const yesterdayMeals = useMemo(() => readYesterdayNutritionLog().consumed, []);
  const yesterdayMealCount = yesterdayMeals.length;
  const hasFoodLog = todayFoodLog.length > 0;
  const [selectedRecipe, setSelectedRecipe] = useState<NutritionRecipe | null>(null);
  const inferredGoal = useMemo(() => inferNutritionGoal(bodyProfile?.activityGoal), [bodyProfile?.activityGoal]);
  const goalCopy = GOAL_COPY[inferredGoal];
  const goalRecipes = useMemo(
    () => getNutritionRecipesForGoal(inferredGoal).filter((recipe) => goalCopy.mealIds.includes(recipe.id)),
    [goalCopy.mealIds, inferredGoal]
  );
  const proteinGap = Math.max(0, targets.protein - totalProtein);
  const calorieDelta = targets.calories + totalWorkoutCredit - totalConsumed;
  const dailyStatusLine =
    proteinGap > 20
      ? `You’re a little low on protein for today’s goal.`
      : calorieDelta < 0
        ? `You’re slightly over your current calorie budget, so lean on lighter recovery options.`
        : `Your recovery nutrition is on track today.`;

  const categorized = useMemo(() => {
    const groups: Record<MealCategory, FoodItem[]> = {
      breakfast: [], lunch: [], dinner: [], snack: [],
    };
    for (const item of todayFoodLog) {
      groups[getMealCategory(item.timestamp)].push(item);
    }
    return groups;
  }, [todayFoodLog]);

  return (
    <main className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.10),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_48%,_#030712_100%)] px-4 pb-10 pt-8 text-white antialiased sm:px-6 lg:px-8 lg:py-12">
      {selectedRecipe ? (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onOpenPartner={() => openNutritionPartner(selectedRecipe.partnerKey)}
          onLogMeal={
            onLogRecommendedMeal
              ? () => {
                  onLogRecommendedMeal(buildRecipeAsFoodItem(selectedRecipe));
                  setSelectedRecipe(null);
                }
              : undefined
          }
        />
      ) : null}
      <div className="mx-auto w-full max-w-md lg:max-w-5xl xl:max-w-6xl">
        <div className="rounded-[2.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.94))] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.5)] backdrop-blur-2xl sm:p-6 lg:p-8">

          <button
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-300 backdrop-blur hover:border-white/20 hover:text-white"
          >
            ← Back
          </button>

          <header className="mb-6 rounded-[1.9rem] border border-white/8 bg-slate-950/58 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-fuchsia-300">Daily Fuel</p>
            <h2 className="mt-2 bg-gradient-to-r from-white via-fuchsia-100 to-blue-200 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Nutrition
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {goalCopy.subtitle}
            </p>
          </header>

          <section className="mb-4 rounded-[1.75rem] border border-white/8 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(15,23,42,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Today&apos;s Nutrition</p>
            <h3 className="mt-2 text-lg font-black text-white">{goalCopy.status}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{dailyStatusLine}</p>
          </section>

          {!hasFoodLog ? (
            <section className="mb-4 rounded-[1.75rem] border border-dashed border-fuchsia-400/14 bg-[linear-gradient(135deg,rgba(217,70,239,0.08),rgba(2,6,23,0.84))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-300">Fuel Preview</p>
              <h3 className="mt-2 text-lg font-black text-white">Your nutrition dashboard will populate after your first meals.</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                This is where GymTwin will track protein progress, calorie budget shifts, meal timing, and your rolling 7-day intake trend.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Protein target", "Calorie delta", "Meal timeline", "Workout credit"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/8 bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <div className="space-y-4">

            {/* Calorie HUD */}
            <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="grid grid-cols-3 items-center gap-3 rounded-[1.3rem] border border-white/8 bg-slate-900/50 py-4 text-center">
                <div>
                  <span className="block text-2xl font-black text-slate-300">{totalConsumed}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Consumed</span>
                </div>
                <div>
                  <span className={`block text-3xl font-black drop-shadow-[0_0_10px_rgba(96,165,250,0.3)] ${remainingColor}`}>
                    {remaining}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Remaining kcal</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-emerald-400">+{totalWorkoutCredit}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {activeSessionCalories > 0 ? "Active Credit" : "Workout Credit"}
                  </span>
                </div>
              </div>

              {/* Live session banner */}
              {activeSessionCalories > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
                      Live session — +{activeSessionCalories} kcal earned
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400/60">Fuel up!</span>
                </div>
              )}
            </div>

            {/* Macro bars */}
            <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Macro Breakdown</p>
              <div className="space-y-4">
                <MacroBar label="Protein"       emoji="💪" consumed={totalProtein} target={targets.protein}
                  fillClass="bg-blue-500"    glowClass="shadow-[0_0_8px_rgba(59,130,246,0.5)]"   accentClass="text-blue-400" />
                <MacroBar label="Carbohydrates" emoji="🌾" consumed={totalCarbs}   target={targets.carbs}
                  fillClass="bg-emerald-500" glowClass="shadow-[0_0_8px_rgba(16,185,129,0.5)]"  accentClass="text-emerald-400" />
                <MacroBar label="Healthy Fats"  emoji="🥑" consumed={totalFats}    target={targets.fats}
                  fillClass="bg-red-500"     glowClass="shadow-[0_0_8px_rgba(239,68,68,0.45)]"  accentClass="text-red-400" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/6 pt-4 text-center">
                {[
                  { label: "Daily Target", value: `${targets.calories} kcal`, color: "text-slate-300" },
                  { label: "Workout Bonus", value: `+${totalWorkoutCredit} kcal`, color: "text-emerald-400" },
                  { label: "Effective Budget", value: `${targets.calories + totalWorkoutCredit} kcal`, color: "text-blue-400" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={`text-sm font-black ${color}`}>{value}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <NutritionSectionHeader
                eyebrow={goalCopy.recommendationTitle}
                title={goalCopy.recommendationTitle}
                description={goalCopy.recommendationSubtitle}
              />
              <div className="grid gap-3 lg:grid-cols-3">
                {goalRecipes.map((meal) => (
                    <div key={meal.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/22 p-1">
                      <RecommendationSectionCard card={meal} />
                      <div className="flex flex-wrap gap-2 px-4 pb-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecipe(meal)}
                        className="rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:brightness-105"
                      >
                        {meal.primaryCta}
                      </button>
                      <button
                        type="button"
                        onClick={() => openNutritionPartner(meal.partnerKey)}
                        className="rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-200 transition hover:border-white/20 hover:text-white"
                      >
                        {meal.secondaryCta}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
                <NutritionSectionHeader
                  eyebrow="Quick Recovery"
                  title="Quick Recovery"
                  description={goalCopy.quickRecoverySubtitle}
                />
                <div className="space-y-3">
                  {QUICK_RECOVERY_RECIPES.map((card) => (
                    <div key={card.id} className="rounded-[1.5rem] border border-white/8 bg-slate-950/22 p-1">
                      <RecommendationSectionCard card={card} />
                      <div className="flex flex-wrap gap-2 px-4 pb-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecipe(card)}
                          className="rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-fuchsia-600 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:brightness-105"
                        >
                          {card.primaryCta}
                        </button>
                        <button
                          type="button"
                          onClick={() => openNutritionPartner(card.partnerKey)}
                          className="rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-200 transition hover:border-white/20 hover:text-white"
                        >
                          {card.secondaryCta}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <NutritionSectionHeader
                    eyebrow="Healthy Convenience"
                    title="Healthy Convenience"
                    description={goalCopy.convenienceSubtitle}
                  />
                  <div className="space-y-3">
                    {CONVENIENCE_CARDS.map((card) => (
                      <div key={card.title} className={`rounded-[1.35rem] border px-4 py-4 ${card.accent}`}>
                        <p className="text-sm font-black text-white">{card.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-200/90">{card.description}</p>
                        <button
                          type="button"
                          onClick={() => openNutritionPartner(card.partnerKey)}
                          className="mt-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-black/20"
                        >
                          {card.cta}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <NutritionSectionHeader
                    eyebrow="Pantry & Staples"
                    title="Pantry & Staples"
                    description={goalCopy.pantrySubtitle}
                  />
                  <div className="space-y-3">
                    {PANTRY_CARDS.map((section) => (
                      <div key={section.title} className="rounded-[1.25rem] border border-white/8 bg-slate-900/58 px-4 py-4">
                        <p className="text-sm font-black text-white">{section.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{section.description}</p>
                        <button
                          type="button"
                          onClick={() => openNutritionPartner(section.partnerKey)}
                          className="mt-3 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 transition hover:border-cyan-400/24 hover:text-white"
                        >
                          {section.cta}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7-day trend */}
            <SevenDayChart targets={targets} />

            {/* Meal timeline */}
            <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-500">Today&apos;s Meal Timeline</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Reuse yesterday&apos;s structure when you want a faster logging pass.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCopyYesterdayMeals}
                  disabled={yesterdayMealCount === 0}
                  className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                    yesterdayMealCount === 0
                      ? "cursor-not-allowed border-white/8 bg-slate-900/70 text-slate-600"
                      : "border-blue-400/22 bg-blue-500/10 text-blue-200 hover:border-blue-300/30 hover:bg-blue-500/14"
                  }`}
                >
                  Copy Yesterday&apos;s Meals
                </button>
              </div>
              <div className="mb-3 rounded-2xl border border-white/8 bg-slate-900/58 px-4 py-3 text-[11px] text-slate-400">
                {yesterdayMealCount > 0
                  ? `${yesterdayMealCount} meal${yesterdayMealCount === 1 ? "" : "s"} ready to clone into today.`
                  : "No meals logged yesterday yet."}
              </div>
              <div className="space-y-3">
                {(["breakfast", "lunch", "dinner", "snack"] as MealCategory[]).map((cat) => (
                  <MealSection
                    key={cat}
                    category={cat}
                    items={categorized[cat]}
                    onRemove={onRemoveFoodItem}
                  />
                ))}
              </div>
            </div>

            {/* CTA */}
            <button onClick={onOpenFoodCamera} className={primaryButton}>
              📸 Scan Meal with AI Camera
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}
