import type { Metadata } from "next";

import Image from "next/image";
import { Button, Card, Link, Typography } from "@heroui/react";

import { UsersRound } from "lucide-react";

import { BackLink } from "@/components/ui/back-link";
import { SectionTitle } from "@/components/ui/section-title";
import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Eyebrow } from "@/components/ui/eyebrow";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { TagList } from "@/components/ui/tag-list";
import { ActionLink } from "@/components/ui/action";
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
      <header className="flex max-w-2xl flex-col gap-2">
        <BackLink href="/recipes">Your recipes</BackLink>
        <Typography type="h1" weight="semibold">
          Shared with you
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Cook from a friend&apos;s recipe as-is, or save your own copy to
          change later.
        </Typography>
      </header>

      {recipes.length === 0 ? (
        <EmptyState
          actions={
            <ActionLink href="/friends" tier="primary">
              Find friends
            </ActionLink>
          }
          description="Add people you cook with, then recipes they send you will collect here until you remove them."
          icon={<UsersRound aria-hidden="true" className="size-6" />}
          title="Your shared cookbook starts with a friend"
        />
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <ContentCard className="h-full overflow-hidden" density="flush">
                <Link
                  aria-label={`Open ${recipe.title}`}
                  className="block h-40 w-full flex-none overflow-hidden"
                  href={`/recipes/${recipe.id}`}
                >
                  {recipe.imageUrl ? (
                    <Image
                      alt=""
                      className="size-full object-cover transition-transform duration-300 hover:scale-105 motion-reduce:transition-none"
                      height={192}
                      sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
                      src={recipe.imageUrl}
                      width={352}
                    />
                  ) : (
                    <MealArtwork
                      artwork={artworkFor(recipe.id)}
                      className="size-full transition-transform duration-300 hover:scale-105 motion-reduce:transition-none"
                    />
                  )}
                </Link>

                <Card.Header className="gap-2 px-5 pt-5">
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={recipe.sharedBy} />
                    <div>
                      <Eyebrow>Shared by</Eyebrow>
                      <Typography type="body-sm" weight="medium">
                        {recipe.sharedBy}
                      </Typography>
                    </div>
                  </div>
                  <SectionTitle>
                    <Link
                      className="text-foreground no-underline"
                      href={`/recipes/${recipe.id}`}
                    >
                      {recipe.title}
                    </Link>
                  </SectionTitle>
                  <TagList label="Meals this suits" tags={recipe.mealTags} />
                  <Typography className="text-muted" type="body-sm">
                    {recipe.prepMinutes} min · serves {recipe.servings}
                  </Typography>
                </Card.Header>

                <Card.Footer className="mt-auto flex-wrap justify-between gap-2 px-5 pb-5">
                  <ActionLink href={`/recipes/${recipe.id}`} tier="quiet">
                    View recipe
                  </ActionLink>
                  <div className="flex flex-wrap items-center gap-1">
                    <form action={copySharedRecipe}>
                      <input name="recipeId" type="hidden" value={recipe.id} />
                      <Button
                        className="min-h-11"
                        type="submit"
                        variant="tertiary"
                      >
                        Save a copy
                      </Button>
                    </form>
                    <form action={dropSharedRecipe}>
                      <input name="recipeId" type="hidden" value={recipe.id} />
                      <Button
                        className="min-h-11"
                        type="submit"
                        variant="ghost"
                      >
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
