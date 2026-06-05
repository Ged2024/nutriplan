"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WeekPlanView from "@/components/WeekPlanView";
import { useApp } from "@/lib/store";
import { CALORIE_GOALS, PLAN_DURATIONS } from "@/lib/constants";
import type { Profile, WeekPlan } from "@/lib/types";

export default function PlanPage() {
  const { hydrated, profiles, plans, setPlan } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [numDays, setNumDays] = useState<number>(7);
  // Demo mode on by default so the app works visually without an API key.
  const [demo, setDemo] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default the selection to the first profile once loaded.
  useEffect(() => {
    if (hydrated && !selectedId && profiles.length > 0) {
      setSelectedId(profiles[0].id);
    }
  }, [hydrated, profiles, selectedId]);

  const selected = profiles.find((p) => p.id === selectedId) ?? null;
  const plan = selected ? plans[selected.id] : undefined;

  async function generate(profile: Profile) {
    setError(null);
    setLoadingId(profile.id);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, days: numDays, demo }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate plan.");
      }
      setPlan(profile.id, data.plan as WeekPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoadingId(null);
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

  const goal = selected
    ? CALORIE_GOALS.find((g) => g.value === selected.calorieGoal)
    : undefined;
  const isLoading = selected ? loadingId === selected.id : false;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-stone-900">Weekly Meal Plan</h1>
      <p className="mt-2 text-stone-600">
        Pick a profile and generate a 7-day, whole-foods plan tailored to them.
      </p>

      {/* Profile selector */}
      <div className="mt-6 flex flex-wrap gap-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedId === p.id
                ? "border-brand-500 bg-brand-50 text-brand-800"
                : "border-stone-300 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {p.name}
            {plans[p.id] && (
              <span className="ml-2 text-xs text-brand-600" title="Has a plan">
                ●
              </span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
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
                  {plan && (
                    <>
                      {" · "}
                      <span className="text-stone-400">
                        {plan.days.length}-day plan, generated{" "}
                        {new Date(plan.generatedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => generate(selected)}
                disabled={isLoading}
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Generating…"
                  : plan
                    ? "Regenerate plan"
                    : demo
                      ? "Generate sample plan"
                      : "Generate plan"}
              </button>
            </div>

            {/* Duration selector */}
            <div className="mt-4 border-t border-stone-100 pt-4">
              <p className="text-sm font-semibold text-stone-700 mb-2">
                Plan length
              </p>
              <div className="flex flex-wrap gap-2">
                {PLAN_DURATIONS.map((d) => {
                  const active = numDays === d.value;
                  return (
                    <button
                      key={d.value}
                      onClick={() => setNumDays(d.value)}
                      disabled={isLoading}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                        active
                          ? "border-brand-500 bg-brand-50 text-brand-800"
                          : "border-stone-300 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>

              {/* Demo mode toggle */}
              <label className="mt-4 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={demo}
                  onChange={(e) => setDemo(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm">
                  <span className="font-medium text-stone-700">
                    Demo mode
                  </span>
                  <span className="block text-stone-500">
                    Show realistic sample meals — no API key needed. Turn off to
                    generate with the Claude API.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
              <p className="mt-4 font-medium text-stone-700">
                Building a week of meals for {selected.name}…
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Tailoring {numDays * 4} meals across {numDays}{" "}
                {numDays === 1 ? "day" : "days"} — this can take a moment.
              </p>
            </div>
          )}

          {!isLoading && plan && (
            <div className="mt-6">
              <WeekPlanView plan={plan} />
              <div className="mt-6 flex justify-end">
                <Link
                  href="/grocery-list"
                  className="rounded-lg bg-stone-900 px-5 py-2.5 text-white font-semibold hover:bg-stone-800 transition-colors"
                >
                  View grocery list →
                </Link>
              </div>
            </div>
          )}

          {!isLoading && !plan && (
            <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
              No plan yet for {selected.name}. Hit{" "}
              <span className="font-semibold">Generate plan</span> to build one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
