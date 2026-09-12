import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InfiniteRecipeGrid } from "./infinite-recipe-grid";
import type { RecipeSummary } from "../recipe.queries";

vi.mock("./recipe-card", () => ({
  RecipeCard: ({ href, recipe }: { href?: string; recipe: RecipeSummary }) => (
    <a href={href ?? `/recipes/${recipe.id}`}>{recipe.title}</a>
  ),
}));

let reachEnd: (() => void) | undefined;

const recipe = (id: string): RecipeSummary => ({
  id,
  title: `Recipe ${id}`,
  prep_minutes: 20,
  servings: 2,
  meal_tags: ["dinner"],
  collection_tags: [],
  image_url: null,
});

beforeEach(() => {
  reachEnd = undefined;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        reachEnd = () => callback([{ isIntersecting: true }]);
      }
      observe() {}
      disconnect() {}
    },
  );
});

describe("InfiniteRecipeGrid", () => {
  it("appends only the next page when the sentinel is reached", async () => {
    const loadPage = vi.fn().mockResolvedValue({
      recipes: [recipe("2"), recipe("3")],
      hasMore: false,
    });

    render(
      <InfiniteRecipeGrid
        hrefBase="/catalog"
        initialPage={{ recipes: [recipe("1"), recipe("2")], hasMore: true }}
        loadPage={loadPage}
      />,
    );

    await act(async () => reachEnd?.());

    expect(loadPage).toHaveBeenCalledOnce();
    expect(loadPage).toHaveBeenCalledWith(2);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Recipe 3" })).toHaveAttribute(
      "href",
      "/catalog/3",
    );
  });

  it("offers a retry when loading fails", async () => {
    const loadPage = vi.fn().mockRejectedValue(new Error("offline"));

    render(
      <InfiniteRecipeGrid
        initialPage={{ recipes: [recipe("1")], hasMore: true }}
        loadPage={loadPage}
      />,
    );

    await act(async () => reachEnd?.());

    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Recipe 1" })).toBeVisible();
  });
});
