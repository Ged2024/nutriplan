"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WeekPlanView from "@/components/WeekPlanView";
import CouplePlanView from "@/components/CouplePlanView";
import { coupleKey, useApp } from "@/lib/store";
import { CALORIE_GOALS, CUISINES, PLAN_DURATIONS } from "@/lib/constants";
import type {
  CoupleMeal,
  GeneratedMeal,
  Profile,
  WeekPlan,
  CouplePlan,
} from "@/lib/types";

type Mode = "individual" | "couples";

export default function PlanPage() {
  const {
    hydrated,
    profiles,
    plans,
    couplePlans,
    setPlan,
    setCouplePlan,
    favorites,
    addFavorite,
  } = useApp();

  const [mode, setMode] = useState<Mode>("individual");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coupleA, setCoupleA] = useState<string | null>(null);
  const [coupleB, setCoupleB] = useState<string | null>(null);

  // Shared generation options.
  const [numDays, setNumDays] = useState(7);
  const [cuisine, setCuisine] = useState<(typeof CUISINES)[number]["value"]>(
    "mixed",
  );
  const [batchCooking, setBatchCooking] = useState(false);
  const [demo, setDemo] = useState(true);

  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !selectedId && profiles.length > 0) {
      setSelectedId(profiles[0].id);
    }
    if (hydrated && profiles.length >= 2) {
      setCoupleA((a) => a ?? profiles[0].id);
      setCoupleB((b) => b ?? profiles[1].id);
    }
  }, [hydrated, profiles, selectedId]);

  function isFavoriteName(name: string) {
    return favorites.some((f) => f.meal.name === name);
  }

  async function callApi(payload: Record<string, unknown>) {
    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        days: numDays,
        cuisine,
        batchCooking,
        demo,
        ...payload,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Failed to generate plan.");
    return data;
  }

  async function generateIndividual(profile: Profile) {
    setError(null);
    setLoadingKey(profile.id);
    try {
      const data = await callApi({ mode: "individual", profile });
      setPlan(profile.id, data.plan as WeekPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoadingKey(null);
    }
  }

  async function generateCouple(a: Profile, b: Profile) {
    setError(null);
    const key = coupleKey(a.id, b.id);
    setLoadingKey(key);
    try {
      const data = await callApi({ mode: "couples", profiles: [a, b] });
      setCouplePlan(key, data.couplePlan as CouplePlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoadingKey(null);
    }
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 text-stone-500">
        Loading…
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
        <div className="text-5xl" aria-hidden>
          🍽️
        </div>
        <h1 className="mt-6 text-3xl font-bold text-stone-900">
          No profiles yet
        </h1>
        <p className="mt-3 text-stone-600">
          Add a profile first, then generate a personalized week of meals.
        </p>
        <Link
          href="/profiles"
          className="mt-8 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Set up profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-stone-900">Weekly Meal Plan</h1>
      <p className="mt-2 text-stone-600">
        Generate a whole-foods plan with recipes, calories, and a grocery list.
      </p>

      {/* Mode switch */}
      <div className="mt-6 inline-flex rounded-lg border border-stone-300 bg-white p-1">
        {(["individual", "couples"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={m === "couples" && profiles.length < 2}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold capitalize transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === m
                ? "bg-brand-600 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
            title={
              m === "couples" && profiles.length < 2
                ? "Add at least 2 profiles to use couples mode"
                : undefined
            }
          >
            {m}
          </button>
        ))}
      </div>

      {/* Shared options */}
      <OptionsPanel
        numDays={numDays}
        setNumDays={setNumDays}
        cuisine={cuisine}
        setCuisine={setCuisine}
        batchCooking={batchCooking}
        setBatchCooking={setBatchCooking}
        demo={demo}
        setDemo={setDemo}
        disabled={loadingKey !== null}
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mode === "individual" ? (
        <IndividualMode
          profiles={profiles}
          plans={plans}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          loadingKey={loadingKey}
          demo={demo}
          onGenerate={generateIndividual}
          onSaveFavorite={(meal, plan) =>
            addFavorite(meal, plan.profileName, plan.cuisine)
          }
          isFavoriteName={isFavoriteName}
        />
      ) : (
        <CouplesMode
          profiles={profiles}
          couplePlans={couplePlans}
          coupleA={coupleA}
          coupleB={coupleB}
          setCoupleA={setCoupleA}
          setCoupleB={setCoupleB}
          loadingKey={loadingKey}
          demo={demo}
          onGenerate={generateCouple}
          onSaveFavorite={(meal, plan) =>
            addFavorite(
              coupleMealToGenerated(meal),
              plan.profileNames.join(" & "),
              plan.cuisine,
            )
          }
          isFavoriteName={isFavoriteName}
        />
      )}
    </div>
  );
}

function coupleMealToGenerated(m: CoupleMeal): GeneratedMeal {
  const p = m.portions[0];
  return {
    mealType: m.mealType,
    name: m.name,
    description: m.description,
    calories: p?.calories ?? 0,
    protein: p?.protein ?? 0,
    carbs: p?.carbs ?? 0,
    fat: p?.fat ?? 0,
    prepMinutes: 0,
    instructions: m.instructions,
    ingredients: m.ingredients,
  };
}

// ---- Shared options panel ----

function OptionsPanel(props: {
  numDays: number;
  setNumDays: (n: number) => void;
  cuisine: string;
  setCuisine: (c: (typeof CUISINES)[number]["value"]) => void;
  batchCooking: boolean;
  setBatchCooking: (b: boolean) => void;
  demo: boolean;
  setDemo: (b: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <p className="text-sm font-semibold text-stone-700 mb-2">Plan length</p>
        <div className="flex flex-wrap gap-2">
          {PLAN_DURATIONS.map((d) => (
            <Pill
              key={d.value}
              active={props.numDays === d.value}
              disabled={props.disabled}
              onClick={() => props.setNumDays(d.value)}
            >
              {d.label}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-stone-700 mb-2">Cuisine</p>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <Pill
              key={c.value}
              active={props.cuisine === c.value}
              disabled={props.disabled}
              onClick={() => props.setCuisine(c.value)}
              title={c.note}
            >
              {c.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-100 pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={props.batchCooking}
            onChange={(e) => props.setBatchCooking(e.target.checked)}
            disabled={props.disabled}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm">
            <span className="font-medium text-stone-700">Batch cooking</span>
            <span className="block text-stone-500">
              Plan one evening cooking session that preps each day&apos;s
              breakfast, lunch, and dinner together.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={props.demo}
            onChange={(e) => props.setDemo(e.target.checked)}
            disabled={props.disabled}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm">
            <span className="font-medium text-stone-700">Demo mode</span>
            <span className="block text-stone-500">
              Show realistic sample meals — no API key needed. Turn off to
              generate with the Claude API.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

function Pill({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-800"
          : "border-stone-300 text-stone-700 hover:bg-stone-50"
      }`}
    >
      {children}
    </button>
  );
}

// ---- Individual mode ----

function IndividualMode({
  profiles,
  plans,
  selectedId,
  setSelectedId,
  loadingKey,
  demo,
  onGenerate,
  onSaveFavorite,
  isFavoriteName,
}: {
  profiles: Profile[];
  plans: Record<string, WeekPlan>;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  loadingKey: string | null;
  demo: boolean;
  onGenerate: (p: Profile) => void;
  onSaveFavorite: (meal: GeneratedMeal, plan: WeekPlan) => void;
  isFavoriteName: (name: string) => boolean;
}) {
  const selected = profiles.find((p) => p.id === selectedId) ?? null;
  const plan = selected ? plans[selected.id] : undefined;
  const goal = selected
    ? CALORIE_GOALS.find((g) => g.value === selected.calorieGoal)
    : undefined;
  const isLoading = selected ? loadingKey === selected.id : false;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {profiles.map((p) => (
          <Pill
            key={p.id}
            active={selectedId === p.id}
            onClick={() => setSelectedId(p.id)}
          >
            {p.name}
            {plans[p.id] && <span className="ml-2 text-xs text-brand-600">●</span>}
          </Pill>
        ))}
      </div>

      {selected && (
        <div className="mt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                {selected.name}
                {plan?.sample && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    Sample data
                  </span>
                )}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {goal?.label} ·{" "}
                <span className="font-mono">
                  {selected.targetCalories} kcal/day
                </span>
              </p>
            </div>
            <button
              onClick={() => onGenerate(selected)}
              disabled={isLoading}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              {isLoading
                ? "Generating…"
                : plan
                  ? "Regenerate"
                  : demo
                    ? "Generate sample plan"
                    : "Generate plan"}
            </button>
          </div>

          {isLoading && <LoadingCard name={selected.name} />}

          {!isLoading && plan && (
            <div className="mt-6">
              <WeekPlanView
                plan={plan}
                onSaveFavorite={(meal) => onSaveFavorite(meal, plan)}
                isFavorite={(meal) => isFavoriteName(meal.name)}
              />
              <PlanFooterLinks />
            </div>
          )}

          {!isLoading && !plan && <EmptyPlan name={selected.name} />}
        </div>
      )}
    </div>
  );
}

// ---- Couples mode ----

function CouplesMode({
  profiles,
  couplePlans,
  coupleA,
  coupleB,
  setCoupleA,
  setCoupleB,
  loadingKey,
  demo,
  onGenerate,
  onSaveFavorite,
  isFavoriteName,
}: {
  profiles: Profile[];
  couplePlans: Record<string, CouplePlan>;
  coupleA: string | null;
  coupleB: string | null;
  setCoupleA: (id: string) => void;
  setCoupleB: (id: string) => void;
  loadingKey: string | null;
  demo: boolean;
  onGenerate: (a: Profile, b: Profile) => void;
  onSaveFavorite: (meal: CoupleMeal, plan: CouplePlan) => void;
  isFavoriteName: (name: string) => boolean;
}) {
  const a = profiles.find((p) => p.id === coupleA) ?? null;
  const b = profiles.find((p) => p.id === coupleB) ?? null;
  const sameError = a && b && a.id === b.id;
  const key = a && b && !sameError ? coupleKey(a.id, b.id) : null;
  const plan = key ? couplePlans[key] : undefined;
  const isLoading = key ? loadingKey === key : false;

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-stone-600 mb-3">
          Both people eat the <span className="font-medium">same dish</span> each
          meal, portioned to each person&apos;s calorie goal — nutrient-dense and
          high in fiber, protein, and healthy fats.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <PersonSelect
            label="Person 1"
            value={coupleA}
            profiles={profiles}
            onChange={setCoupleA}
          />
          <PersonSelect
            label="Person 2"
            value={coupleB}
            profiles={profiles}
            onChange={setCoupleB}
          />
        </div>
        {sameError && (
          <p className="mt-3 text-sm text-red-600">
            Pick two different profiles.
          </p>
        )}
        <div className="mt-4">
          <button
            onClick={() => a && b && !sameError && onGenerate(a, b)}
            disabled={!a || !b || !!sameError || isLoading}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {isLoading
              ? "Generating…"
              : plan
                ? "Regenerate shared plan"
                : demo
                  ? "Generate sample shared plan"
                  : "Generate shared plan"}
          </button>
        </div>
      </div>

      {isLoading && <LoadingCard name={`${a?.name} & ${b?.name}`} />}

      {!isLoading && plan && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-stone-900">
              {plan.profileNames.join(" & ")}
            </h2>
            {plan.sample && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Sample data
              </span>
            )}
          </div>
          <CouplePlanView
            plan={plan}
            onSaveFavorite={(meal) => onSaveFavorite(meal, plan)}
            isFavorite={(meal) => isFavoriteName(meal.name)}
          />
          <PlanFooterLinks />
        </div>
      )}
    </div>
  );
}

function PersonSelect({
  label,
  value,
  profiles,
  onChange,
}: {
  label: string;
  value: string | null;
  profiles: Profile[];
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-1">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.targetCalories} kcal)
          </option>
        ))}
      </select>
    </div>
  );
}

// ---- Shared bits ----

function LoadingCard({ name }: { name: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-10 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="mt-4 font-medium text-stone-700">
        Building meals for {name}…
      </p>
      <p className="mt-1 text-sm text-stone-500">This can take a moment.</p>
    </div>
  );
}

function EmptyPlan({ name }: { name: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
      No plan yet for {name}. Hit{" "}
      <span className="font-semibold">Generate</span> to build one.
    </div>
  );
}

function PlanFooterLinks() {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <Link
        href="/favorites"
        className="rounded-lg border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
      >
        ♥ Favorites
      </Link>
      <Link
        href="/grocery-list"
        className="rounded-lg bg-stone-900 px-5 py-2.5 text-white font-semibold hover:bg-stone-800 transition-colors"
      >
        View grocery list →
      </Link>
    </div>
  );
}
