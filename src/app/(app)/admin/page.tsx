import type { Metadata } from "next";

import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Button,
  Card,
  Input,
  Label,
  TextField,
  Typography,
} from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { ContentCard } from "@/components/ui/content-card";
import { ActionLink } from "@/components/ui/action";
import { Eyebrow } from "@/components/ui/eyebrow";
import { artworkFor, MealArtwork } from "@/components/ui/meal-artwork";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { TagList } from "@/components/ui/tag-list";

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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 pt-10 sm:pt-14">
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
        <section className="rounded-3xl border border-dashed border-border p-8 text-center sm:p-12">
          <SectionTitle>The queue is clear</SectionTitle>
          <Typography className="mt-2 text-muted" type="body">
            New catalog suggestions will appear here with everything needed to
            review them.
          </Typography>
        </section>
      ) : (
        <ul className="flex list-none flex-col gap-6 p-0">
          {pending.map((suggestion) => (
            <li key={suggestion.id}>
              <ContentCard className="overflow-hidden" density="flush">
                <div className="grid md:grid-cols-[15rem_minmax(0,1fr)]">
                  <div className="h-48 overflow-hidden md:h-full md:min-h-64">
                    {suggestion.recipe.imageUrl ? (
                      <Image
                        alt=""
                        className="size-full object-cover"
                        height={320}
                        sizes="(min-width: 768px) 15rem, 100vw"
                        src={suggestion.recipe.imageUrl}
                        width={400}
                      />
                    ) : (
                      <MealArtwork
                        artwork={artworkFor(suggestion.recipe.id)}
                        className="size-full"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-7">
                    <Card.Header className="gap-2 p-0">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={suggestion.author} />
                        <div>
                          <Eyebrow>Suggested by</Eyebrow>
                          <Typography type="body-sm" weight="medium">
                            {suggestion.author}
                          </Typography>
                        </div>
                      </div>
                      <SectionTitle>{suggestion.recipe.title}</SectionTitle>
                      <Typography className="text-muted" type="body-sm">
                        {suggestion.recipe.prepMinutes} min · serves{" "}
                        {suggestion.recipe.servings}
                      </Typography>
                      <TagList
                        label="Meals this suits"
                        tags={suggestion.recipe.mealTags}
                      />
                      <ActionLink
                        href={`/recipes/${suggestion.recipe.id}`}
                        tier="quiet"
                      >
                        Open full recipe
                      </ActionLink>
                    </Card.Header>

                    <div className="grid gap-6 border-t border-border/70 pt-5 sm:grid-cols-2">
                      <section>
                        <h3 className="font-semibold">Ingredients</h3>
                        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
                          {suggestion.recipe.ingredients.map((ingredient) => (
                            <li key={ingredient}>{ingredient}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h3 className="font-semibold">Method</h3>
                        <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-muted">
                          {suggestion.recipe.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </section>
                    </div>

                    {suggestion.recipe.tip ? (
                      <p className="rounded-xl bg-accent-soft/50 p-4 text-sm">
                        <span className="font-medium">Cook&apos;s note:</span>{" "}
                        {suggestion.recipe.tip}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Card.Footer className="flex-col items-stretch gap-4 border-t border-border/70 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                  <form action={approveSuggestion}>
                    <input
                      name="suggestionId"
                      type="hidden"
                      value={suggestion.id}
                    />
                    <Button className="w-full sm:w-auto" type="submit">
                      Publish to catalog
                    </Button>
                  </form>

                  <form
                    action={rejectSuggestion}
                    className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end"
                  >
                    <input
                      name="suggestionId"
                      type="hidden"
                      value={suggestion.id}
                    />
                    <TextField className="min-w-0 sm:w-72" name="note">
                      <Label>Reason for declining</Label>
                      <Input placeholder="Optional note for the author" />
                    </TextField>
                    <Button type="submit" variant="ghost">
                      Decline
                    </Button>
                  </form>
                </Card.Footer>
              </ContentCard>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
