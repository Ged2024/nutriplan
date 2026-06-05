"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Profile, WeekPlan } from "./types";

const PROFILES_KEY = "nutriplan.profiles";
const PLANS_KEY = "nutriplan.plans";

interface AppState {
  /** False until localStorage has been read (avoids SSR/client mismatch). */
  hydrated: boolean;
  profiles: Profile[];
  /** Generated plans keyed by profile id. */
  plans: Record<string, WeekPlan>;
  addProfile: (profile: Omit<Profile, "id">) => Profile;
  updateProfile: (id: string, patch: Partial<Omit<Profile, "id">>) => void;
  removeProfile: (id: string) => void;
  setPlan: (profileId: string, plan: WeekPlan) => void;
  removePlan: (profileId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<Record<string, WeekPlan>>({});

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    setProfiles(readJSON<Profile[]>(PROFILES_KEY, []));
    setPlans(readJSON<Record<string, WeekPlan>>(PLANS_KEY, {}));
    setHydrated(true);
  }, []);

  // Persist on change (only after hydration to avoid clobbering stored data).
  useEffect(() => {
    if (hydrated) localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }, [plans, hydrated]);

  const addProfile = useCallback((profile: Omit<Profile, "id">) => {
    const created: Profile = { ...profile, id: makeId() };
    setProfiles((prev) => [...prev, created]);
    return created;
  }, []);

  const updateProfile = useCallback(
    (id: string, patch: Partial<Omit<Profile, "id">>) => {
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  const removeProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setPlans((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setPlan = useCallback((profileId: string, plan: WeekPlan) => {
    setPlans((prev) => ({ ...prev, [profileId]: plan }));
  }, []);

  const removePlan = useCallback((profileId: string) => {
    setPlans((prev) => {
      const next = { ...prev };
      delete next[profileId];
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        hydrated,
        profiles,
        plans,
        addProfile,
        updateProfile,
        removeProfile,
        setPlan,
        removePlan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
