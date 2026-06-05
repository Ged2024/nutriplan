// Core domain model for NutriPlan.

export type Gender = "male" | "female" | "other";

export type HealthCondition =
  // Full diagnoses
  | "hypertension"
  | "diabetes"
  | "high_cholesterol"
  // Borderline / pre-conditions
  | "elevated_blood_pressure"
  | "prediabetes"
  | "borderline_high_cholesterol";

export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "carnivore"
  | "omnivore"
  | "gluten_free"
  | "dairy_free"
  | "nut_free";

export type CalorieGoal = "cutting" | "maintenance" | "bulking";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type Cuisine =
  | "filipino"
  | "korean"
  | "japanese"
  | "western"
  | "mixed";

export type GroceryCategory =
  | "produce"
  | "protein"
  | "dairy"
  | "grains"
  | "pantry"
  | "frozen"
  | "other";

/** A single person's settings that drive plan generation. */
export interface Profile {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  healthConditions: HealthCondition[];
  dietaryPreferences: DietaryPreference[];
  calorieGoal: CalorieGoal;
  /** Daily calorie target in kcal. */
  targetCalories: number;
}

/** Options that shape a generation run (individual or couples). */
export interface GenerationOptions {
  days: number;
  cuisine: Cuisine;
  batchCooking: boolean;
}

/** A grocery ingredient with an amount, used in meals and the shopping list. */
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
}

/** A single meal generated for one slot of a day. */
export interface GeneratedMeal {
  mealType: MealType;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepMinutes: number;
  /** Step-by-step cooking instructions. */
  instructions: string[];
  ingredients: Ingredient[];
}

/** One day of an individual plan. */
export interface DayPlan {
  day: number;
  meals: GeneratedMeal[];
  totalCalories: number;
  /** Evening batch-cooking session note (empty unless batch mode is on). */
  batchPrep?: string;
}

/** A full plan for a single profile. */
export interface WeekPlan {
  profileId: string;
  profileName: string;
  calorieGoal: CalorieGoal;
  targetCalories: number;
  cuisine: Cuisine;
  batchCooking: boolean;
  generatedAt: string;
  sample?: boolean;
  days: DayPlan[];
}

// ---- Couples mode ----

/** One person's portion of a shared couples dish. */
export interface CouplePortion {
  profileId: string;
  profileName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Plain-language portion guidance, e.g. "1.5 cups rice, 6 oz chicken". */
  portion: string;
}

/** A shared dish in couples mode, served at two portion sizes. */
export interface CoupleMeal {
  mealType: MealType;
  name: string;
  description: string;
  instructions: string[];
  ingredients: Ingredient[];
  portions: CouplePortion[];
}

export interface CoupleDayPlan {
  day: number;
  meals: CoupleMeal[];
  batchPrep?: string;
}

/** A shared plan for two profiles eating the same dishes at different portions. */
export interface CouplePlan {
  profileIds: [string, string];
  profileNames: [string, string];
  cuisine: Cuisine;
  batchCooking: boolean;
  generatedAt: string;
  sample?: boolean;
  days: CoupleDayPlan[];
}

// ---- Favorites ----

/** A meal the user saved to revisit later. */
export interface SavedMeal {
  id: string;
  savedAt: string;
  sourceName?: string;
  cuisine?: Cuisine;
  meal: GeneratedMeal;
}

/** One line in the consolidated grocery list. */
export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: GroceryCategory;
}
