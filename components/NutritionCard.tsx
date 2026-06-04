"use client";

import { useState } from "react";
import type { FoodItem, MacroTargets } from "@/types";

type NutritionCardProps = {
  targets: MacroTargets;
  mealsLogged: FoodItem[];
  caloriesBurnedInWorkout: number;
  onOpenCamera?: () => void;
  onRemoveFoodItem?: (id: string) => void;
};

function MacroBar({
  label,
  emoji,
  consumed,
  target,
  fillClass,
  glowClass,
  accentClass,
}: {
  label: string;
  emoji: string;
  consumed: number;
  target: number;
  fillClass: string;
  glowClass: string;
  accentClass: string;
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const over = target > 0 && consumed > target;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
        <span className="text-slate-300">
          {emoji} {label}
        </span>
        <span className="text-slate-500">
          {consumed}g /{" "}
          <span className={accentClass}>{target}g</span>
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

export function NutritionCard({
  targets,
  mealsLogged,
  caloriesBurnedInWorkout,
  onOpenCamera,
  onRemoveFoodItem,
}: NutritionCardProps) {
  const [logOpen, setLogOpen] = useState(false);

  const totalConsumed = mealsLogged.reduce((s, f) => s + f.calories, 0);
  const totalProtein  = mealsLogged.reduce((s, f) => s + f.protein, 0);
  const totalCarbs    = mealsLogged.reduce((s, f) => s + f.carbs, 0);
  const totalFats     = mealsLogged.reduce((s, f) => s + f.fats, 0);

  // Dynamic pool: credits active workout burn back into remaining budget
  const remainingCalories = targets.calories + caloriesBurnedInWorkout - totalConsumed;
  const remainingColor =
    remainingCalories < 0 ? "text-red-400" :
    remainingCalories < targets.calories * 0.15 ? "text-fuchsia-400" :
    "text-blue-400";

  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-slate-950/60 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.03)]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">Fuel Intake</p>
          <h3 className="mt-0.5 text-xl font-black text-white">Nutrition Focus</h3>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Lean Muscle</span>
        </div>
      </div>

      {/* Calorie HUD — 3-column */}
      <div className="mb-5 grid grid-cols-3 items-center gap-3 rounded-[1.4rem] border border-white/8 bg-slate-900/50 py-4 text-center">
        <div>
          <span className="block text-2xl font-black text-slate-300">{totalConsumed}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Consumed</span>
        </div>
        <div>
          <span className={`block text-3xl font-black drop-shadow-[0_0_10px_rgba(96,165,250,0.3)] ${remainingColor}`}>
            {remainingCalories}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Remaining kcal</span>
        </div>
        <div>
          <span className="block text-2xl font-black text-emerald-400">+{caloriesBurnedInWorkout}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Workout Credit</span>
        </div>
      </div>

      {/* Macro Progress Bars */}
      <div className="space-y-4">
        <MacroBar
          label="Protein"
          emoji="💪"
          consumed={totalProtein}
          target={targets.protein}
          fillClass="bg-blue-500"
          glowClass="shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          accentClass="text-blue-400"
        />
        <MacroBar
          label="Carbohydrates"
          emoji="🌾"
          consumed={totalCarbs}
          target={targets.carbs}
          fillClass="bg-emerald-500"
          glowClass="shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          accentClass="text-emerald-400"
        />
        <MacroBar
          label="Healthy Fats"
          emoji="🥑"
          consumed={totalFats}
          target={targets.fats}
          fillClass="bg-red-500"
          glowClass="shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          accentClass="text-red-400"
        />
      </div>

      {/* Logged meals collapsible */}
      {mealsLogged.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setLogOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-slate-900/60 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition hover:border-white/14 hover:text-slate-300"
          >
            <span>Today&apos;s Log · {mealsLogged.length} item{mealsLogged.length !== 1 ? "s" : ""}</span>
            <span className={`transition-transform duration-200 ${logOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          {logOpen && (
            <div className="mt-2 space-y-2">
              {mealsLogged.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-slate-950/50 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-200">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.servingSize} · {item.calories} kcal · P{item.protein}g C{item.carbs}g F{item.fats}g</p>
                  </div>
                  {onRemoveFoodItem && (
                    <button
                      onClick={() => onRemoveFoodItem(item.id)}
                      className="ml-3 shrink-0 rounded-full border border-white/8 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-500 transition hover:border-red-400/20 hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <button
        onClick={onOpenCamera}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-slate-700 hover:bg-slate-800 active:scale-[0.99]"
      >
        📸 Scan Meal with AI Camera
      </button>
    </div>
  );
}
