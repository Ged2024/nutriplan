import type {
  CoupleDayPlan,
  CoupleMeal,
  CouplePlan,
  DietaryPreference,
  GeneratedMeal,
  GenerationOptions,
  Ingredient,
  MealType,
  Profile,
  WeekPlan,
} from "./types";
import { MEAL_CALORIE_SPLIT } from "./constants";

/**
 * Deterministic, realistic sample meal plans for demo/preview mode — no API
 * key or network call required. Meals are tagged with the dietary preferences
 * they satisfy, filtered to the profile, then lightly scaled to hit the
 * calorie target so the numbers look believable.
 */

interface SampleMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepMinutes: number;
  ingredients: Ingredient[];
  /** Dietary preferences this meal satisfies (must cover the profile's set). */
  tags: DietaryPreference[];
}

// Convenience: a meal suitable for every preference we support.
const ALL: DietaryPreference[] = [
  "vegetarian",
  "vegan",
  "pescatarian",
  "gluten_free",
  "dairy_free",
  "nut_free",
];

const i = (
  name: string,
  quantity: number,
  unit: string,
  category: Ingredient["category"],
): Ingredient => ({ name, quantity, unit, category });

const BREAKFASTS: SampleMeal[] = [
  {
    name: "Veggie Oatmeal Bowl",
    description: "Rolled oats with banana, blueberries, chia, and cinnamon.",
    calories: 350,
    protein: 10,
    carbs: 62,
    fat: 7,
    prepMinutes: 10,
    tags: ALL,
    ingredients: [
      i("Rolled oats", 0.5, "cup", "grains"),
      i("Banana", 1, "whole", "produce"),
      i("Blueberries", 0.5, "cup", "produce"),
      i("Chia seeds", 1, "tbsp", "pantry"),
      i("Oat milk", 1, "cup", "other"),
    ],
  },
  {
    name: "Tofu Veggie Scramble",
    description: "Soft tofu scrambled with spinach, mushrooms, and turmeric.",
    calories: 300,
    protein: 20,
    carbs: 14,
    fat: 18,
    prepMinutes: 15,
    tags: ALL,
    ingredients: [
      i("Firm tofu", 6, "oz", "protein"),
      i("Spinach", 1, "cup", "produce"),
      i("Mushrooms", 0.5, "cup", "produce"),
      i("Olive oil", 1, "tbsp", "pantry"),
      i("Turmeric", 0.5, "tsp", "pantry"),
    ],
  },
  {
    name: "Berry Green Smoothie",
    description: "Banana, mixed berries, spinach, flaxseed, and oat milk.",
    calories: 280,
    protein: 8,
    carbs: 52,
    fat: 5,
    prepMinutes: 5,
    tags: ALL,
    ingredients: [
      i("Banana", 1, "whole", "produce"),
      i("Mixed berries", 1, "cup", "frozen"),
      i("Spinach", 1, "cup", "produce"),
      i("Ground flaxseed", 1, "tbsp", "pantry"),
      i("Oat milk", 1, "cup", "other"),
    ],
  },
  {
    name: "Greek Yogurt Parfait",
    description: "Greek yogurt layered with berries and toasted oats.",
    calories: 320,
    protein: 22,
    carbs: 40,
    fat: 8,
    prepMinutes: 5,
    tags: ["carnivore", "vegetarian", "pescatarian", "nut_free"],
    ingredients: [
      i("Greek yogurt", 1, "cup", "dairy"),
      i("Strawberries", 0.5, "cup", "produce"),
      i("Rolled oats", 0.25, "cup", "grains"),
      i("Honey", 1, "tsp", "pantry"),
    ],
  },
  {
    name: "Avocado Toast with Egg",
    description: "Whole-grain toast topped with smashed avocado and a poached egg.",
    calories: 380,
    protein: 16,
    carbs: 34,
    fat: 21,
    prepMinutes: 12,
    tags: ["vegetarian", "pescatarian", "dairy_free", "nut_free"],
    ingredients: [
      i("Whole-grain bread", 2, "slice", "grains"),
      i("Avocado", 0.5, "whole", "produce"),
      i("Egg", 1, "whole", "protein"),
      i("Chili flakes", 0.25, "tsp", "pantry"),
    ],
  },
  {
    name: "Smoked Salmon Toast",
    description: "Rye toast with smoked salmon, cucumber, and dill.",
    calories: 360,
    protein: 24,
    carbs: 30,
    fat: 14,
    prepMinutes: 8,
    tags: ["carnivore", "pescatarian", "dairy_free", "nut_free"],
    ingredients: [
      i("Rye bread", 2, "slice", "grains"),
      i("Smoked salmon", 3, "oz", "protein"),
      i("Cucumber", 0.5, "whole", "produce"),
      i("Fresh dill", 1, "tbsp", "produce"),
    ],
  },
];

const LUNCHES: SampleMeal[] = [
  {
    name: "Quinoa Chickpea Salad",
    description: "Quinoa with chickpeas, cucumber, tomato, lemon, and olive oil.",
    calories: 450,
    protein: 16,
    carbs: 60,
    fat: 16,
    prepMinutes: 15,
    tags: ALL,
    ingredients: [
      i("Quinoa", 0.75, "cup", "grains"),
      i("Chickpeas", 0.5, "cup", "protein"),
      i("Cucumber", 0.5, "whole", "produce"),
      i("Cherry tomatoes", 0.5, "cup", "produce"),
      i("Olive oil", 1, "tbsp", "pantry"),
      i("Lemon", 0.5, "whole", "produce"),
    ],
  },
  {
    name: "Lentil & Kale Soup",
    description: "Hearty lentils simmered with carrots, celery, and kale.",
    calories: 400,
    protein: 18,
    carbs: 58,
    fat: 8,
    prepMinutes: 30,
    tags: ALL,
    ingredients: [
      i("Green lentils", 0.75, "cup", "protein"),
      i("Carrot", 1, "whole", "produce"),
      i("Celery", 2, "stalk", "produce"),
      i("Kale", 1, "cup", "produce"),
      i("Vegetable broth", 2, "cup", "pantry"),
    ],
  },
  {
    name: "Black Bean Sweet Potato Bowl",
    description: "Brown rice with black beans, roasted sweet potato, and avocado.",
    calories: 470,
    protein: 15,
    carbs: 72,
    fat: 14,
    prepMinutes: 25,
    tags: ALL,
    ingredients: [
      i("Brown rice", 0.75, "cup", "grains"),
      i("Black beans", 0.5, "cup", "protein"),
      i("Sweet potato", 1, "whole", "produce"),
      i("Avocado", 0.5, "whole", "produce"),
      i("Salsa", 2, "tbsp", "pantry"),
    ],
  },
  {
    name: "Grilled Chicken Veg Bowl",
    description: "Grilled chicken breast over brown rice with steamed broccoli.",
    calories: 520,
    protein: 42,
    carbs: 50,
    fat: 14,
    prepMinutes: 25,
    tags: ["carnivore", "gluten_free", "dairy_free", "nut_free"],
    ingredients: [
      i("Chicken breast", 5, "oz", "protein"),
      i("Brown rice", 0.75, "cup", "grains"),
      i("Broccoli", 1, "cup", "produce"),
      i("Olive oil", 1, "tbsp", "pantry"),
    ],
  },
  {
    name: "Tuna Niçoise Salad",
    description: "Tuna with green beans, potato, olives, and a soft egg.",
    calories: 430,
    protein: 34,
    carbs: 32,
    fat: 18,
    prepMinutes: 20,
    tags: ["carnivore", "pescatarian", "gluten_free", "dairy_free", "nut_free"],
    ingredients: [
      i("Canned tuna", 4, "oz", "protein"),
      i("Green beans", 1, "cup", "produce"),
      i("Baby potatoes", 4, "whole", "produce"),
      i("Kalamata olives", 8, "whole", "pantry"),
      i("Egg", 1, "whole", "protein"),
    ],
  },
  {
    name: "Turkey Hummus Wrap",
    description: "Whole-wheat wrap with turkey, hummus, and crunchy veggies.",
    calories: 480,
    protein: 32,
    carbs: 48,
    fat: 16,
    prepMinutes: 10,
    tags: ["dairy_free", "nut_free"],
    ingredients: [
      i("Whole-wheat wrap", 1, "whole", "grains"),
      i("Sliced turkey", 4, "oz", "protein"),
      i("Hummus", 3, "tbsp", "pantry"),
      i("Lettuce", 1, "cup", "produce"),
      i("Tomato", 0.5, "whole", "produce"),
    ],
  },
];

const DINNERS: SampleMeal[] = [
  {
    name: "Stuffed Bell Peppers",
    description: "Peppers baked with lentils, brown rice, and tomato.",
    calories: 480,
    protein: 18,
    carbs: 74,
    fat: 10,
    prepMinutes: 40,
    tags: ALL,
    ingredients: [
      i("Bell pepper", 2, "whole", "produce"),
      i("Green lentils", 0.5, "cup", "protein"),
      i("Brown rice", 0.5, "cup", "grains"),
      i("Diced tomatoes", 1, "cup", "pantry"),
    ],
  },
  {
    name: "Tofu Veggie Stir-Fry",
    description: "Tofu and mixed vegetables over brown rice with ginger-tamari.",
    calories: 520,
    protein: 24,
    carbs: 66,
    fat: 16,
    prepMinutes: 25,
    tags: ALL,
    ingredients: [
      i("Firm tofu", 6, "oz", "protein"),
      i("Stir-fry vegetables", 2, "cup", "produce"),
      i("Brown rice", 0.75, "cup", "grains"),
      i("Gluten-free tamari", 1, "tbsp", "pantry"),
      i("Fresh ginger", 1, "tsp", "produce"),
    ],
  },
  {
    name: "Chickpea Vegetable Curry",
    description: "Chickpeas and spinach in a light coconut-tomato curry over rice.",
    calories: 540,
    protein: 18,
    carbs: 76,
    fat: 18,
    prepMinutes: 30,
    tags: ALL,
    ingredients: [
      i("Chickpeas", 0.75, "cup", "protein"),
      i("Spinach", 2, "cup", "produce"),
      i("Diced tomatoes", 1, "cup", "pantry"),
      i("Light coconut milk", 0.5, "cup", "pantry"),
      i("Brown rice", 0.75, "cup", "grains"),
    ],
  },
  {
    name: "Baked Salmon with Quinoa",
    description: "Roasted salmon with quinoa and lemon-garlic asparagus.",
    calories: 560,
    protein: 40,
    carbs: 42,
    fat: 24,
    prepMinutes: 25,
    tags: ["carnivore", "pescatarian", "gluten_free", "dairy_free", "nut_free"],
    ingredients: [
      i("Salmon fillet", 6, "oz", "protein"),
      i("Quinoa", 0.75, "cup", "grains"),
      i("Asparagus", 1, "cup", "produce"),
      i("Olive oil", 1, "tbsp", "pantry"),
      i("Lemon", 0.5, "whole", "produce"),
    ],
  },
  {
    name: "Grilled Chicken & Roasted Veg",
    description: "Chicken breast with roasted sweet potato and Brussels sprouts.",
    calories: 580,
    protein: 44,
    carbs: 48,
    fat: 20,
    prepMinutes: 35,
    tags: ["carnivore", "gluten_free", "dairy_free", "nut_free"],
    ingredients: [
      i("Chicken breast", 6, "oz", "protein"),
      i("Sweet potato", 1, "whole", "produce"),
      i("Brussels sprouts", 1, "cup", "produce"),
      i("Olive oil", 1, "tbsp", "pantry"),
    ],
  },
  {
    name: "Whole-Wheat Veggie Pasta",
    description: "Whole-wheat pasta with marinara, zucchini, and white beans.",
    calories: 550,
    protein: 22,
    carbs: 88,
    fat: 12,
    prepMinutes: 20,
    tags: ["vegetarian", "vegan", "pescatarian", "dairy_free", "nut_free"],
    ingredients: [
      i("Whole-wheat pasta", 3, "oz", "grains"),
      i("Marinara sauce", 0.75, "cup", "pantry"),
      i("Zucchini", 1, "whole", "produce"),
      i("White beans", 0.5, "cup", "protein"),
    ],
  },
];

const SNACKS: SampleMeal[] = [
  {
    name: "Hummus & Veggie Sticks",
    description: "Hummus with carrot and cucumber sticks.",
    calories: 180,
    protein: 6,
    carbs: 20,
    fat: 9,
    prepMinutes: 5,
    tags: ALL,
    ingredients: [
      i("Hummus", 3, "tbsp", "pantry"),
      i("Carrot", 1, "whole", "produce"),
      i("Cucumber", 0.5, "whole", "produce"),
    ],
  },
  {
    name: "Apple & Sunflower Butter",
    description: "Sliced apple with sunflower-seed butter.",
    calories: 200,
    protein: 5,
    carbs: 26,
    fat: 10,
    prepMinutes: 3,
    tags: ALL,
    ingredients: [
      i("Apple", 1, "whole", "produce"),
      i("Sunflower-seed butter", 1, "tbsp", "pantry"),
    ],
  },
  {
    name: "Roasted Chickpeas",
    description: "Crispy chickpeas roasted with paprika.",
    calories: 190,
    protein: 9,
    carbs: 28,
    fat: 5,
    prepMinutes: 25,
    tags: ALL,
    ingredients: [
      i("Chickpeas", 0.5, "cup", "protein"),
      i("Olive oil", 1, "tsp", "pantry"),
      i("Paprika", 0.5, "tsp", "pantry"),
    ],
  },
  {
    name: "Edamame",
    description: "Steamed edamame with a pinch of sea salt.",
    calories: 160,
    protein: 14,
    carbs: 12,
    fat: 6,
    prepMinutes: 6,
    tags: ALL,
    ingredients: [
      i("Edamame", 1, "cup", "frozen"),
      i("Sea salt", 0.25, "tsp", "pantry"),
    ],
  },
  {
    name: "Greek Yogurt & Berries",
    description: "Greek yogurt topped with fresh blueberries.",
    calories: 150,
    protein: 15,
    carbs: 16,
    fat: 3,
    prepMinutes: 2,
    tags: ["carnivore", "vegetarian", "pescatarian", "gluten_free", "nut_free"],
    ingredients: [
      i("Greek yogurt", 0.75, "cup", "dairy"),
      i("Blueberries", 0.5, "cup", "produce"),
    ],
  },
];

const POOLS: Record<MealType, SampleMeal[]> = {
  breakfast: BREAKFASTS,
  lunch: LUNCHES,
  dinner: DINNERS,
  snack: SNACKS,
};

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

/**
 * A meal fits a profile if it satisfies every one of the profile's prefs.
 * "omnivore" imposes no restriction, so it's always satisfied.
 */
function fits(meal: SampleMeal, prefs: DietaryPreference[]): boolean {
  return prefs.every((p) => p === "omnivore" || meal.tags.includes(p));
}

/** Generic-but-plausible cooking steps derived from a sample meal. */
function deriveInstructions(meal: SampleMeal): string[] {
  const grain = meal.ingredients.find((x) => x.category === "grains")?.name;
  const protein = meal.ingredients.find((x) => x.category === "protein")?.name;
  const steps: string[] = [
    `Prep the ingredients for ${meal.name.toLowerCase()}: rinse, chop, and measure everything out.`,
  ];
  if (grain) {
    steps.push(`Cook the ${grain.toLowerCase()} according to package directions.`);
  }
  if (protein) {
    steps.push(`Cook the ${protein.toLowerCase()} until done, seasoning lightly.`);
  }
  steps.push("Combine everything, adjust seasoning to taste, and serve.");
  return steps;
}

function scaleMeal(
  meal: SampleMeal,
  mealType: MealType,
  factor: number,
): GeneratedMeal {
  return {
    mealType,
    name: meal.name,
    description: meal.description,
    calories: Math.round(meal.calories * factor),
    protein: Math.round(meal.protein * factor),
    carbs: Math.round(meal.carbs * factor),
    fat: Math.round(meal.fat * factor),
    prepMinutes: meal.prepMinutes,
    instructions: deriveInstructions(meal),
    ingredients: meal.ingredients,
  };
}

function batchNote(meals: { mealType: MealType; name: string }[]): string {
  const pick = (t: MealType) => meals.find((m) => m.mealType === t)?.name;
  const names = [pick("breakfast"), pick("lunch"), pick("dinner")].filter(
    Boolean,
  );
  return `Evening prep session: cook the components for ${names.join(
    ", ",
  )} together — batch the grains and proteins, portion into containers, and refrigerate so the next day's meals are ready to go.`;
}

/** Filter each meal slot to compatible meals, falling back to the full pool. */
function poolsFor(prefs: DietaryPreference[]): Record<MealType, SampleMeal[]> {
  const pools = {
    breakfast: POOLS.breakfast.filter((m) => fits(m, prefs)),
    lunch: POOLS.lunch.filter((m) => fits(m, prefs)),
    dinner: POOLS.dinner.filter((m) => fits(m, prefs)),
    snack: POOLS.snack.filter((m) => fits(m, prefs)),
  } as Record<MealType, SampleMeal[]>;
  for (const t of MEAL_TYPES) {
    if (pools[t].length === 0) pools[t] = POOLS[t];
  }
  return pools;
}

/** Build a realistic sample WeekPlan for a profile and generation options. */
export function buildSamplePlan(
  profile: Profile,
  options: GenerationOptions,
): WeekPlan {
  const pools = poolsFor(profile.dietaryPreferences);

  const days = Array.from({ length: options.days }, (_, d) => {
    const picks = MEAL_TYPES.map((type, slot) => {
      const pool = pools[type];
      return pool[(d + slot) % pool.length];
    });

    const baseTotal = picks.reduce((sum, m) => sum + m.calories, 0);
    const factor = profile.targetCalories / baseTotal;

    const meals = picks.map((m, slot) => scaleMeal(m, MEAL_TYPES[slot], factor));
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

    return {
      day: d,
      meals,
      totalCalories,
      batchPrep: options.batchCooking ? batchNote(meals) : undefined,
    };
  });

  return {
    profileId: profile.id,
    profileName: profile.name,
    calorieGoal: profile.calorieGoal,
    targetCalories: profile.targetCalories,
    cuisine: options.cuisine,
    batchCooking: options.batchCooking,
    generatedAt: new Date().toISOString(),
    sample: true,
    days,
  };
}

/** Build a sample couples plan: shared dishes at two portion sizes. */
export function buildSampleCouplePlan(
  profiles: [Profile, Profile],
  options: GenerationOptions,
): CouplePlan {
  // A shared dish must satisfy both people's dietary preferences.
  const union = Array.from(
    new Set([
      ...profiles[0].dietaryPreferences,
      ...profiles[1].dietaryPreferences,
    ]),
  );
  const pools = poolsFor(union);

  const days: CoupleDayPlan[] = Array.from(
    { length: options.days },
    (_, d) => {
      const meals: CoupleMeal[] = MEAL_TYPES.map((mealType, slot) => {
        const pool = pools[mealType];
        const base = pool[(d + slot) % pool.length];
        const portions = profiles.map((p) => {
          const target = Math.round(
            p.targetCalories * MEAL_CALORIE_SPLIT[mealType],
          );
          const f = target / base.calories;
          return {
            profileId: p.id,
            profileName: p.name,
            calories: target,
            protein: Math.round(base.protein * f),
            carbs: Math.round(base.carbs * f),
            fat: Math.round(base.fat * f),
            portion: `≈ ${target} kcal serving`,
          };
        });
        return {
          mealType,
          name: base.name,
          description: base.description,
          instructions: deriveInstructions(base),
          ingredients: base.ingredients,
          portions,
        };
      });

      return {
        day: d,
        meals,
        batchPrep: options.batchCooking
          ? batchNote(meals.map((m) => ({ mealType: m.mealType, name: m.name })))
          : undefined,
      };
    },
  );

  return {
    profileIds: [profiles[0].id, profiles[1].id],
    profileNames: [profiles[0].name, profiles[1].name],
    cuisine: options.cuisine,
    batchCooking: options.batchCooking,
    generatedAt: new Date().toISOString(),
    sample: true,
    days,
  };
}
