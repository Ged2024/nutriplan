import type { Metadata } from "next";
import Link from "next/link";
import { AppProvider } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriPlan — Whole-Foods Meal Planning",
  description:
    "Personalized weekly meal plans built around your health conditions, dietary preferences, and calorie goals — with calories per meal and a consolidated grocery list.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans">
        <AppProvider>
        <header className="no-print border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white"
              >
                🥗
              </span>
              <span className="text-stone-900">
                Nutri<span className="text-brand-600">Plan</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium text-stone-600">
              <Link
                href="/profiles"
                className="px-3 py-2 rounded-md hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                Profiles
              </Link>
              <Link
                href="/plan"
                className="px-3 py-2 rounded-md hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                Meal Plan
              </Link>
              <Link
                href="/grocery-list"
                className="px-3 py-2 rounded-md hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                Grocery List
              </Link>
              <Link
                href="/favorites"
                className="px-3 py-2 rounded-md hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                Favorites
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="no-print border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm text-stone-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p>NutriPlan — whole foods, balanced nutrition.</p>
            <p className="text-stone-400">
              Estimates are for guidance only, not medical advice.
            </p>
          </div>
        </footer>
        </AppProvider>
      </body>
    </html>
  );
}
