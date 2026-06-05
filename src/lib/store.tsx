"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  CouplePlan,
  Cuisine,
  GeneratedMeal,
  Profile,
  SavedMeal,
  WeekPlan,
} from "./types";

const PROFILES_KEY = "nutriplan.profiles";
const PLANS_KEY = "nutriplan.plans";
const COUPLE_PLANS_KEY = "nutriplan.couplePlans";
const FAVORITES_KEY = "nutriplan.favorites";

/** Stable key for a couple plan, order-independent. */
export function coupleKey(idA: string, idB: string): string {
  return [idA, idB].sort().join("+");
}

interface AppState {
  /** False until localStorage has been read (avoids SSR/client mismatch). */
  hydrated: boolean;
  profiles: Profile[];
  /** Generated plans keyed by profile id. */
  plans: Record<string, WeekPlan>;
  /** Couple plans keyed by coupleKey(idA, idB). */
  couplePlans: Record<string, CouplePlan>;
  /** Saved favorite meals. */
  favorites: SavedMeal[];
  addProfile: (profile: Omit<Profile, "id">) => Profile;
  updateProfile: (id: string, patch: Partial<Omit<Profile, "id">>) => void;
  removeProfile: (id: string) => void;
  setPlan: (profileId: string, plan: WeekPlan) => void;
  removePlan: (profileId: string) => void;
  setCouplePlan: (key: string, plan: CouplePlan) => void;
  removeCouplePlan: (key: string) => void;
  addFavorite: (
    meal: GeneratedMeal,
    sourceName?: string,
    cuisine?: Cuisine,
  ) => void;
  removeFavorite: (id: string) => void;
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
  const [couplePlans, setCouplePlans] = useState<Record<string, CouplePlan>>(
    {},
  );
  const [favorites, setFavorites] = useState<SavedMeal[]>([]);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    // Migrate older profiles that predate gender/age.
    const loaded = readJSON<Partial<Profile>[]>(PROFILES_KEY, []).map(
      (p) => ({ ...p, gender: p.gender ?? "other", age: p.age ?? 30 }) as Profile,
    );
    setProfiles(loaded);
    setPlans(readJSON<Record<string, WeekPlan>>(PLANS_KEY, {}));
    setCouplePlans(
      readJSON<Record<string, CouplePlan>>(COUPLE_PLANS_KEY, {}),
    );
    setFavorites(readJSON<SavedMeal[]>(FAVORITES_KEY, []));
    setHydrated(true);
  }, []);

  // Persist on change (only after hydration to avoid clobbering stored data).
  useEffect(() => {
    if (hydrated) localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }, [plans, hydrated]);

  useEffect(() => {
    if (hydrated)
      localStorage.setItem(COUPLE_PLANS_KEY, JSON.stringify(couplePlans));
  }, [couplePlans, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites, hydrated]);

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

  const setCouplePlan = useCallback((key: string, plan: CouplePlan) => {
    setCouplePlans((prev) => ({ ...prev, [key]: plan }));
  }, []);

  const removeCouplePlan = useCallback((key: string) => {
    setCouplePlans((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const addFavorite = useCallback(
    (meal: GeneratedMeal, sourceName?: string, cuisine?: Cuisine) => {
      setFavorites((prev) => {
        // Avoid duplicates by meal name + source.
        if (
          prev.some(
            (f) => f.meal.name === meal.name && f.sourceName === sourceName,
          )
        ) {
          return prev;
        }
        const saved: SavedMeal = {
          id: makeId(),
          savedAt: new Date().toISOString(),
          sourceName,
          cuisine,
          meal,
        };
        return [saved, ...prev];
      });
    },
    [],
  );

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        hydrated,
        profiles,
        plans,
        couplePlans,
        favorites,
        addProfile,
        updateProfile,
        removeProfile,
        setPlan,
        removePlan,
        setCouplePlan,
        removeCouplePlan,
        addFavorite,
        removeFavorite,
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
