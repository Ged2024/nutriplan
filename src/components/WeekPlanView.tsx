"use client";

import { DAY_LABELS } from "@/lib/constants";
import type { GeneratedMeal, MealType, WeekPlan } from "@/lib/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🍎",
};

/** Heading for a day, accounting for multi-week plans. */
function dayLabel(dayIndex: number, totalDays: number): string {
  const weekday = DAY_LABELS[dayIndex % 7];
  if (totalDays <= 7) return weekday ?? `Day ${dayIndex + 1}`;
  const week = Math.floor(dayIndex / 7) + 1;
  return `Week ${week} · ${weekday}`;
}

export default function WeekPlanView({ plan }: { plan: WeekPlan }) {
  const totalDays = plan.days.length;
  return (
    <div className="space-y-6">
      {plan.days.map((day) => {
        const meals = [...day.meals].sort(
          (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType),
        );
        const diff = day.totalCalories - plan.targetCalories;
        return (
          <section
            key={day.day}
            className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden"
          >
            <header className="flex items-center justify-between gap-4 border-b border-stone-100 bg-stone-50 px-5 py-3">
              <h3 className="font-bold text-stone-900">
                {dayLabel(day.day, totalDays)}
              </h3>
              <div className="text-sm text-stone-600">
                <span className="font-mono font-semibold text-stone-900">
                  {day.totalCalories}
                </span>{" "}
                / {plan.targetCalories} kcal
                <span
                  className={`ml-2 text-xs font-medium ${
                    Math.abs(diff) <= plan.targetCalories * 0.05
                      ? "text-brand-600"
                      : "text-amber-600"
                  }`}
                >
                  ({diff >= 0 ? "+" : ""}
                  {diff})
                </span>
              </div>
            </header>
            <div className="divide-y divide-stone-100">
              {meals.map((meal, i) => (
                <MealRow key={i} meal={meal} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MealRow({ meal }: { meal: GeneratedMeal }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden>{MEAL_ICONS[meal.mealType]}</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              {MEAL_LABELS[meal.mealType]}
            </span>
          </div>
          <h4 className="mt-1 font-semibold text-stone-900">{meal.name}</h4>
          <p className="mt-1 text-sm text-stone-600">{meal.description}</p>
        </div>
        <div className="text-right whitespace-nowrap">
          <div className="font-mono font-semibold text-stone-900">
            {meal.calories} kcal
          </div>
          <div className="text-xs text-stone-500">
            P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
          </div>
          {meal.prepMinutes > 0 && (
            <div className="text-xs text-stone-400 mt-0.5">
              {meal.prepMinutes} min
            </div>
          )}
        </div>
      </div>

      {meal.ingredients.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm text-brand-700 hover:text-brand-800 select-none">
            {meal.ingredients.length} ingredients
          </summary>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-sm text-stone-600">
            {meal.ingredients.map((ing, i) => (
              <li key={i} className="flex gap-1">
                <span className="text-stone-400">
                  {ing.quantity} {ing.unit}
                </span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
