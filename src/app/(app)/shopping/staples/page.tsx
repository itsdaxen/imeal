import type { Metadata } from "next";

import { ShoppingBasket } from "lucide-react";
import { Input, Label, TextField, Typography } from "@heroui/react";

import { BackLink } from "@/components/ui/back-link";
import { SectionTitle } from "@/components/ui/section-title";
import { ActionButton } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageGrid, span } from "@/components/ui/page-grid";
import { StapleMenu } from "@/features/shopping/components/staple-menu";
import { addStaple } from "@/features/shopping/shopping.actions";
import { listStaples } from "@/features/shopping/shopping.queries";

export const metadata: Metadata = { title: "Staples" };

export default async function StaplesPage() {
  const staples = await listStaples();
  const active = staples.filter((staple) => staple.active);
  const paused = staples.filter((staple) => !staple.active);

  function rows(items: typeof staples) {
    return (
      <ul className="flex list-none flex-col p-0">
        {items.map((staple) => (
          <li
            className="flex min-h-14 items-center justify-between gap-3 border-b border-separator last:border-b-0"
            key={staple.id}
          >
            <span className={staple.active ? undefined : "text-muted"}>
              {staple.name}
            </span>
            <StapleMenu
              active={staple.active}
              id={staple.id}
              name={staple.name}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="flex w-full flex-col gap-6 pt-10 sm:pt-14">
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
          <>
            <ContentCard aria-label="Active staples" className={span.wide}>
              <SectionTitle>Ready to add · {active.length}</SectionTitle>
              {active.length > 0 ? (
                rows(active)
              ) : (
                <Typography color="muted" type="body-sm">
                  Resume a paused staple when you need it again.
                </Typography>
              )}
            </ContentCard>

            {/* Sits under the active list rather than beside the composer. */}
            {paused.length > 0 ? (
              <ContentCard
                aria-label="Paused staples"
                className={`${span.wide} lg:col-start-5`}
              >
                <SectionTitle>Paused · {paused.length}</SectionTitle>
                {rows(paused)}
              </ContentCard>
            ) : null}
          </>
        )}
      </PageGrid>
    </main>
  );
}
