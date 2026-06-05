import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateWeekPlan,
  isAllowedDuration,
  MissingApiKeyError,
} from "@/lib/mealPlan";
import { buildSamplePlan } from "@/lib/samplePlan";
import type { Profile } from "@/lib/types";

// Meal generation can take a while (a full week is a large payload). 60s is the
// max on Vercel's free Hobby plan; raise it (e.g. 300) on Pro for long plans.
export const maxDuration = 60;

function isValidProfile(p: unknown): p is Profile {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    Array.isArray(o.healthConditions) &&
    Array.isArray(o.dietaryPreferences) &&
    typeof o.calorieGoal === "string" &&
    typeof o.targetCalories === "number"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const profile = (body as { profile?: unknown })?.profile;
  if (!isValidProfile(profile)) {
    return NextResponse.json(
      { error: "Request must include a valid `profile`." },
      { status: 400 },
    );
  }

  // Default to a full week if the client doesn't specify a duration.
  const days = (body as { days?: unknown })?.days ?? 7;
  if (!isAllowedDuration(days)) {
    return NextResponse.json(
      { error: "`days` must be one of 1, 3, 5, 7, or 14." },
      { status: 400 },
    );
  }

  // Demo/preview mode: return realistic sample data, no API key or call needed.
  const demo = (body as { demo?: unknown })?.demo === true;
  if (demo) {
    // Small delay so the loading state is visible, like a real generation.
    await new Promise((r) => setTimeout(r, 700));
    return NextResponse.json({ plan: buildSamplePlan(profile, days) });
  }

  try {
    const plan = await generateWeekPlan(profile, days);
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            "The server is missing its ANTHROPIC_API_KEY. Add it to .env.local and restart the dev server.",
        },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid Anthropic API key." },
        { status: 502 },
      );
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
