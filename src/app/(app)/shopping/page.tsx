import type { Metadata } from "next";

import { Button, Link, Typography } from "@heroui/react";

import { AddItemForm } from "@/features/shopping/components/add-item-form";
import { ShoppingItemRow } from "@/features/shopping/components/shopping-item-row";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import {
  addStaplesToList,
  clearShoppingList,
  generateShoppingList,
} from "@/features/shopping/shopping.actions";
import { getShoppingList } from "@/features/shopping/shopping.queries";
import {
  addWeeks,
  formatWeekLabel,
  resolveWeekStart,
} from "@/features/planner/week";

export const metadata: Metadata = { title: "Shopping" };

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStart = resolveWeekStart(week);
  const list = await getShoppingList(weekStart);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography type="h1" weight="semibold">
            Shopping
          </Typography>
          <Typography className="text-muted" type="body-sm">
            {formatWeekLabel(weekStart)} · {list.remaining} left
          </Typography>
        </div>

        <nav aria-label="Change week" className="flex items-center gap-4">
          <Link href={`/shopping?week=${addWeeks(weekStart, -1)}`}>
            Previous
          </Link>
          <Link href="/shopping">This week</Link>
          <Link href={`/shopping?week=${addWeeks(weekStart, 1)}`}>Next</Link>
        </nav>
      </header>

      {list.planId === null ? (
        <Typography className="text-muted" type="body">
          Nothing is planned for this week yet.{" "}
          <Link href={`/planner?week=${weekStart}`}>Plan some meals</Link> and
          the list will follow.
        </Typography>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <form action={generateShoppingList}>
              <input name="weekStart" type="hidden" value={weekStart} />
              <Button type="submit">Build from the plan</Button>
            </form>

            <form action={addStaplesToList}>
              <input name="weekStart" type="hidden" value={weekStart} />
              <Button type="submit" variant="tertiary">
                Add staples
              </Button>
            </form>

            <Link className="self-center" href="/shopping/staples">
              Manage staples
            </Link>

            {list.items.length > 0 ? (
              <ConfirmActionForm
                action={clearShoppingList}
                confirmLabel="Clear the list"
                description="Every item goes, including the ones you added yourself and any staples. Building it again from the plan is one press away."
                fields={{ weekStart }}
                heading="Clear this shopping list?"
                label="Clear the list"
              />
            ) : null}
          </div>

          <AddItemForm weekStart={weekStart} />

          {list.items.length === 0 ? (
            <Typography className="text-muted" type="body">
              The list is empty. Build it from the plan, or add items yourself.
            </Typography>
          ) : (
            <ul className="flex list-none flex-col p-0">
              {list.items.map((item) => (
                <ShoppingItemRow
                  item={item}
                  key={item.id}
                  weekStart={weekStart}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
