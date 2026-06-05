import Link from "next/link";
import { CALORIE_GOALS, HEALTH_CONDITIONS } from "@/lib/constants";

const FEATURES = [
  {
    icon: "🩺",
    title: "Health-aware",
    body: "Plans adapt to hypertension, diabetes, and high cholesterol with the right sodium, fiber, and fat profiles.",
  },
  {
    icon: "🎯",
    title: "Goal-driven calories",
    body: "Set cutting, maintenance, or bulking targets per person — meals are scaled to hit them.",
  },
  {
    icon: "🥦",
    title: "Whole foods first",
    body: "Balanced breakfast, lunch, dinner, and snacks built from real, minimally processed ingredients.",
  },
  {
    icon: "🛒",
    title: "One grocery list",
    body: "Every ingredient for the week is consolidated and grouped by aisle — shop once.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Set up profiles",
    body: "Add a profile for everyone you cook for — you, family, anyone — with their health conditions, dietary preferences, and a calorie goal.",
  },
  {
    n: 2,
    title: "Generate your plan",
    body: "Choose 1 day up to 2 weeks and get meals with recipes — calories tallied per meal and per day.",
  },
  {
    n: 3,
    title: "Shop & cook",
    body: "Use the consolidated grocery list to shop for the whole week in one trip.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 text-brand-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Whole-foods meal planning
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
              Eat for your health goals —{" "}
              <span className="text-brand-600">without the guesswork.</span>
            </h1>
            <p className="mt-5 text-lg text-stone-600">
              NutriPlan builds personalized meal plans around your health
              conditions, dietary preferences, and calorie goals. Add a profile
              for everyone you cook for — balanced whole-food meals with recipes,
              calories counted, and a single grocery list.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/profiles"
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-brand-700 transition-colors"
              >
                Set up profiles
              </Link>
              <Link
                href="/plan"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-stone-800 font-semibold border border-stone-300 hover:bg-stone-50 transition-colors"
              >
                View meal plan
              </Link>
            </div>
            <p className="mt-4 text-sm text-stone-500">
              Supports{" "}
              {HEALTH_CONDITIONS.map((c) => c.label).join(", ")} · cutting,
              maintenance &amp; bulking
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl" aria-hidden>
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">{f.title}</h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-stone-900 text-center">
          How it works
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-lg">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Goals strip */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-stone-900 px-6 sm:px-10 py-10 text-white">
          <h2 className="text-2xl font-bold">Built around your goal</h2>
          <p className="mt-2 text-stone-300">
            Pick a goal per person and we scale every meal to match.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {CALORIE_GOALS.map((g) => (
              <div
                key={g.value}
                className="rounded-xl bg-stone-800 p-5 border border-stone-700"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{g.label}</h3>
                  <span className="text-brand-400 font-mono text-sm">
                    ~{g.defaultCalories} kcal
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-400">{g.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/profiles"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-white font-semibold hover:bg-brand-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
