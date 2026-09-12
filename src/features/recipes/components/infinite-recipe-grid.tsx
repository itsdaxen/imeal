"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { LoaderCircle } from "lucide-react";

import { CardGrid } from "@/components/ui/card-grid";
import { PendingButton } from "@/components/ui/pending-button";
import { restoreRecipe } from "@/features/recipes/recipe.actions";

import { RecipeCard } from "./recipe-card";
import type { RecipePage, RecipeSummary } from "../recipe.queries";

type LoadPage = (offset: number) => Promise<RecipePage>;

export function InfiniteRecipeGrid({
  initialPage,
  loadPage,
  hrefBase,
  restoreArchived = false,
}: {
  initialPage: RecipePage;
  loadPage: LoadPage;
  hrefBase?: string;
  restoreArchived?: boolean;
}) {
  const [recipes, setRecipes] = useState(initialPage.recipes);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  async function loadNextPage() {
    if (loading.current || !hasMore) return;

    loading.current = true;
    setIsLoading(true);
    setFailed(false);
    try {
      const page = await loadPage(recipes.length);
      setRecipes((current) => {
        const ids = new Set(current.map((recipe) => recipe.id));
        return [
          ...current,
          ...page.recipes.filter((recipe) => !ids.has(recipe.id)),
        ];
      });
      setHasMore(page.hasMore);
    } catch {
      setFailed(true);
    } finally {
      loading.current = false;
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || failed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadNextPage();
      },
      { rootMargin: "500px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  });

  return (
    <>
      <CardGrid>
        {recipes.map((recipe) => (
          <RecipeGridItem
            href={hrefBase ? `${hrefBase}/${recipe.id}` : undefined}
            key={recipe.id}
            recipe={recipe}
            restoreArchived={restoreArchived}
          />
        ))}
      </CardGrid>

      {hasMore || isLoading || failed ? (
        <div
          className="flex min-h-16 items-center justify-center"
          ref={sentinel}
        >
          {isLoading ? (
            <span
              className="inline-flex items-center gap-2 text-sm text-muted"
              role="status"
            >
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
              Loading more recipes
            </span>
          ) : failed ? (
            <Button onPress={() => void loadNextPage()} variant="tertiary">
              Try again
            </Button>
          ) : (
            <Button onPress={() => void loadNextPage()} variant="ghost">
              Load more recipes
            </Button>
          )}
        </div>
      ) : null}
    </>
  );
}

function RecipeGridItem({
  href,
  recipe,
  restoreArchived,
}: {
  href?: string;
  recipe: RecipeSummary;
  restoreArchived: boolean;
}) {
  return (
    <li className="flex flex-col gap-2">
      <RecipeCard href={href} recipe={recipe} />
      {restoreArchived ? (
        <form action={restoreRecipe}>
          <input name="recipeId" type="hidden" value={recipe.id} />
          <PendingButton className="min-h-11" variant="tertiary">
            Restore
          </PendingButton>
        </form>
      ) : null}
    </li>
  );
}
