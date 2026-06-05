"use client";

import { useState } from "react";
import {
  CALORIE_GOALS,
  DIETARY_PREFERENCES,
  GENDERS,
  HEALTH_CONDITIONS,
  MAX_AGE,
  MIN_AGE,
} from "@/lib/constants";
import {
  getCalorieReference,
  suggestedTarget,
  type CalorieRange,
} from "@/lib/calorieReference";
import type {
  CalorieGoal,
  DietaryPreference,
  Gender,
  HealthCondition,
  Profile,
} from "@/lib/types";

export interface ProfileFormValues {
  name: string;
  gender: Gender;
  age: number;
  healthConditions: HealthCondition[];
  dietaryPreferences: DietaryPreference[];
  calorieGoal: CalorieGoal;
  targetCalories: number;
}

/** Toggle within a mutually-exclusive group: selecting one clears its siblings. */
function applyExclusive<T>(list: T[], value: T, siblings: T[]): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list.filter((v) => !siblings.includes(v)), value];
}

/** Plain on/off toggle (for stackable options). */
function toggleSimple<T>(list: T[], value: T): T[] {
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
  const [gender, setGender] = useState<Gender>(initial?.gender ?? "male");
  const [age, setAge] = useState<number>(initial?.age ?? 30);
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

  const reference = getCalorieReference(gender, age, calorieGoal);

  function selectGoal(goal: CalorieGoal) {
    setCalorieGoal(goal);
    if (!caloriesEdited) {
      const def = CALORIE_GOALS.find((g) => g.value === goal)!.defaultCalories;
      setTargetCalories(def);
    }
  }

  // Within a category (blood pressure / blood sugar / cholesterol), selecting
  // one condition replaces the other — you can't have full + borderline at once.
  function toggleHealth(value: HealthCondition) {
    const grp = HEALTH_CONDITIONS.find((c) => c.value === value)!.group;
    const siblings = HEALTH_CONDITIONS.filter((c) => c.group === grp).map(
      (c) => c.value,
    );
    setHealthConditions((prev) => applyExclusive(prev, value, siblings));
  }

  // Base diets are mutually exclusive; free-from restrictions stack.
  function toggleDiet(value: DietaryPreference) {
    const d = DIETARY_PREFERENCES.find((x) => x.value === value)!;
    if (d.group === "base") {
      const bases = DIETARY_PREFERENCES.filter((x) => x.group === "base").map(
        (x) => x.value,
      );
      setDietaryPreferences((prev) => applyExclusive(prev, value, bases));
    } else {
      setDietaryPreferences((prev) => toggleSimple(prev, value));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter a name.");
    if (!Number.isFinite(age) || age < MIN_AGE || age > MAX_AGE)
      return setError(`Please enter an age between ${MIN_AGE} and ${MAX_AGE}.`);
    if (!Number.isFinite(targetCalories) || targetCalories < 800)
      return setError("Calorie target must be at least 800 kcal.");
    onSave({
      name: name.trim(),
      gender,
      age: Math.round(age),
      healthConditions,
      dietaryPreferences,
      calorieGoal,
      targetCalories: Math.round(targetCalories),
    });
  }

  const dietButton = (d: (typeof DIETARY_PREFERENCES)[number]) => {
    const active = dietaryPreferences.includes(d.value);
    return (
      <button
        type="button"
        key={d.value}
        onClick={() => toggleDiet(d.value)}
        className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
          active
            ? "border-brand-500 bg-brand-50 text-brand-800"
            : "border-stone-300 hover:bg-stone-50"
        }`}
      >
        <span className="font-medium">{d.label}</span>
        <span className="block text-xs text-stone-500 mt-0.5">
          {d.description}
        </span>
      </button>
    );
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-6"
    >
      {/* Name + gender + age */}
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Age
            </label>
            <input
              type="number"
              min={MIN_AGE}
              max={MAX_AGE}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v))
                  setAge(Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(v))));
              }}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-stone-400">
              Ages {MIN_AGE}–{MAX_AGE}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Health conditions */}
      <fieldset>
        <legend className="text-sm font-semibold text-stone-700 mb-1">
          Health conditions
        </legend>
        <p className="text-xs text-stone-500 mb-2">
          Within a category, the borderline and full versions are mutually
          exclusive — choosing one replaces the other.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {HEALTH_CONDITIONS.map((c) => {
            const active = healthConditions.includes(c.value);
            return (
              <button
                type="button"
                key={c.value}
                onClick={() => toggleHealth(c.value)}
                className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span className="font-medium flex items-center gap-1.5">
                  {c.label}
                  {c.borderline && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                      borderline
                    </span>
                  )}
                </span>
                <span className="block text-xs text-stone-500 mt-0.5">
                  {c.note}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Dietary preferences: one base diet + optional free-from add-ons */}
      <fieldset>
        <legend className="text-sm font-semibold text-stone-700 mb-1">
          Dietary preferences
        </legend>
        <p className="text-xs text-stone-500 mb-2">
          Pick one base diet, then add any free-from restrictions.
        </p>

        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">
          Base diet — choose one
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DIETARY_PREFERENCES.filter((d) => d.group === "base").map(dietButton)}
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">
          Free-from — optional, combine any
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DIETARY_PREFERENCES.filter((d) => d.group === "freefrom").map(
            dietButton,
          )}
        </div>
      </fieldset>

      {/* Calorie goal */}
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

      {/* Recommended calorie ranges */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm font-semibold text-stone-700">
          Recommended daily range
        </p>
        <p className="text-xs text-stone-500 mt-0.5">
          Estimated for a {gender}, age {age}, on a {calorieGoal} goal. Tap a
          value to use it.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ReferenceCard
            title="RENI (Philippines)"
            subtitle="FNRI dietary reference"
            range={reference.reni}
            onApply={(v) => {
              setCaloriesEdited(true);
              setTargetCalories(v);
            }}
          />
          <ReferenceCard
            title="Global (WHO/FAO · US DRI)"
            subtitle="International reference"
            range={reference.global}
            onApply={(v) => {
              setCaloriesEdited(true);
              setTargetCalories(v);
            }}
          />
        </div>
      </div>

      {/* Calorie target */}
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

function ReferenceCard({
  title,
  subtitle,
  range,
  onApply,
}: {
  title: string;
  subtitle: string;
  range: CalorieRange;
  onApply: (v: number) => void;
}) {
  const suggested = suggestedTarget(range);
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-sm font-semibold text-stone-800">{title}</p>
      <p className="text-[11px] text-stone-400">{subtitle}</p>
      <p className="mt-2 text-sm text-stone-600">
        Maintenance ≈{" "}
        <span className="font-mono">{range.maintenance}</span> kcal
      </p>
      <p className="text-sm text-stone-600">
        Recommended{" "}
        <span className="font-mono font-semibold text-stone-900">
          {range.min}–{range.max}
        </span>{" "}
        kcal
      </p>
      <button
        type="button"
        onClick={() => onApply(suggested)}
        className="mt-2 rounded-md border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
      >
        Use {suggested} kcal
      </button>
    </div>
  );
}
