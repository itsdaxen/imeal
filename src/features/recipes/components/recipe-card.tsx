import Image from "next/image";
import { Card, cn } from "@heroui/react";

import { LinkCard } from "@/components/ui/link-card";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { TagList } from "@/components/ui/tag-list";

import type { RecipeSummary } from "../recipe.queries";

/**
 * One recipe, wherever recipes are listed.
 *
 * The dashboard drew its own copy of this card because its query returned a different
 * shape of the same rows. Two cards that looked identical would have drifted apart the
 * first time one of them gained a badge, so the query now hands back `RecipeSummary`
 * and everyone draws the card from here.
 */
export function RecipeCard({
  className,
  href,
  recipe,
}: {
  className?: string;
  href?: string;
  recipe: RecipeSummary;
}) {
  return (
    <LinkCard
      className={cn("h-full hover:shadow-lg", className)}
      density="compact"
    >
      <Card.Content className="h-36 flex-none overflow-hidden rounded-xl">
        {recipe.image_url ? (
          <Image
            alt=""
            className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
            height={192}
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
            src={recipe.image_url}
            width={256}
          />
        ) : (
          <MealArtwork
            artwork={artworkFor(recipe.id)}
            className="size-full transition-transform duration-300 motion-safe:group-hover:scale-105"
          />
        )}
      </Card.Content>

      <Card.Header className="gap-2">
        <TagList label="Meals this suits" tags={recipe.meal_tags} />
        {recipe.collection_tags.length > 0 ? (
          <TagList label="Collections" tags={recipe.collection_tags} />
        ) : null}
        <Card.Title className="text-base">
          <LinkCard.Target href={href ?? `/recipes/${recipe.id}`}>
            {recipe.title}
          </LinkCard.Target>
        </Card.Title>
        <Card.Description>
          {recipe.prep_minutes} min · serves {recipe.servings}
        </Card.Description>
      </Card.Header>
    </LinkCard>
  );
}
