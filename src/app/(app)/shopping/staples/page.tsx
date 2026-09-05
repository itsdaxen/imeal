import type { Metadata } from "next";

import { ShoppingBasket } from "lucide-react";
import { Input, Label, TextField, Typography } from "@heroui/react";

import { BackLink } from "@/components/ui/back-link";
import { ActionButton } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageGrid, span } from "@/components/ui/page-grid";
import { StaplesList } from "@/features/shopping/components/staples-list";
import { addStaple } from "@/features/shopping/shopping.actions";
import { listStaples } from "@/features/shopping/shopping.queries";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = { title: "Staples" };

export default async function StaplesPage() {
  const staples = await listStaples();

  return (
    <PageShell gap="snug">
      <header className="flex max-w-2xl flex-col gap-2">
        <BackLink href="/shopping">Shopping</BackLink>
        <Typography type="h1" weight="semibold">
          Staples
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Things you buy most weeks. Add them to a list in one step, and pause
          the ones you do not need right now.
        </Typography>
      </header>

      <PageGrid>
        <ContentCard
          aria-label="Add a staple"
          className={`${span.narrow} self-start`}
        >
          <form
            action={addStaple}
            className="all-required flex items-end gap-3"
          >
            <TextField className="min-w-0 flex-1" isRequired name="name">
              <Label>Add a staple</Label>
              <Input placeholder="Milk" />
            </TextField>
            <ActionButton tier="primary" type="submit">
              Add
            </ActionButton>
          </form>
        </ContentCard>

        {staples.length === 0 ? (
          <div className={span.full}>
            <EmptyState
              description="Add the things you buy most weeks, then send them to any shopping list in one step."
              icon={<ShoppingBasket aria-hidden="true" className="size-6" />}
              title="No staples yet"
            />
          </div>
        ) : (
          <StaplesList staples={staples} />
        )}
      </PageGrid>
    </PageShell>
  );
}
