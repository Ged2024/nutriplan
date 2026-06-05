import type {
  CalorieGoal,
  DietaryPreference,
  HealthCondition,
} from "./types";

/** Display metadata for each selectable option, used across forms and summaries. */

export const HEALTH_CONDITIONS: {
  value: HealthCondition;
  label: string;
  note: string;
}[] = [
  {
    value: "hypertension",
    label: "Hypertension",
    note: "Low-sodium, potassium-rich, DASH-friendly meals.",
  },
  {
    value: "diabetes",
    label: "Diabetes",
    note: "Lower glycemic load, high-fiber, controlled carbs.",
  },
  {
    value: "high_cholesterol",
    label: "High Cholesterol",
    note: "Low saturated fat, heart-healthy fats and soluble fiber.",
  },
];

export const DIETARY_PREFERENCES: {
  value: DietaryPreference;
  label: string;
}[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "gluten_free", label: "Gluten-Free" },
  { value: "dairy_free", label: "Dairy-Free" },
  { value: "nut_free", label: "Nut-Free" },
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
