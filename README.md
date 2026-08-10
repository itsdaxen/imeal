# iMeal

iMeal is a meal-planning application designed to turn saved recipes into a
realistic weekly plan and an actionable shopping list.

## The Core Idea

Recipes, weekly decisions, and grocery notes often live in different places. iMeal
brings them into one workflow:

1. Save the recipes you actually want to cook.
2. Place them into a weekly meal plan.
3. Generate and refine the shopping list for that plan.
4. Keep the recipe accessible while preparing the meal.

The core experience will work without AI. AI-assisted recipe import and shopping
list cleanup are planned as optional conveniences, with user review before they
change saved data.

## Features

- Supabase-backed authentication and user profiles.
- A private recipe library with search and meal-type tags.
- Weekly planning by day and meal slot.
- Shopping-list generation from planned meals.
- Manual shopping items, checked state, and staple items.
- A focused, mobile-friendly recipe and cooking view.
- Responsive and accessible interaction across the main workflow.

Collaboration, recipe sharing, a curated public catalog, administration tools, and
AI features are candidates for later phases after the core workflow is reliable.

## Stack

- Next.js App Router and React.
- TypeScript with strict checking.
- Tailwind CSS.
- HeroUI components used selectively as the UI foundation.
- Supabase Postgres, Auth, Row Level Security, and Storage.
- OpenAI API for bounded, optional assistance in a later phase.

## Local development

Requires Node `22.22.3` (see `.node-version`) and pnpm `11.17.0`.

```bash
pnpm install
pnpm dev
```

The app runs against typed mock data and needs no Supabase or OpenAI credentials to start.
Before opening a pull request, run the full quality gate:

```bash
pnpm check   # format check, lint, typecheck, tests, dependency audit, and a production build
```
