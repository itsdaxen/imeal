import type { Metadata } from "next";

import { Button, Card, Link, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  copySharedRecipe,
  dropSharedRecipe,
} from "@/features/sharing/sharing.actions";
import { listRecipesSharedWithMe } from "@/features/sharing/sharing.queries";

export const metadata: Metadata = { title: "Shared with you" };

export default async function SharedRecipesPage() {
  const recipes = await listRecipesSharedWithMe();

  return (
    <main className="flex flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography type="h1" weight="semibold">
            Shared with you
          </Typography>
          <Typography className="text-muted" type="body-sm">
            Cook from a friend&apos;s recipe as-is, or save your own copy to
            change later.
          </Typography>
        </div>
        <Link href="/recipes">Your recipes</Link>
      </header>

      {recipes.length === 0 ? (
        <Typography className="text-muted" type="body">
          Nothing yet. When a friend shares a recipe it will appear here.
        </Typography>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <ContentCard density="compact">
                <Card.Header>
                  <Eyebrow>From {recipe.sharedBy}</Eyebrow>
                  <Typography type="h2" weight="semibold">
                    <Link
                      className="text-foreground no-underline"
                      href={`/recipes/${recipe.id}`}
                    >
                      {recipe.title}
                    </Link>
                  </Typography>
                </Card.Header>

                <Card.Footer className="flex-wrap justify-between gap-3">
                  <Typography className="text-muted" type="body-sm">
                    {recipe.prepMinutes} min · serves {recipe.servings}
                  </Typography>

                  <div className="flex items-center gap-1">
                    <form action={copySharedRecipe}>
                      <input name="recipeId" type="hidden" value={recipe.id} />
                      <Button size="sm" type="submit" variant="tertiary">
                        Save a copy
                      </Button>
                    </form>
                    <form action={dropSharedRecipe}>
                      <input name="recipeId" type="hidden" value={recipe.id} />
                      <Button size="sm" type="submit" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                </Card.Footer>
              </ContentCard>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
