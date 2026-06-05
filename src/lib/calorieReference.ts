import type { CalorieGoal, Gender } from "./types";

/**
 * Recommended daily energy estimates from two reference systems:
 *  - RENI: Philippine Recommended Energy & Nutrient Intakes (FNRI).
 *  - Global: WHO/FAO and US Dietary Reference Intakes (DRI) equivalents.
 *
 * Values are approximate maintenance energy for a moderately active person of
 * the given sex and age, then adjusted for the calorie goal. These are guidance
 * estimates, not a clinical prescription — they don't account for height,
 * weight, or exact activity level.
 */

export interface CalorieRange {
  /** Reference maintenance energy (kcal/day). */
  maintenance: number;
  /** Goal-adjusted recommended lower bound. */
  min: number;
  /** Goal-adjusted recommended upper bound. */
  max: number;
}

export interface CalorieReference {
  reni: CalorieRange;
  global: CalorieRange;
}

// Maintenance energy (kcal/day), moderately active. Index by age band.
// RENI (FNRI, Philippines) — reflects smaller average body sizes.
const RENI_BANDS = [
  { min: 13, max: 18, male: 2870, female: 2240 },
  { min: 19, max: 29, male: 2530, female: 1870 },
  { min: 30, max: 49, male: 2420, female: 1800 },
  { min: 50, max: 64, male: 2250, female: 1760 },
  { min: 65, max: 200, male: 1990, female: 1660 },
];

// Global (US DRI / WHO-FAO), moderately active.
const GLOBAL_BANDS = [
  { min: 13, max: 18, male: 2800, female: 2050 },
  { min: 19, max: 30, male: 2700, female: 2050 },
  { min: 31, max: 50, male: 2500, female: 1950 },
  { min: 51, max: 70, male: 2300, female: 1800 },
  { min: 71, max: 200, male: 2100, female: 1700 },
];

const GOAL_ADJUST: Record<CalorieGoal, number> = {
  cutting: -500,
  maintenance: 0,
  bulking: 400,
};

// Minimum safe daily target by sex (avoid recommending unsafe deficits).
const SAFE_FLOOR: Record<Gender, number> = {
  male: 1500,
  female: 1200,
  other: 1350,
};

function maintenanceFor(
  bands: { min: number; max: number; male: number; female: number }[],
  gender: Gender,
  age: number,
): number {
  const a = Number.isFinite(age) ? Math.max(13, age) : 30;
  const band = bands.find((b) => a >= b.min && a <= b.max) ?? bands[1];
  if (gender === "male") return band.male;
  if (gender === "female") return band.female;
  return Math.round((band.male + band.female) / 2);
}

function rangeFor(
  maintenance: number,
  gender: Gender,
  goal: CalorieGoal,
): CalorieRange {
  const target = maintenance + GOAL_ADJUST[goal];
  const floor = SAFE_FLOOR[gender];
  const center = Math.max(floor, target);
  return {
    maintenance,
    min: Math.max(floor, center - 150),
    max: center + 150,
  };
}

export function getCalorieReference(
  gender: Gender,
  age: number,
  goal: CalorieGoal,
): CalorieReference {
  return {
    reni: rangeFor(maintenanceFor(RENI_BANDS, gender, age), gender, goal),
    global: rangeFor(maintenanceFor(GLOBAL_BANDS, gender, age), gender, goal),
  };
}

/** A single suggested target — midpoint of the goal-adjusted range. */
export function suggestedTarget(range: CalorieRange): number {
  return Math.round((range.min + range.max) / 2 / 10) * 10;
}
