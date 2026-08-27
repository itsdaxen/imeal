import type { Metadata } from "next";

import Image from "next/image";
import {
  Button,
  Card,
  Input,
  Label,
  Link,
  TextField,
  Typography,
} from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { TagList } from "@/components/ui/tag-list";
import {
  saveCatalogRecipe,
  withdrawSuggestion,
} from "@/features/catalog/catalog.actions";
import {
  listCatalog,
  listMySuggestions,
} from "@/features/catalog/catalog.queries";

export const metadata: Metadata = { title: "Catalog" };

const STATUS_LABEL = {
  pending: "Waiting for review",
  approved: "Published",
  rejected: "Not published",
} as const;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [recipes, suggestions] = await Promise.all([
    listCatalog(search),
    listMySuggestions(),
  ]);

  return (
    <main className="flex flex-col gap-10 pt-10 sm:pt-14">
      <header className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Catalog
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Recipes published for everyone. Save one and it becomes yours to edit.
        </Typography>
      </header>

      <form
        action="/catalog"
        className="flex flex-wrap items-end gap-3"
        role="search"
      >
        <TextField
          className="min-w-56 flex-1"
          defaultValue={search}
          name="search"
        >
          <Label>Search the catalog</Label>
          <Input placeholder="Title contains…" type="search" />
        </TextField>
        <Button type="submit" variant="tertiary">
          Search
        </Button>
      </form>

      {recipes.length === 0 ? (
        <Typography className="text-muted" type="body">
          {search
            ? "Nothing matches that search."
            : "The catalog is empty for now."}
        </Typography>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <ContentCard className="h-full" density="compact">
                <Card.Content className="h-36 flex-none overflow-hidden rounded-lg">
                  {recipe.imageUrl ? (
                    <Image
                      alt=""
                      className="size-full object-cover"
                      height={192}
                      sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
                      src={recipe.imageUrl}
                      width={320}
                    />
                  ) : (
                    <MealArtwork
                      artwork={artworkFor(recipe.id)}
                      className="size-full"
                    />
                  )}
                </Card.Content>
                <Card.Header>
                  <TagList label="Meals this suits" tags={recipe.mealTags} />
                  <Typography type="h2" weight="semibold">
                    <Link
                      className="text-foreground no-underline"
                      href={`/recipes/${recipe.id}`}
                    >
                      {recipe.title}
                    </Link>
                  </Typography>
                </Card.Header>

                <Card.Footer className="justify-between">
                  <Typography className="text-muted" type="body-sm">
                    {recipe.prepMinutes} min · serves {recipe.servings}
                  </Typography>

                  <form action={saveCatalogRecipe}>
                    <input name="recipeId" type="hidden" value={recipe.id} />
                    <Button size="sm" type="submit" variant="tertiary">
                      Save a copy
                    </Button>
                  </form>
                </Card.Footer>
              </ContentCard>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 ? (
        <section className="flex flex-col gap-3 border-t border-border/60 pt-6">
          <Typography type="h2" weight="semibold">
            Your suggestions
          </Typography>

          <ul className="flex list-none flex-col p-0">
            {suggestions.map((suggestion) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3"
                key={suggestion.id}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{suggestion.recipe.title}</span>
                  <span className="text-sm text-muted">
                    {STATUS_LABEL[suggestion.status]}
                    {suggestion.reviewerNote
                      ? ` — ${suggestion.reviewerNote}`
                      : ""}
                  </span>
                </div>

                {suggestion.status === "pending" ? (
                  <form action={withdrawSuggestion}>
                    <input
                      name="suggestionId"
                      type="hidden"
                      value={suggestion.id}
                    />
                    <Button size="sm" type="submit" variant="ghost">
                      Withdraw
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
