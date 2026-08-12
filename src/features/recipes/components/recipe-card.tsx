import { Card, Link, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { TagList } from "@/components/ui/tag-list";

import type { RecipeSummary } from "../recipe.queries";

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <ContentCard density="compact">
      <Card.Header>
        <TagList label="Meals this suits" tags={recipe.meal_tags} />
        <Typography type="h3" weight="semibold">
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
