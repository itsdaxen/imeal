import Image from "next/image";
import { Card } from "@heroui/react";

import { LinkCard } from "@/components/ui/link-card";
import { TagList } from "@/components/ui/tag-list";

import type { RecipeSummary } from "../recipe.queries";

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <LinkCard className="h-full hover:shadow-lg" density="compact">
      {recipe.image_url ? (
        <Card.Content className="h-36 flex-none overflow-hidden rounded-lg">
          <Image
            alt=""
            className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
            height={192}
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
            src={recipe.image_url}
            width={256}
          />
        </Card.Content>
      ) : null}

      <Card.Header className="gap-2">
        <TagList label="Meals this suits" tags={recipe.meal_tags} />
        <Card.Title className="text-base">
          <LinkCard.Target href={`/recipes/${recipe.id}`}>
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
