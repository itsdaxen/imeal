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

The core planning experience works without AI. Shopping-list organization uses a
model to normalize ingredients, combine compatible requirements, choose practical
purchase units, and assign categories, with user review before saved data changes.

## Features

- Email authentication with confirmation, and a profile holding your display name,
  planning defaults, and whether other people can find you.
- A private recipe library with title search and meal-slot filters.
- Weekly planning across seven days and four meal slots, with week navigation.
- Shopping-list generation from a week's plan, alongside manual items and reusable
  staples. Rebuilding the list never discards items you have already ticked off.
- Named and shared shopping lists work without a meal plan. Opening a list is
  separate from choosing where a week's generated ingredients go.
- A focused cooking view with one step at a time and the screen kept awake.
- Friends, with requests to accept or decline, and recipes shared read-only with
  the friends you choose.
- A public catalog that anyone can browse, an author-driven suggestion queue, and
  moderation for administrators.

Recipe import currently has a deterministic parser. Shopping-list organization uses
strict structured model output and leaves the existing list untouched when the model
is unavailable or its proposal fails validation.

## Stack

- Next.js App Router and React, with Server Components by default and Server
  Actions for mutations.
- TypeScript with strict checking.
- Tailwind CSS with HeroUI as the component foundation.
- Supabase Postgres, Auth, and Row Level Security.
- Zod for validating every untrusted boundary.
- Vitest and Testing Library.

## Local development

Requires Node `22.22.3` (see `.node-version`) and pnpm `11.17.0`.

```bash
pnpm install
```

Create a Supabase project, then copy `.env.example` to `.env.local` and fill it in
from the project's API settings:

| Variable                               | Purpose                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL, used by browser and server code.                                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key; every request is still constrained by Row Level Security.    |
| `SUPABASE_SERVICE_KEY`                 | Server-only. Bypasses Row Level Security, so it must never reach the browser. |
| `OPENAI_API_KEY`                       | Server-only. Enables reviewed shopping-list organization.                     |
| `OPENAI_ORGANIZER_MODEL`               | Optional model override; defaults to `gpt-5.6-luna`.                          |
| `OPENAI_ORGANIZER_REASONING`           | Optional reasoning override; defaults to `none` for responsive organization.  |

Apply the schema with the Supabase CLI, then start the app:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
pnpm dev
```

Before opening a pull request, run the full quality gate:

```bash
pnpm check   # format check, lint, typecheck, tests, dependency audit, and a production build
```

Three checks run against a real project rather than in CI. They create and delete
throwaway users and need `SUPABASE_SERVICE_KEY`, so they sit outside `pnpm check`:

```bash
set -a; . ./.env.local; set +a && pnpm verify:rls      # the access matrix
set -a; . ./.env.local; set +a && pnpm verify:routes   # every page renders (needs pnpm dev)
node --env-file=.env.local scripts/verify-shopping.mjs # shopping forms and list isolation (needs pnpm dev)
```

## Administrators

There is no way to become an administrator through the application. The
`user_roles` table has no write policy at all, so a role can only be granted out of
band with the service key. That is what makes privilege escalation impossible
rather than merely disallowed.
