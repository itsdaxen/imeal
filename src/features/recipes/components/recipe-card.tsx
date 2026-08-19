import Image from "next/image";
import { Card, Link, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { TagList } from "@/components/ui/tag-list";

import type { RecipeSummary } from "../recipe.queries";

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <ContentCard density="compact">
      {recipe.image_url ? (
        <Image
          alt=""
          className="aspect-4/3 w-full rounded-2xl object-cover"
          height={192}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw"
          src={recipe.image_url}
          width={256}
        />
      ) : null}

      <Card.Header>
        <TagList label="Meals this suits" tags={recipe.meal_tags} />
        <Typography type="h2" weight="semibold">
          <Link
            className="text-foreground no-underline"
            href={`/recipes/${recipe.id}`}
          >
            {recipe.title}
          </Link>
        </Typography>
      </Card.Header>

      <Card.Footer>
        <Typography className="text-muted" type="body-sm">
          {recipe.prep_minutes} min · serves {recipe.servings}
        </Typography>
      </Card.Footer>
    </ContentCard>
  );
}
