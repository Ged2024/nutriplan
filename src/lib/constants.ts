import type {
  CalorieGoal,
  Cuisine,
  DietaryPreference,
  Gender,
  HealthCondition,
} from "./types";

/** Display metadata for each selectable option, used across forms and summaries. */

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const HEALTH_CONDITIONS: {
  value: HealthCondition;
  label: string;
  note: string;
  /** Whether this is a borderline / pre-condition (vs a full diagnosis). */
  borderline?: boolean;
}[] = [
  {
    value: "hypertension",
    label: "Hypertension",
    note: "Low-sodium, potassium-rich, DASH-friendly meals.",
  },
  {
    value: "elevated_blood_pressure",
    label: "Slightly Elevated Blood Pressure",
    note: "Gently lower sodium; emphasize potassium and whole foods.",
    borderline: true,
  },
  {
    value: "diabetes",
    label: "Diabetes",
    note: "Lower glycemic load, high-fiber, controlled carbs.",
  },
  {
    value: "prediabetes",
    label: "Pre-diabetic",
    note: "Balanced carbs and fiber to keep blood sugar steady.",
    borderline: true,
  },
  {
    value: "high_cholesterol",
    label: "High Cholesterol",
    note: "Low saturated fat, heart-healthy fats and soluble fiber.",
  },
  {
    value: "borderline_high_cholesterol",
    label: "Borderline High Cholesterol",
    note: "Favor unsaturated fats and soluble fiber preventively.",
    borderline: true,
  },
];

export const DIETARY_PREFERENCES: {
  value: DietaryPreference;
  label: string;
  description: string;
}[] = [
  {
    value: "omnivore",
    label: "Omnivore",
    description: "Eats everything — no restrictions.",
  },
  {
    value: "vegetarian",
    label: "Vegetarian",
    description: "No meat, poultry, or fish.",
  },
  {
    value: "vegan",
    label: "Vegan",
    description: "No animal products at all — no meat, dairy, eggs, or honey.",
  },
  {
    value: "pescatarian",
    label: "Pescatarian",
    description: "No meat or poultry; fish and seafood are fine.",
  },
  {
    value: "carnivore",
    label: "Carnivore",
    description: "Animal foods only — meat, fish, eggs; minimal plants.",
  },
  {
    value: "gluten_free",
    label: "Gluten-Free",
    description: "No wheat, barley, or rye.",
  },
  {
    value: "dairy_free",
    label: "Dairy-Free",
    description: "No milk, cheese, butter, yogurt, or cream.",
  },
  {
    value: "nut_free",
    label: "Nut-Free",
    description: "No tree nuts or peanuts.",
  },
];

export const CALORIE_GOALS: {
  value: CalorieGoal;
  label: string;
  note: string;
  defaultCalories: number;
}[] = [
  {
    value: "cutting",
    label: "Cutting",
    note: "Calorie deficit for fat loss.",
    defaultCalories: 1800,
  },
  {
    value: "maintenance",
    label: "Maintenance",
    note: "Steady weight, balanced energy.",
    defaultCalories: 2200,
  },
  {
    value: "bulking",
    label: "Bulking",
    note: "Calorie surplus for muscle gain.",
    defaultCalories: 2800,
  },
];

export const CUISINES: { value: Cuisine; label: string; note: string }[] = [
  { value: "mixed", label: "Mixed", note: "A variety of styles across the week." },
  { value: "filipino", label: "Filipino", note: "Rice-based ulam, adobo, sinigang, etc." },
  { value: "korean", label: "Korean", note: "Banchan, bibimbap, stews, grilled meats." },
  { value: "japanese", label: "Japanese", note: "Donburi, fish, miso, light and clean." },
  { value: "western", label: "Western", note: "European/American home cooking." },
];

/** Share of daily calories allotted to each meal slot. */
export const MEAL_CALORIE_SPLIT = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.3,
  snack: 0.15,
} as const;

/** Plan-length options offered on the generation page. */
export const PLAN_DURATIONS: { value: number; label: string }[] = [
  { value: 1, label: "1 day" },
  { value: 3, label: "3 days" },
  { value: 5, label: "5 days" },
  { value: 7, label: "1 week" },
  { value: 14, label: "2 weeks" },
];

export const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
