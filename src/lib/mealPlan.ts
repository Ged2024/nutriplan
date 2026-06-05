import Anthropic from "@anthropic-ai/sdk";
import type {
  DayPlan,
  GeneratedMeal,
  Profile,
  WeekPlan,
} from "./types";
import {
  CALORIE_GOALS,
  DIETARY_PREFERENCES,
  HEALTH_CONDITIONS,
} from "./constants";

/**
 * Server-side meal-plan generation backed by the Anthropic API.
 *
 * We use **forced tool use** (`tool_choice` pinned to one tool with
 * `strict: true`) so the model is required to return data matching our JSON
 * schema — `block.input` comes back already validated and parsed. The large,
 * frozen instruction block lives in the system prompt with a cache breakpoint;
 * the per-profile details go in the user message so the cached prefix is stable
 * across requests for different people.
 */

// Sonnet 4.6 — the best balance of speed, cost, and quality for this workload.
// Swap to "claude-opus-4-8" for maximum quality at higher cost/latency.
const MODEL = "claude-sonnet-4-6";

/** Plan lengths the UI offers and the API accepts. */
export const ALLOWED_DURATIONS = [1, 3, 5, 7, 14] as const;
export type PlanDuration = (typeof ALLOWED_DURATIONS)[number];

export function isAllowedDuration(n: unknown): n is PlanDuration {
  return (
    typeof n === "number" && (ALLOWED_DURATIONS as readonly number[]).includes(n)
  );
}

/** Tool the model is forced to call. Its input schema IS our output contract. */
const SAVE_PLAN_TOOL: Anthropic.Tool = {
  name: "save_meal_plan",
  description:
    "Save the generated 7-day meal plan. Call this exactly once with the full week.",
  // strict mode: every object needs additionalProperties:false and all keys required.
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      days: {
        type: "array",
        description:
          "One entry per day requested, in order starting from day 1. Each day has 4 meals: breakfast, lunch, dinner, snack.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            meals: {
              type: "array",
              description:
                "Exactly 4 meals for this day, one of each meal type.",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  mealType: {
                    type: "string",
                    enum: ["breakfast", "lunch", "dinner", "snack"],
                  },
                  name: { type: "string", description: "Short dish name." },
                  description: {
                    type: "string",
                    description: "One or two sentences on the dish.",
                  },
                  calories: {
                    type: "integer",
                    description: "Estimated calories for this meal.",
                  },
                  protein: { type: "integer", description: "Grams of protein." },
                  carbs: { type: "integer", description: "Grams of carbs." },
                  fat: { type: "integer", description: "Grams of fat." },
                  prepMinutes: {
                    type: "integer",
                    description: "Rough total prep + cook time in minutes.",
                  },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        name: { type: "string" },
                        quantity: {
                          type: "number",
                          description: "Numeric amount for one serving.",
                        },
                        unit: {
                          type: "string",
                          description:
                            "Unit, e.g. g, oz, cup, tbsp, clove, whole.",
                        },
                        category: {
                          type: "string",
                          enum: [
                            "produce",
                            "protein",
                            "dairy",
                            "grains",
                            "pantry",
                            "frozen",
                            "other",
                          ],
                        },
                      },
                      required: ["name", "quantity", "unit", "category"],
                    },
                  },
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
                  "ingredients",
                ],
              },
            },
          },
          required: ["meals"],
        },
      },
    },
    required: ["days"],
  },
};

/** Frozen system prompt — stable across all profiles so it can be cached. */
const SYSTEM_PROMPT = `You are a registered dietitian and meal planner for NutriPlan. You build one-week, whole-foods meal plans tailored to each person's health conditions, dietary preferences, and calorie goal.

Core principles:
- Whole foods first. Favor vegetables, fruits, legumes, whole grains, nuts, seeds, lean proteins, and healthy fats. Avoid ultra-processed foods, added sugars, and refined grains.
- Balanced nutrition. Each day should provide adequate protein, fiber, and a sensible macro split. Spread protein across all meals.
- Variety. Do not repeat the same meal twice in the plan. Vary cuisines, proteins, and vegetables across the days.
- Realistic portions and prep. Keep recipes practical for home cooking.

Calorie targeting:
- Hit the person's daily calorie target as closely as you can (within ~5%).
- Distribute calories roughly: breakfast 25%, lunch 30%, dinner 30%, snack 15%.

Health-condition adjustments (apply ALL that the person has):
- Hypertension: keep sodium low; emphasize potassium-rich produce, whole grains, and unsalted preparations (DASH-style). Avoid cured/processed meats and high-sodium sauces.
- Diabetes: lower glycemic load; prioritize high-fiber, low-added-sugar meals with balanced carbs and protein/fat to blunt glucose spikes. Avoid refined carbs and sugary items.
- High cholesterol: minimize saturated and trans fats; emphasize soluble fiber (oats, beans, fruit), unsaturated fats (olive oil, nuts, fish), and lean proteins.

Dietary preferences are HARD constraints — never violate them:
- Vegetarian: no meat, poultry, or fish.
- Vegan: no animal products whatsoever (no meat, fish, dairy, eggs, honey).
- Pescatarian: no meat or poultry; fish and seafood allowed.
- Gluten-free: no wheat, barley, rye, or standard oats/soy sauce.
- Dairy-free: no milk, cheese, butter, yogurt, or cream.
- Nut-free: no tree nuts or peanuts.

Output: call the save_meal_plan tool exactly once. Provide exactly the number of days requested (the count is given in the request), in order, each with exactly 4 meals (breakfast, lunch, dinner, snack). Provide realistic per-serving calorie and macro estimates and a complete, categorized ingredient list for every meal.`;

function labelList<T extends string>(
  values: T[],
  table: { value: T; label: string }[],
): string {
  if (values.length === 0) return "none";
  return values
    .map((v) => table.find((t) => t.value === v)?.label ?? v)
    .join(", ");
}

/** Build the per-profile user message (the volatile part of the prompt). */
function buildUserMessage(profile: Profile, numDays: number): string {
  const goal = CALORIE_GOALS.find((g) => g.value === profile.calorieGoal);
  return [
    `Create a ${numDays}-day meal plan for ${profile.name || "this person"}.`,
    ``,
    `Number of days: exactly ${numDays}.`,
    `Daily calorie target: ${profile.targetCalories} kcal (goal: ${goal?.label ?? profile.calorieGoal}).`,
    `Health conditions: ${labelList(profile.healthConditions, HEALTH_CONDITIONS)}.`,
    `Dietary preferences: ${labelList(profile.dietaryPreferences, DIETARY_PREFERENCES)}.`,
    ``,
    `Tailor every meal to these constraints and call save_meal_plan with all ${numDays} days.`,
  ].join("\n");
}

/** Thrown when the API key is not configured. */
export class MissingApiKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set on the server.");
    this.name = "MissingApiKeyError";
  }
}

/**
 * Generate a full one-week plan for a profile. Streams the response (the
 * payload is large) and returns a WeekPlan with per-day calorie totals filled
 * in from the model's per-meal estimates.
 */
export async function generateWeekPlan(
  profile: Profile,
  numDays: number,
): Promise<WeekPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  const client = new Anthropic({ apiKey });

  const stream = client.messages.stream({
    model: MODEL,
    // Up to 14 days × 4 meals with full ingredient lists is a large payload.
    max_tokens: 48000,
    // Forced tool use is incompatible with extended/adaptive thinking, so we
    // disable thinking and lean on the system prompt for quality.
    thinking: { type: "disabled" },
    tools: [SAVE_PLAN_TOOL],
    tool_choice: { type: "tool", name: SAVE_PLAN_TOOL.name },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: buildUserMessage(profile, numDays) }],
  });

  const message = await stream.finalMessage();

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Model did not return a meal plan.");
  }

  const raw = toolUse.input as { days: { meals: GeneratedMeal[] }[] };
  const days: DayPlan[] = raw.days.map((d, i) => ({
    day: i,
    meals: d.meals,
    totalCalories: d.meals.reduce((sum, m) => sum + (m.calories || 0), 0),
  }));

  return {
    profileId: profile.id,
    profileName: profile.name,
    calorieGoal: profile.calorieGoal,
    targetCalories: profile.targetCalories,
    generatedAt: new Date().toISOString(),
    days,
  };
}
