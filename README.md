# NutriPlan 🥗

A whole-foods meal-planning web app. Create a profile for anyone — yourself,
family members, anyone — with their health conditions, dietary preferences, and
calorie goal, then generate a personalized multi-day meal plan with per-meal
calories and a consolidated, printable grocery list.

Built with **Next.js 15** (App Router), **React 19**, **TypeScript**, and
**Tailwind CSS v4**. Meal generation is powered by the **Claude API**
(`@anthropic-ai/sdk`), with a built-in **demo mode** that shows realistic sample
plans without any API key.

## Features

- 👤 **Unlimited profiles** — health conditions (hypertension, diabetes, high
  cholesterol), dietary preferences, and a calorie goal per person
- 🤖 **AI-generated plans** — adaptive, whole-foods meals via Claude, tailored to
  each profile (forced tool use guarantees structured output)
- 🗓️ **Flexible length** — 1 day, 3 days, 5 days, 1 week, or 2 weeks
- 🔢 **Calories per meal & per day** vs. the target
- 🛒 **Consolidated grocery list** — grouped by aisle, with print & `.txt` export
- 🧪 **Demo mode** — try the whole flow with realistic sample data, no key needed

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. **Demo mode is on by default**, so meal generation
works immediately with sample data.

### Enabling real AI generation

To generate live plans with the Claude API:

1. Get a key at <https://console.anthropic.com/settings/keys>
2. Copy `.env.local.example` to `.env.local` and add your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the dev server, then untick **Demo mode** on the plan page.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new> (Vercel auto-detects Next.js).
3. (Optional) Add an `ANTHROPIC_API_KEY` environment variable to enable live
   generation. Without it, the deployed app still works in demo mode.

> The meal-generation API route is capped at 60s to fit Vercel's free Hobby
> plan. On Pro, you can raise `maxDuration` in
> `src/app/api/generate-plan/route.ts` for longer plans.

## Notes

- Profiles and generated plans are stored in the browser's `localStorage` —
  there's no backend database or login.
- Estimates are for general guidance only, not medical advice.
