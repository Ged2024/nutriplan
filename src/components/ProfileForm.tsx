"use client";

import { useState } from "react";
import {
  CALORIE_GOALS,
  DIETARY_PREFERENCES,
  HEALTH_CONDITIONS,
} from "@/lib/constants";
import type {
  CalorieGoal,
  DietaryPreference,
  HealthCondition,
  Profile,
} from "@/lib/types";

export interface ProfileFormValues {
  name: string;
  healthConditions: HealthCondition[];
  dietaryPreferences: DietaryPreference[];
  calorieGoal: CalorieGoal;
  targetCalories: number;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export default function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Profile;
  onSave: (values: ProfileFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(
    initial?.healthConditions ?? [],
  );
  const [dietaryPreferences, setDietaryPreferences] = useState<
    DietaryPreference[]
  >(initial?.dietaryPreferences ?? []);
  const [calorieGoal, setCalorieGoal] = useState<CalorieGoal>(
    initial?.calorieGoal ?? "maintenance",
  );
  const [targetCalories, setTargetCalories] = useState<number>(
    initial?.targetCalories ??
      CALORIE_GOALS.find((g) => g.value === "maintenance")!.defaultCalories,
  );
  const [caloriesEdited, setCaloriesEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectGoal(goal: CalorieGoal) {
    setCalorieGoal(goal);
    if (!caloriesEdited) {
      const def = CALORIE_GOALS.find((g) => g.value === goal)!.defaultCalories;
      setTargetCalories(def);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    if (!Number.isFinite(targetCalories) || targetCalories < 800) {
      setError("Calorie target must be at least 800 kcal.");
      return;
    }
    onSave({
      name: name.trim(),
      healthConditions,
      dietaryPreferences,
      calorieGoal,
      targetCalories: Math.round(targetCalories),
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6"
    >
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-stone-700 mb-2">
          Health conditions
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {HEALTH_CONDITIONS.map((c) => {
            const active = healthConditions.includes(c.value);
            return (
              <button
                type="button"
                key={c.value}
                onClick={() =>
                  setHealthConditions((prev) => toggle(prev, c.value))
                }
                className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span className="font-medium">{c.label}</span>
                <span className="block text-xs text-stone-500 mt-0.5">
                  {c.note}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-stone-700 mb-2">
          Dietary preferences
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIETARY_PREFERENCES.map((d) => {
            const active = dietaryPreferences.includes(d.value);
            return (
              <button
                type="button"
                key={d.value}
                onClick={() =>
                  setDietaryPreferences((prev) => toggle(prev, d.value))
                }
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-stone-300 hover:bg-stone-50"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-stone-700 mb-2">
          Calorie goal
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {CALORIE_GOALS.map((g) => {
            const active = calorieGoal === g.value;
            return (
              <button
                type="button"
                key={g.value}
                onClick={() => selectGoal(g.value)}
                className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span className="font-medium">{g.label}</span>
                <span className="block text-xs text-stone-500 mt-0.5">
                  {g.note}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1">
          Daily calorie target (kcal)
        </label>
        <input
          type="number"
          min={800}
          max={6000}
          step={50}
          value={targetCalories}
          onChange={(e) => {
            setCaloriesEdited(true);
            setTargetCalories(Number(e.target.value));
          }}
          className="w-40 rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          {initial ? "Save changes" : "Add profile"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
