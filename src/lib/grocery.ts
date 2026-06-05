import type { GroceryCategory, GroceryItem, WeekPlan } from "./types";

const CATEGORY_ORDER: GroceryCategory[] = [
  "produce",
  "protein",
  "dairy",
  "grains",
  "pantry",
  "frozen",
  "other",
];

export const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: "Produce",
  protein: "Protein",
  dairy: "Dairy",
  grains: "Grains & Bread",
  pantry: "Pantry",
  frozen: "Frozen",
  other: "Other",
};

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function roundQty(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Consolidate every ingredient across one or more week plans into a single
 * shopping list. Items are merged by (name + unit); quantities are summed.
 * Different units for the same ingredient stay as separate lines (we don't
 * attempt unit conversion). Returns items grouped by aisle category.
 */
export function buildGroceryList(
  plans: WeekPlan[],
): { category: GroceryCategory; items: GroceryItem[] }[] {
  const merged = new Map<string, GroceryItem>();

  for (const plan of plans) {
    for (const day of plan.days) {
      for (const meal of day.meals) {
        for (const ing of meal.ingredients) {
          const key = `${normalize(ing.name)}|${normalize(ing.unit)}`;
          const existing = merged.get(key);
          if (existing) {
            existing.quantity = roundQty(existing.quantity + ing.quantity);
          } else {
            merged.set(key, {
              name: ing.name.trim(),
              quantity: roundQty(ing.quantity),
              unit: ing.unit.trim(),
              category: ing.category,
            });
          }
        }
      }
    }
  }

  const byCategory = new Map<GroceryCategory, GroceryItem[]>();
  for (const item of merged.values()) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
    category,
    items: byCategory
      .get(category)!
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
