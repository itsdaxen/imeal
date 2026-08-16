import type { Metadata } from "next";

import { notFound } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Link,
  TextField,
  Typography,
} from "@heroui/react";

import {
  approveSuggestion,
  rejectSuggestion,
} from "@/features/catalog/catalog.actions";
import {
  isCurrentUserAdmin,
  listPendingSuggestions,
} from "@/features/catalog/catalog.queries";

export const metadata: Metadata = { title: "Moderation" };

export default async function AdminPage() {
  // The functions behind these actions check is_admin() themselves; this only
  // keeps the page from existing for everyone else.
  if (!(await isCurrentUserAdmin())) {
    notFound();
  }

  const pending = await listPendingSuggestions();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Moderation
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Approving copies the recipe into the catalog. The author keeps their
          own.
        </Typography>
      </header>

      {pending.length === 0 ? (
        <Typography className="text-muted" type="body">
          Nothing is waiting for review.
        </Typography>
      ) : (
        <ul className="flex list-none flex-col gap-4 p-0">
          {pending.map((suggestion) => (
            <li
              className="flex flex-col gap-3 rounded-2xl border border-border/80 p-4"
              key={suggestion.id}
            >
              <Link href={`/recipes/${suggestion.recipe.id}`}>
                {suggestion.recipe.title}
              </Link>

              <div className="flex flex-wrap items-end gap-3">
                <form action={approveSuggestion}>
                  <input
                    name="suggestionId"
                    type="hidden"
                    value={suggestion.id}
                  />
                  <Button size="sm" type="submit">
                    Publish
                  </Button>
                </form>

                <form
                  action={rejectSuggestion}
                  className="flex items-end gap-2"
                >
                  <input
                    name="suggestionId"
                    type="hidden"
                    value={suggestion.id}
                  />
                  <TextField className="min-w-56" name="note">
                    <Label>Reason</Label>
                    <Input placeholder="Optional note for the author" />
                  </TextField>
                  <Button size="sm" type="submit" variant="ghost">
                    Decline
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
