import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Button,
  Card,
  Disclosure,
  Label,
  Link,
  ListBox,
  Select,
  Typography,
} from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PageGrid, span } from "@/components/ui/page-grid";
import { PanelTitle } from "@/components/ui/panel-title";

import { AddItemForm } from "@/features/shopping/components/add-item-form";
import { ShoppingItemRow } from "@/features/shopping/components/shopping-item-row";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import {
  addStaplesToList,
  clearShoppingList,
  generateShoppingList,
  setWeekList,
} from "@/features/shopping/shopping.actions";
import { ListPanel } from "@/features/shopping/components/list-panel";
import { TidyPanel } from "@/features/ai/components/tidy-panel";
import {
  getShoppingList,
  listMembers,
  listShoppingLists,
} from "@/features/shopping/shopping.queries";
import { listSchema } from "@/features/shopping/shopping.schema";
import { listFriends } from "@/features/friends/friend.queries";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  addWeeks,
  formatWeekLabel,
  resolveWeekStart,
} from "@/features/planner/week";

export const metadata: Metadata = { title: "Shopping" };

export default async function ShoppingPage({
  searchParams,
}: PageProps<"/shopping">) {
  const { week, list: requestedListId } = await searchParams;
  if (
    requestedListId !== undefined &&
    !listSchema.safeParse({ listId: requestedListId }).success
  ) {
    notFound();
  }
  const weekStart = resolveWeekStart(
    typeof week === "string" ? week : undefined,
  );
  const [list, lists, friends, user] = await Promise.all([
    getShoppingList(
      weekStart,
      typeof requestedListId === "string" ? requestedListId : undefined,
    ),
    listShoppingLists(),
    listFriends(),
    getCurrentUser(),
  ]);

  if (requestedListId !== undefined && !list.listId) {
    notFound();
  }

  const members = list.listId ? await listMembers(list.listId) : [];
  const destination = lists.find((entry) => entry.id === list.targetListId);
  const weekHref = (value: string) =>
    `/shopping?week=${value}${list.listId ? `&list=${list.listId}` : ""}`;

  return (
    <main className="flex flex-col gap-6 pt-10 sm:pt-14">
      <header className="flex flex-col gap-1">
        <Eyebrow tone="info">Shopping</Eyebrow>
        <Typography type="h1" weight="semibold">
          {list.listName}
        </Typography>
        <Typography color="muted" type="body">
          {list.remaining} {list.remaining === 1 ? "item" : "items"} left
        </Typography>
      </header>

      <nav aria-label="Shopping lists" className="flex flex-wrap gap-2">
        {lists.map((entry) => (
          <Link
            aria-current={entry.id === list.listId ? "page" : undefined}
            className={`min-h-11 rounded-full px-4 py-3 text-sm no-underline ${entry.id === list.listId ? "bg-foreground font-medium text-background" : "bg-surface text-foreground"}`}
            href={`/shopping?week=${weekStart}&list=${entry.id}`}
            key={entry.id}
          >
            {entry.name}
            {entry.isOwn ? "" : " · shared"}
          </Link>
        ))}
      </nav>

      <PageGrid>
        {list.listId ? (
          <ContentCard aria-label="Items" className={span.full}>
            <AddItemForm key={list.listId} listId={list.listId} />
            <div className="flex flex-wrap items-center gap-3">
              <form action={addStaplesToList}>
                <input name="listId" type="hidden" value={list.listId} />
                <Button type="submit" variant="tertiary">
                  Add staples
                </Button>
              </form>
              <ActionLink href="/shopping/staples" tier="quiet">
                Manage staples
              </ActionLink>
              {list.items.length > 0 ? (
                <ConfirmActionForm
                  action={clearShoppingList}
                  confirmLabel="Clear the list"
                  description={`Remove every item from “${list.listName}”, including manual items and staples? This cannot be undone.`}
                  fields={{ listId: list.listId }}
                  heading="Clear this shopping list?"
                  label="Clear the list"
                />
              ) : null}
            </div>
            {list.items.length === 0 ? (
              <Typography color="muted" type="body">
                This list is empty. Add an item or your staples to get started.
              </Typography>
            ) : (
              <>
                <ul className="flex list-none flex-col p-0">
                  {list.items.map((item) => (
                    <ShoppingItemRow item={item} key={item.id} />
                  ))}
                </ul>
                <TidyPanel
                  items={list.items}
                  key={list.listId}
                  listId={list.listId}
                />
              </>
            )}
          </ContentCard>
        ) : (
          <Typography color="muted" type="body">
            Create a shopping list below to get started.
          </Typography>
        )}

        <ContentCard aria-label="Meal plan ingredients" className={span.full}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Card.Header className="gap-1">
              <Eyebrow>This week</Eyebrow>
              <PanelTitle>Meal plan ingredients</PanelTitle>
              <Card.Description>{formatWeekLabel(weekStart)}</Card.Description>
            </Card.Header>
            <nav aria-label="Change week" className="flex flex-wrap gap-4">
              <Link href={weekHref(addWeeks(weekStart, -1))}>Previous</Link>
              <Link href={weekHref(resolveWeekStart(undefined))}>
                This week
              </Link>
              <Link href={weekHref(addWeeks(weekStart, 1))}>Next</Link>
            </nav>
          </div>
          {list.planId ? (
            <>
              <form
                action={setWeekList}
                className="flex flex-wrap items-end gap-3"
              >
                <input name="weekStart" type="hidden" value={weekStart} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Label id="destination-list">
                    Send this week’s ingredients to
                  </Label>
                  <Select
                    aria-labelledby="destination-list"
                    defaultSelectedKey={list.targetListId ?? undefined}
                    key={`${weekStart}-${list.targetListId}`}
                    name="listId"
                    placeholder="Choose a list"
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {lists.map((entry) => (
                          <ListBox.Item
                            id={entry.id}
                            key={entry.id}
                            textValue={entry.name}
                          >
                            {entry.name}
                            {entry.isOwn ? "" : " · shared"}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                <Button type="submit" variant="tertiary">
                  Save destination
                </Button>
              </form>
              {destination ? (
                <div className="flex flex-wrap items-center gap-3">
                  <form action={generateShoppingList}>
                    <input name="weekStart" type="hidden" value={weekStart} />
                    <input name="listId" type="hidden" value={destination.id} />
                    <Button data-action-tier="primary" type="submit">
                      Build from the plan
                    </Button>
                  </form>
                  <Typography color="muted" type="body-sm">
                    Adds ingredients to{" "}
                    <Link
                      href={`/shopping?week=${weekStart}&list=${destination.id}`}
                    >
                      {destination.name}
                    </Link>
                    .
                  </Typography>
                </div>
              ) : null}
            </>
          ) : (
            <Typography color="muted" type="body">
              No meal plan for this week. You can still shop from your lists, or{" "}
              <Link href={`/planner?week=${weekStart}`}>plan some meals</Link>{" "}
              to add their ingredients.
            </Typography>
          )}
        </ContentCard>

        <Disclosure className={span.full}>
          <Disclosure.Heading>
            <Disclosure.Trigger>
              Manage lists and sharing
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>
              <ListPanel
                currentUserId={user?.id ?? ""}
                friends={friends}
                listId={list.listId}
                lists={lists}
                members={members}
              />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </PageGrid>
    </main>
  );
}
