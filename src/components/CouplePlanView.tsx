"use client";

import { DAY_LABELS } from "@/lib/constants";
import type { CoupleMeal, CouplePlan, MealType } from "@/lib/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function dayLabel(dayIndex: number, totalDays: number): string {
  const weekday = DAY_LABELS[dayIndex % 7];
  if (totalDays <= 7) return weekday ?? `Day ${dayIndex + 1}`;
  return `Week ${Math.floor(dayIndex / 7) + 1} · ${weekday}`;
}

export default function CouplePlanView({
  plan,
  onSaveFavorite,
  isFavorite,
}: {
  plan: CouplePlan;
  onSaveFavorite?: (meal: CoupleMeal) => void;
  isFavorite?: (meal: CoupleMeal) => boolean;
}) {
  const totalDays = plan.days.length;
  return (
    <div className="space-y-6">
      {plan.days.map((day) => {
        const meals = [...day.meals].sort(
          (a, b) =>
            MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType),
        );
        // Per-person daily totals.
        const totals = plan.profileIds.map((id) =>
          day.meals.reduce((sum, m) => {
            const p = m.portions.find((x) => x.profileId === id);
            return sum + (p?.calories ?? 0);
          }, 0),
        );
        return (
          <section
            key={day.day}
            className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden"
          >
            <header className="flex items-center justify-between gap-4 border-b border-stone-100 bg-stone-50 px-5 py-3">
              <h3 className="font-bold text-stone-900">
                {dayLabel(day.day, totalDays)}
              </h3>
              <div className="text-xs text-stone-600">
                {plan.profileNames.map((n, idx) => (
                  <span key={idx} className="ml-3">
                    {n}:{" "}
                    <span className="font-mono font-semibold text-stone-900">
                      {totals[idx]}
                    </span>{" "}
                    kcal
                  </span>
                ))}
              </div>
            </header>

            {day.batchPrep && (
              <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">
                <span className="font-semibold">🍲 Batch cooking — </span>
                {day.batchPrep}
              </div>
            )}

            <div className="divide-y divide-stone-100">
              {meals.map((meal, i) => (
                <CoupleMealRow
                  key={i}
                  meal={meal}
                  onSaveFavorite={onSaveFavorite}
                  saved={isFavorite?.(meal) ?? false}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CoupleMealRow({
  meal,
  onSaveFavorite,
  saved,
}: {
  meal: CoupleMeal;
  onSaveFavorite?: (meal: CoupleMeal) => void;
  saved: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            {MEAL_LABELS[meal.mealType]} · shared dish
          </span>
          <h4 className="mt-1 font-semibold text-stone-900">{meal.name}</h4>
          <p className="mt-1 text-sm text-stone-600">{meal.description}</p>
        </div>
        {onSaveFavorite && (
          <button
            onClick={() => onSaveFavorite(meal)}
            disabled={saved}
            title={saved ? "Saved to favorites" : "Save to favorites"}
            className={`no-print rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
              saved
                ? "border-rose-200 bg-rose-50 text-rose-500 cursor-default"
                : "border-stone-300 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {saved ? "♥ Saved" : "♡ Save"}
          </button>
        )}
      </div>

      {/* Per-person portions */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {meal.portions.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-stone-800">
                {p.profileName}
              </span>
              <span className="font-mono text-sm font-semibold text-stone-900">
                {p.calories} kcal
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{p.portion}</p>
            <p className="text-xs text-stone-400 mt-0.5">
              P {p.protein}g · C {p.carbs}g · F {p.fat}g
            </p>
          </div>
        ))}
      </div>

      {meal.instructions.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:text-brand-800 select-none">
            Recipe ({meal.instructions.length} steps)
          </summary>
          <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm text-stone-700">
            {meal.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      )}

      {meal.ingredients.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-brand-700 hover:text-brand-800 select-none">
            {meal.ingredients.length} ingredients (shared)
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
