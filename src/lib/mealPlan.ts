import Anthropic from "@anthropic-ai/sdk";
import type {
  CoupleDayPlan,
  CouplePlan,
  CoupleMeal,
  DayPlan,
  GeneratedMeal,
  GenerationOptions,
  Profile,
  WeekPlan,
} from "./types";
import {
  CALORIE_GOALS,
  CUISINES,
  DIETARY_PREFERENCES,
  HEALTH_CONDITIONS,
} from "./constants";

/**
 * Server-side meal-plan generation backed by the Anthropic API.
 *
 * Uses **forced tool use** (`tool_choice` pinned to one tool with
 * `strict: true`) so the model returns data matching our JSON schema —
 * `block.input` comes back already validated. The large, frozen instruction
 * block lives in the system prompt with a cache breakpoint; per-request details
 * (profile, cuisine, day count) go in the user message so the cached prefix is
 * stable.
 */

// Sonnet 4.6 — best balance of speed, cost, and quality. Swap to
// "claude-opus-4-8" for maximum quality at higher cost/latency.
const MODEL = "claude-sonnet-4-6";

/** Plan lengths the UI offers and the API accepts. */
export const ALLOWED_DURATIONS = [1, 3, 5, 7, 14] as const;
export type PlanDuration = (typeof ALLOWED_DURATIONS)[number];

export function isAllowedDuration(n: unknown): n is PlanDuration {
  return (
    typeof n === "number" && (ALLOWED_DURATIONS as readonly number[]).includes(n)
  );
}

// Shared sub-schemas -------------------------------------------------------

const INGREDIENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    quantity: { type: "number", description: "Numeric amount." },
    unit: { type: "string", description: "Unit, e.g. g, oz, cup, tbsp, clove." },
    category: {
      type: "string",
      enum: ["produce", "protein", "dairy", "grains", "pantry", "frozen", "other"],
    },
  },
  required: ["name", "quantity", "unit", "category"],
} as const;

const INSTRUCTIONS_SCHEMA = {
  type: "array",
  description: "Numbered cooking steps (3-7 concise steps).",
  items: { type: "string" },
} as const;

/** Tool the model is forced to call for an individual plan. */
const SAVE_PLAN_TOOL: Anthropic.Tool = {
  name: "save_meal_plan",
  description: "Save the generated meal plan. Call this exactly once.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      days: {
        type: "array",
        description:
          "One entry per day requested, in order. Each day has 4 meals: breakfast, lunch, dinner, snack.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            batchPrep: {
              type: "string",
              description:
                "If batch cooking is requested, a summary of the single cooking session that prepares this day's meals; otherwise an empty string.",
            },
            meals: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  mealType: {
                    type: "string",
                    enum: ["breakfast", "lunch", "dinner", "snack"],
                  },
                  name: { type: "string" },
                  description: { type: "string" },
                  calories: { type: "integer" },
                  protein: { type: "integer" },
                  carbs: { type: "integer" },
                  fat: { type: "integer" },
                  prepMinutes: { type: "integer" },
                  instructions: INSTRUCTIONS_SCHEMA,
                  ingredients: { type: "array", items: INGREDIENT_SCHEMA },
                },
                required: [
                  "mealType",
                  "name",
                  "description",
                  "calories",
                  "protein",
                  "carbs",
                  "fat",
                  "prepMinutes",
                  "instructions",
                  "ingredients",
                ],
              },
            },
          },
          required: ["batchPrep", "meals"],
        },
      },
    },
    required: ["days"],
  },
};

/** Tool the model is forced to call for a couples plan. */
const SAVE_COUPLE_TOOL: Anthropic.Tool = {
  name: "save_couple_plan",
  description: "Save the shared couples meal plan. Call this exactly once.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      days: {
        type: "array",
        description: "One entry per day requested, each with 4 shared meals.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            batchPrep: { type: "string" },
            meals: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  mealType: {
                    type: "string",
                    enum: ["breakfast", "lunch", "dinner", "snack"],
                  },
                  name: { type: "string" },
                  description: { type: "string" },
                  instructions: INSTRUCTIONS_SCHEMA,
                  ingredients: { type: "array", items: INGREDIENT_SCHEMA },
                  portions: {
                    type: "array",
                    description:
                      "Exactly 2 entries: person 0 first, person 1 second.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        person: {
                          type: "integer",
                          description: "0 for the first person, 1 for the second.",
                        },
                        calories: { type: "integer" },
                        protein: { type: "integer" },
                        carbs: { type: "integer" },
                        fat: { type: "integer" },
                        portion: {
                          type: "string",
                          description:
                            "Plain-language portion for this person, e.g. '1.5 cups rice, 6 oz chicken'.",
                        },
                      },
                      required: [
                        "person",
                        "calories",
                        "protein",
                        "carbs",
                        "fat",
                        "portion",
                      ],
                    },
                  },
                },
                required: [
                  "mealType",
                  "name",
                  "description",
                  "instructions",
                  "ingredients",
                  "portions",
                ],
              },
            },
          },
          required: ["batchPrep", "meals"],
        },
      },
    },
    required: ["days"],
  },
};

// System prompts -----------------------------------------------------------

const PRINCIPLES = `Core principles:
- Whole foods first. Favor vegetables, fruits, legumes, whole grains, nuts, seeds, lean proteins, and healthy fats. Avoid ultra-processed foods, added sugars, and refined grains.
- Balanced nutrition. Adequate protein and fiber daily; spread protein across meals.
- Variety. Do not repeat a meal within the plan. Vary proteins and vegetables.
- Realistic portions, practical home cooking, and clear step-by-step recipes for every meal (3-7 concise numbered steps).

Calorie targeting:
- Hit each person's daily calorie target within ~5%.
- Distribute calories roughly: breakfast 25%, lunch 30%, dinner 30%, snack 15%.

Health-condition adjustments (apply ALL that the person has):
- Hypertension: low sodium; potassium-rich produce; DASH-style; avoid cured/processed meats.
- Diabetes: lower glycemic load; high fiber; balanced carbs with protein/fat; avoid refined carbs and sugar.
- High cholesterol: minimize saturated/trans fat; soluble fiber (oats, beans); unsaturated fats and lean proteins.
- For pre-/borderline conditions (pre-diabetic, borderline high cholesterol, slightly elevated blood pressure), apply the same principles preventively with moderate strictness.

Dietary preferences are HARD constraints — never violate them:
- Omnivore: no restriction. Vegetarian: no meat/poultry/fish. Vegan: no animal products at all. Pescatarian: no meat/poultry, fish ok. Carnivore: animal foods only (meat, fish, eggs, some dairy), minimal/no plants. Gluten-free: no wheat/barley/rye. Dairy-free: no milk/cheese/butter/yogurt. Nut-free: no tree nuts/peanuts.

Cuisine: follow the requested cuisine style across the whole plan (given in the request). For "Mixed", vary styles across days. Use authentic, recognizable dishes for the chosen cuisine.

Batch cooking: if requested, design each day so a single evening cooking session prepares that day's breakfast, lunch, and dinner together; summarize that session in the day's "batchPrep". If not requested, set "batchPrep" to an empty string.`;

const SYSTEM_PROMPT = `You are a registered dietitian and meal planner for NutriPlan. You build whole-foods meal plans tailored to a person's gender, age, health conditions, dietary preferences, and calorie goal.

${PRINCIPLES}

Output: call save_meal_plan exactly once. Provide exactly the requested number of days, in order, each with exactly 4 meals (breakfast, lunch, dinner, snack), realistic per-serving calories/macros, a full categorized ingredient list, and step-by-step instructions for every meal.`;

const COUPLE_SYSTEM_PROMPT = `You are a registered dietitian and meal planner for NutriPlan's couples mode. Two people eat the SAME dish each meal, but at portion sizes scaled to each person's calorie target.

Make meals especially nutrient-dense: high in fiber, lean protein, and healthy fats. Dishes must satisfy BOTH people's dietary preferences and suit BOTH people's health conditions.

${PRINCIPLES}

Output: call save_couple_plan exactly once. Provide exactly the requested number of days, each with 4 shared meals. For each meal give one shared recipe + ingredient list, plus exactly 2 portions (person 0 then person 1) with each person's calories/macros and plain-language portion guidance. Each person's daily portions should total close to their own calorie target.`;

// Helpers ------------------------------------------------------------------

function labelList<T extends string>(
  values: T[],
  table: { value: T; label: string }[],
): string {
  if (values.length === 0) return "none";
  return values
    .map((v) => table.find((t) => t.value === v)?.label ?? v)
    .join(", ");
}

function cuisineLabel(c: GenerationOptions["cuisine"]): string {
  return CUISINES.find((x) => x.value === c)?.label ?? c;
}

function profileLines(profile: Profile, indexLabel?: string): string {
  const goal = CALORIE_GOALS.find((g) => g.value === profile.calorieGoal);
  const who = indexLabel ?? (profile.name || "this person");
  return [
    `${who}: ${profile.gender}, age ${profile.age}.`,
    `  Daily calorie target: ${profile.targetCalories} kcal (goal: ${goal?.label ?? profile.calorieGoal}).`,
    `  Health conditions: ${labelList(profile.healthConditions, HEALTH_CONDITIONS)}.`,
    `  Dietary preferences: ${labelList(profile.dietaryPreferences, DIETARY_PREFERENCES)}.`,
  ].join("\n");
}

function optionsLines(opts: GenerationOptions): string {
  return [
    `Number of days: exactly ${opts.days}.`,
    `Cuisine style: ${cuisineLabel(opts.cuisine)}.`,
    `Batch cooking: ${opts.batchCooking ? "YES — plan a single evening cooking session per day and fill batchPrep." : "no — leave batchPrep empty."}`,
  ].join("\n");
}

function buildUserMessage(profile: Profile, opts: GenerationOptions): string {
  return [
    `Create a ${opts.days}-day meal plan.`,
    ``,
    profileLines(profile),
    ``,
    optionsLines(opts),
    ``,
    `Tailor every meal to these constraints and call save_meal_plan.`,
  ].join("\n");
}

function buildCoupleUserMessage(
  profiles: [Profile, Profile],
  opts: GenerationOptions,
): string {
  return [
    `Create a ${opts.days}-day shared couples meal plan for two people.`,
    ``,
    profileLines(profiles[0], `Person 0 (${profiles[0].name})`),
    profileLines(profiles[1], `Person 1 (${profiles[1].name})`),
    ``,
    optionsLines(opts),
    ``,
    `Both eat the same dish each meal at different portions. Call save_couple_plan.`,
  ].join("\n");
}

/** Thrown when the API key is not configured. */
export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set on the server.");
    this.name = "MissingApiKeyError";
  }
}

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();
  return new Anthropic({ apiKey });
}

// Generation ---------------------------------------------------------------

export async function generateWeekPlan(
  profile: Profile,
  opts: GenerationOptions,
): Promise<WeekPlan> {
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 60000,
    thinking: { type: "disabled" },
    tools: [SAVE_PLAN_TOOL],
    tool_choice: { type: "tool", name: SAVE_PLAN_TOOL.name },
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: buildUserMessage(profile, opts) }],
  });

  const message = await stream.finalMessage();
  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) throw new Error("Model did not return a meal plan.");

  const raw = toolUse.input as {
    days: { batchPrep: string; meals: GeneratedMeal[] }[];
  };
  const days: DayPlan[] = raw.days.map((d, i) => ({
    day: i,
    meals: d.meals,
    totalCalories: d.meals.reduce((s, m) => s + (m.calories || 0), 0),
    batchPrep: d.batchPrep || undefined,
  }));

  return {
    profileId: profile.id,
    profileName: profile.name,
    calorieGoal: profile.calorieGoal,
    targetCalories: profile.targetCalories,
    cuisine: opts.cuisine,
    batchCooking: opts.batchCooking,
    generatedAt: new Date().toISOString(),
    days,
  };
}

export async function generateCouplePlan(
  profiles: [Profile, Profile],
  opts: GenerationOptions,
): Promise<CouplePlan> {
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 60000,
    thinking: { type: "disabled" },
    tools: [SAVE_COUPLE_TOOL],
    tool_choice: { type: "tool", name: SAVE_COUPLE_TOOL.name },
    system: [
      {
        type: "text",
        text: COUPLE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      { role: "user", content: buildCoupleUserMessage(profiles, opts) },
    ],
  });

  const message = await stream.finalMessage();
  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) throw new Error("Model did not return a couples plan.");

  type RawPortion = {
    person: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    portion: string;
  };
  type RawMeal = Omit<CoupleMeal, "portions"> & { portions: RawPortion[] };
  const raw = toolUse.input as {
    days: { batchPrep: string; meals: RawMeal[] }[];
  };

  const days: CoupleDayPlan[] = raw.days.map((d, i) => ({
    day: i,
    batchPrep: d.batchPrep || undefined,
    meals: d.meals.map((m) => ({
      ...m,
      portions: m.portions.map((p) => {
        const profile = profiles[p.person === 1 ? 1 : 0];
        return {
          profileId: profile.id,
          profileName: profile.name,
          calories: p.calories,
          protein: p.protein,
          carbs: p.carbs,
          fat: p.fat,
          portion: p.portion,
        };
      }),
    })),
  }));

  return {
    profileIds: [profiles[0].id, profiles[1].id],
    profileNames: [profiles[0].name, profiles[1].name],
    cuisine: opts.cuisine,
    batchCooking: opts.batchCooking,
    generatedAt: new Date().toISOString(),
    days,
  };
}
