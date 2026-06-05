"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { buildGroceryList, CATEGORY_LABELS } from "@/lib/grocery";
import type { CouplePlan, WeekPlan } from "@/lib/types";

export default function GroceryListPage() {
  const { hydrated, profiles, plans, couplePlans } = useApp();
  // Which profile ids to include; default to all that have a plan.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const profilesWithPlans = useMemo(
    () => profiles.filter((p) => plans[p.id]),
    [profiles, plans],
  );

  const coupleList: CouplePlan[] = useMemo(
    () => Object.values(couplePlans),
    [couplePlans],
  );

  const includedPlans: WeekPlan[] = useMemo(
    () =>
      profilesWithPlans
        .filter((p) => !excluded.has(p.id))
        .map((p) => plans[p.id]),
    [profilesWithPlans, excluded, plans],
  );

  const grouped = useMemo(
    () => buildGroceryList(includedPlans, coupleList),
    [includedPlans, coupleList],
  );

  const totalItems = grouped.reduce((n, g) => n + g.items.length, 0);
  const hasAny = profilesWithPlans.length > 0 || coupleList.length > 0;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 text-stone-500">
        Loading…
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
        <div className="text-5xl" aria-hidden>
          🛒
        </div>
        <h1 className="mt-6 text-3xl font-bold text-stone-900">
          No grocery list yet
        </h1>
        <p className="mt-3 text-stone-600">
          Generate a meal plan first — your consolidated shopping list builds
          itself from the week&apos;s ingredients.
        </p>
        <Link
          href="/plan"
          className="mt-8 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors"
        >
          Go to meal plans
        </Link>
      </div>
    );
  }

  function downloadList() {
    const lines: string[] = ["NutriPlan — Grocery List"];
    const names = [
      ...includedPlans.map((p) => p.profileName),
      ...coupleList.map((c) => `${c.profileNames.join(" & ")} (couples)`),
    ].filter(Boolean);
    if (names.length) lines.push(`For: ${names.join(", ")}`);
    lines.push("");
    for (const group of grouped) {
      lines.push(CATEGORY_LABELS[group.category].toUpperCase());
      for (const item of group.items) {
        lines.push(`- [ ] ${item.name} — ${item.quantity} ${item.unit}`);
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nutriplan-grocery-list.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleProfile(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Grocery List</h1>
          <p className="mt-2 text-stone-600">
            Every ingredient for the week, consolidated and grouped by aisle.
            {totalItems > 0 && (
              <>
                {" "}
                <span className="font-medium text-stone-800">
                  {totalItems} items
                </span>
                .
              </>
            )}
          </p>
        </div>
        {totalItems > 0 && (
          <div className="no-print flex gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              🖨 Print
            </button>
            <button
              onClick={downloadList}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              ⬇ Download .txt
            </button>
          </div>
        )}
      </div>

      {/* Profile include toggles */}
      {profilesWithPlans.length > 1 && (
        <div className="no-print mt-6">
          <p className="text-sm font-semibold text-stone-700 mb-2">
            Include profiles
          </p>
          <div className="flex flex-wrap gap-2">
            {profilesWithPlans.map((p) => {
              const included = !excluded.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProfile(p.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    included
                      ? "border-brand-500 bg-brand-50 text-brand-800"
                      : "border-stone-300 text-stone-400 hover:bg-stone-50"
                  }`}
                >
                  {included ? "✓ " : ""}
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {totalItems === 0 ? (
        <p className="mt-8 text-stone-500">
          No items — select at least one profile above.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                {CATEGORY_LABELS[group.category]}
              </h2>
              <ul className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
                {group.items.map((item) => {
                  const key = `${group.category}:${item.name}:${item.unit}`;
                  const isChecked = checked.has(key);
                  return (
                    <li key={key}>
                      <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(key)}
                          className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span
                          className={`flex-1 ${
                            isChecked
                              ? "line-through text-stone-400"
                              : "text-stone-800"
                          }`}
                        >
                          {item.name}
                        </span>
                        <span
                          className={`font-mono text-sm ${
                            isChecked ? "text-stone-300" : "text-stone-500"
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
