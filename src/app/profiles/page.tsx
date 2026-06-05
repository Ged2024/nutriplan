"use client";

import { useState } from "react";
import Link from "next/link";
import ProfileForm, { type ProfileFormValues } from "@/components/ProfileForm";
import { useApp } from "@/lib/store";
import {
  CALORIE_GOALS,
  DIETARY_PREFERENCES,
  HEALTH_CONDITIONS,
} from "@/lib/constants";
import type { Profile } from "@/lib/types";

function summarize<T extends string>(
  values: T[],
  table: { value: T; label: string }[],
  empty: string,
): string {
  if (values.length === 0) return empty;
  return values
    .map((v) => table.find((t) => t.value === v)?.label ?? v)
    .join(", ");
}

export default function ProfilesPage() {
  const { hydrated, profiles, addProfile, updateProfile, removeProfile } =
    useApp();
  // null = no form open; "new" = adding; otherwise the id being edited.
  const [editing, setEditing] = useState<string | "new" | null>(null);

  function handleSave(values: ProfileFormValues) {
    if (editing && editing !== "new") {
      updateProfile(editing, values);
    } else {
      addProfile(values);
    }
    setEditing(null);
  }

  const editingProfile =
    editing && editing !== "new"
      ? profiles.find((p) => p.id === editing)
      : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Profiles</h1>
          <p className="mt-2 text-stone-600">
            Add a profile for everyone you&apos;re planning for — yourself,
            family members, anyone. Each gets meals tailored to their health
            conditions and calorie goal.
          </p>
        </div>
        {editing === null && (
          <button
            onClick={() => setEditing("new")}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            + Add profile
          </button>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {/* Add form */}
        {editing === "new" && (
          <ProfileForm onSave={handleSave} onCancel={() => setEditing(null)} />
        )}

        {!hydrated && (
          <p className="text-stone-500">Loading profiles…</p>
        )}

        {hydrated && profiles.length === 0 && editing === null && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <div className="text-4xl" aria-hidden>
              👤
            </div>
            <h2 className="mt-4 font-semibold text-stone-900">
              No profiles yet
            </h2>
            <p className="mt-2 text-stone-600">
              Add your first profile to start generating meal plans.
            </p>
            <button
              onClick={() => setEditing("new")}
              className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-white font-semibold hover:bg-brand-700 transition-colors"
            >
              + Add profile
            </button>
          </div>
        )}

        {hydrated &&
          profiles.map((profile) =>
            editing === profile.id ? (
              <ProfileForm
                key={profile.id}
                initial={editingProfile}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={() => setEditing(profile.id)}
                onDelete={() => {
                  if (
                    confirm(`Delete profile "${profile.name}"? This also removes its saved plan.`)
                  ) {
                    removeProfile(profile.id);
                  }
                }}
              />
            ),
          )}
      </div>

      {hydrated && profiles.length > 0 && editing === null && (
        <div className="mt-8 flex justify-end">
          <Link
            href="/plan"
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-white font-semibold hover:bg-stone-800 transition-colors"
          >
            Go to meal plans →
          </Link>
        </div>
      )}
    </div>
  );
}

function ProfileCard({
  profile,
  onEdit,
  onDelete,
}: {
  profile: Profile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const goal = CALORIE_GOALS.find((g) => g.value === profile.calorieGoal);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">{profile.name}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {goal?.label ?? profile.calorieGoal} ·{" "}
            <span className="font-mono">{profile.targetCalories} kcal/day</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-stone-500">Health conditions</dt>
          <dd className="text-stone-800">
            {summarize(profile.healthConditions, HEALTH_CONDITIONS, "None")}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Dietary preferences</dt>
          <dd className="text-stone-800">
            {summarize(profile.dietaryPreferences, DIETARY_PREFERENCES, "None")}
          </dd>
        </div>
      </dl>
    </div>
  );
}
