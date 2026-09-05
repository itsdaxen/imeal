import type { Metadata } from "next";

import Image from "next/image";
import { Button } from "@heroui/react";

import { Library, SearchX } from "lucide-react";

import { SectionTitle } from "@/components/ui/section-title";
import { ActionLink } from "@/components/ui/action";

import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { withdrawSuggestion } from "@/features/catalog/catalog.actions";
import { RecipeCard } from "@/features/recipes/components/recipe-card";
import { CatalogSearch } from "@/features/catalog/components/catalog-search";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";
import { PageShell } from "@/components/ui/page-shell";
import {
  listCatalog,
  listCatalogCollections,
  listMySuggestions,
} from "@/features/catalog/catalog.queries";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Catalog" };

function toMealTag(value: string | undefined): MealSlot | undefined {
  return MEAL_SLOTS.find((slot) => slot === value);
}

const STATUS_LABEL = {
  pending: "Waiting for review",
  approved: "Published",
  rejected: "Not published",
} as const;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    mealTag?: string;
    collection?: string;
  }>;
}) {
  const { search, mealTag, collection } = await searchParams;
  const selectedMeal = toMealTag(mealTag);
  const [recipes, suggestions, collections] = await Promise.all([
    listCatalog({ search, mealTag: selectedMeal, collection }),
    listMySuggestions(),
    listCatalogCollections(),
  ]);

  return (
    <PageShell gap="loose">
      <PageHeader
        description={
          <>
            Recipes published for everyone. Save one and it becomes yours to
            edit.
          </>
        }
        title={<>Catalog</>}
      />

      <CatalogSearch
        collection={collection}
        collections={collections}
        mealTag={selectedMeal}
        search={search}
      />

      {recipes.length === 0 ? (
        <EmptyState
          actions={
            search ? (
              <ActionLink href="/catalog" tier="neutral">
                Clear the search
              </ActionLink>
            ) : null
          }
          description={
            search
              ? "No published recipe matches that name. Try a shorter word."
              : "Published recipes appear here once they clear moderation. Suggest one of yours to get it started."
          }
          icon={
            search ? (
              <SearchX aria-hidden="true" className="size-6" />
            ) : (
              <Library aria-hidden="true" className="size-6" />
            )
          }
          title={search ? "Nothing matches" : "The catalog is still empty"}
        />
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard href={`/catalog/${recipe.id}`} recipe={recipe} />
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 ? (
        <section className="flex max-w-3xl flex-col gap-3 border-t border-separator pt-6">
          <SectionTitle>Your suggestions</SectionTitle>

          <ContentCard density="compact">
            <ul className="flex list-none flex-col p-0">
              {suggestions.map((suggestion) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-separator py-3 last:border-b-0"
                  key={suggestion.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="size-14 shrink-0 overflow-hidden rounded-xl">
                      {suggestion.recipe.imageUrl ? (
                        <Image
                          alt=""
                          className="size-full object-cover"
                          height={56}
                          src={suggestion.recipe.imageUrl}
                          width={56}
                        />
                      ) : (
                        <MealArtwork
                          artwork={artworkFor(suggestion.recipe.id)}
                          className="size-full"
                        />
                      )}
                    </div>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {suggestion.recipe.title}
                      </span>
                      <span className="text-sm text-muted">
                        {STATUS_LABEL[suggestion.status]}
                      </span>
                      <span className="text-xs text-muted">
                        Submitted{" "}
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                        }).format(new Date(suggestion.createdAt))}
                      </span>
                      {suggestion.reviewerNote ? (
                        <span className="text-xs text-muted">
                          {suggestion.reviewerNote}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  {suggestion.status === "pending" ? (
                    <form action={withdrawSuggestion} className="ml-auto">
                      <input
                        name="suggestionId"
                        type="hidden"
                        value={suggestion.id}
                      />
                      <Button
                        className="min-h-11"
                        type="submit"
                        variant="ghost"
                      >
                        Withdraw
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </ContentCard>
        </section>
      ) : null}
    </PageShell>
  );
}
