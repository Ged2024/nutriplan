import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateCouplePlan,
  generateWeekPlan,
  isAllowedDuration,
  MissingApiKeyError,
} from "@/lib/mealPlan";
import { buildSampleCouplePlan, buildSamplePlan } from "@/lib/samplePlan";
import { CUISINES } from "@/lib/constants";
import type { Cuisine, GenerationOptions, Profile } from "@/lib/types";

// Meal generation can take a while (a full week is a large payload). 60s is the
// max on Vercel's free Hobby plan; raise it (e.g. 300) on Pro for long plans.
export const maxDuration = 60;

function isValidProfile(p: unknown): p is Profile {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.gender === "string" &&
    typeof o.age === "number" &&
    Array.isArray(o.healthConditions) &&
    Array.isArray(o.dietaryPreferences) &&
    typeof o.calorieGoal === "string" &&
    typeof o.targetCalories === "number"
  );
}

function isCuisine(c: unknown): c is Cuisine {
  return (
    typeof c === "string" && CUISINES.some((x) => x.value === c)
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Generation options shared by both modes.
  const days = body.days ?? 7;
  if (!isAllowedDuration(days)) {
    return NextResponse.json(
      { error: "`days` must be one of 1, 3, 5, 7, or 14." },
      { status: 400 },
    );
  }
  const cuisine: Cuisine = isCuisine(body.cuisine) ? body.cuisine : "mixed";
  const options: GenerationOptions = {
    days,
    cuisine,
    batchCooking: body.batchCooking === true,
  };

  const demo = body.demo === true;
  const mode = body.mode === "couples" ? "couples" : "individual";

  try {
    if (mode === "couples") {
      const profiles = body.profiles;
      if (
        !Array.isArray(profiles) ||
        profiles.length !== 2 ||
        !isValidProfile(profiles[0]) ||
        !isValidProfile(profiles[1])
      ) {
        return NextResponse.json(
          { error: "Couples mode requires exactly two valid profiles." },
          { status: 400 },
        );
      }
      const pair: [Profile, Profile] = [profiles[0], profiles[1]];
      if (demo) {
        await new Promise((r) => setTimeout(r, 700));
        return NextResponse.json({
          couplePlan: buildSampleCouplePlan(pair, options),
        });
      }
      return NextResponse.json({
        couplePlan: await generateCouplePlan(pair, options),
      });
    }

    // Individual mode
    const profile = body.profile;
    if (!isValidProfile(profile)) {
      return NextResponse.json(
        { error: "Request must include a valid `profile`." },
        { status: 400 },
      );
    }
    if (demo) {
      await new Promise((r) => setTimeout(r, 700));
      return NextResponse.json({ plan: buildSamplePlan(profile, options) });
    }
    return NextResponse.json({ plan: await generateWeekPlan(profile, options) });
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            "The server is missing its ANTHROPIC_API_KEY. Add it to .env.local and restart, or use Demo mode.",
        },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Invalid Anthropic API key." }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Anthropic rate limit hit. Please try again shortly." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic API error: ${error.message}` },
        { status: 502 },
      );
    }
    console.error("generate-plan failed:", error);
    return NextResponse.json(
      { error: "Failed to generate the meal plan. Please try again." },
      { status: 500 },
    );
  }
}
