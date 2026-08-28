import { Button, Typography } from "@heroui/react";

import type { Suggestion } from "../catalog.queries";
import { suggestRecipe, withdrawSuggestion } from "../catalog.actions";

type SuggestFormProps = {
  recipeId: string;
  suggestion?: Suggestion;
};

export function SuggestForm({ recipeId, suggestion }: SuggestFormProps) {
  if (suggestion?.status === "approved") {
    return (
      <Typography className="text-muted" type="body-sm">
        Published to the catalog.
      </Typography>
    );
  }

  if (suggestion?.status === "pending") {
    return (
      <form action={withdrawSuggestion} className="flex items-center gap-3">
        <input name="suggestionId" type="hidden" value={suggestion.id} />
        <Typography className="text-muted" type="body-sm">
          Waiting for review.
        </Typography>
        <Button className="min-h-11" type="submit" variant="ghost">
          Withdraw
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {suggestion?.status === "rejected" ? (
        <Typography className="text-muted" type="body-sm">
          Not published
          {suggestion.reviewerNote ? ` — ${suggestion.reviewerNote}` : ""}.
        </Typography>
      ) : null}

      <form action={suggestRecipe}>
        <input name="recipeId" type="hidden" value={recipeId} />
        <Button className="min-h-11" type="submit" variant="tertiary">
          Suggest for the catalog
        </Button>
      </form>
    </div>
  );
}
