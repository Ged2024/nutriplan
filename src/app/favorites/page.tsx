"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { CUISINES } from "@/lib/constants";
import type { Cuisine, MealType } from "@/lib/types";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function cuisineLabel(c?: Cuisine): string | null {
  if (!c) return null;
  return CUISINES.find((x) => x.value === c)?.label ?? null;
}

export default function FavoritesPage() {
  const { hydrated, favorites, removeFavorite } = useApp();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Favorites</h1>
          <p className="mt-2 text-stone-600">
            Meals you saved. Revisit the recipes any time, or remove ones you no
            longer want.
          </p>
        </div>
        <Link
          href="/plan"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors whitespace-nowrap"
        >
          + Generate more
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <div className="text-4xl" aria-hidden>
            ♡
          </div>
          <h2 className="mt-4 font-semibold text-stone-900">No favorites yet</h2>
          <p className="mt-2 text-stone-600">
            On any meal plan, tap{" "}
            <span className="font-medium">♡ Save</span> to keep a meal here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {favorites.map((fav) => {
            const m = fav.meal;
            const cui = cuisineLabel(fav.cuisine);
            return (
              <div
                key={fav.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                      <span className="font-semibold uppercase tracking-wide">
                        {MEAL_LABELS[m.mealType]}
                      </span>
                      {fav.sourceName && <span>· {fav.sourceName}</span>}
                      {cui && <span>· {cui}</span>}
                    </div>
                    <h3 className="mt-1 font-semibold text-stone-900">
                      {m.name}
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {m.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                    <div className="font-mono font-semibold text-stone-900">
                      {m.calories} kcal
                    </div>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-stone-500">
                  P {m.protein}g · C {m.carbs}g · F {m.fat}g
                </p>

                {m.instructions.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:text-brand-800 select-none">
                      Recipe ({m.instructions.length} steps)
                    </summary>
                    <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm text-stone-700">
                      {m.instructions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </details>
                )}

                {m.ingredients.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-brand-700 hover:text-brand-800 select-none">
                      {m.ingredients.length} ingredients
                    </summary>
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-sm text-stone-600">
                      {m.ingredients.map((ing, i) => (
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
          })}
        </div>
      )}
    </div>
  );
}
