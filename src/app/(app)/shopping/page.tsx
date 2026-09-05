import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link, Typography } from "@heroui/react";

import { ShoppingBasket } from "lucide-react";

import { ContentCard } from "@/components/ui/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageGrid, span } from "@/components/ui/page-grid";
import { TidyPanel } from "@/features/ai/components/tidy-panel";
import { getCurrentUser } from "@/features/auth/current-user";
import { listFriends } from "@/features/friends/friend.queries";
import { resolveWeekStart } from "@/features/planner/week";
import { AddItemForm } from "@/features/shopping/components/add-item-form";
import { ListToolbar } from "@/features/shopping/components/list-toolbar";
import { NewListButton } from "@/features/shopping/components/new-list-button";
import { ShoppingItems } from "@/features/shopping/components/shopping-items";
import {
  getShoppingList,
  listMembers,
  listShoppingLists,
} from "@/features/shopping/shopping.queries";
import { listSchema } from "@/features/shopping/shopping.schema";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";

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
  const open = lists.find((entry) => entry.id === list.listId);

  return (
    <PageShell gap="snug" width="narrow">
      <PageHeader
        actions={
          list.listId ? (
            <ListToolbar
              currentUserId={user?.id ?? ""}
              friends={friends}
              isOwn={open?.isOwn ?? false}
              listId={list.listId}
              listName={list.listName}
              members={members}
            >
              {list.items.length > 0 ? (
                <TidyPanel items={list.items} listId={list.listId} />
              ) : null}
            </ListToolbar>
          ) : null
        }
        description={
          <>
            {list.remaining} {list.remaining === 1 ? "item" : "items"} left
            {members.length > 1 ? ` · ${members.length} collaborators` : ""}
          </>
        }
        title={list.listName}
      />

      <nav aria-label="Shopping lists" className="flex flex-col gap-2 py-4">
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
          {lists.map((entry) => (
            <Link
              aria-current={entry.id === list.listId ? "page" : undefined}
              className={`min-h-11 shrink-0 rounded-full px-4 py-3 text-sm no-underline ${
                entry.id === list.listId
                  ? "bg-foreground font-medium text-background"
                  : "bg-surface text-foreground"
              }`}
              href={`/shopping?week=${weekStart}&list=${entry.id}`}
              key={entry.id}
            >
              {entry.name}
              {entry.isOwn ? "" : " · shared"}
            </Link>
          ))}
          <NewListButton />
        </div>
      </nav>

      <PageGrid>
        {list.listId ? (
          <ContentCard aria-label="Items" className={span.full}>
            <AddItemForm key={list.listId} listId={list.listId} />

            {list.items.length === 0 ? (
              <EmptyState
                bare
                description="Add something above, or send your staples across from the list menu."
                icon={<ShoppingBasket aria-hidden="true" className="size-6" />}
                title="Nothing on this list yet"
              />
            ) : (
              <ShoppingItems items={list.items} />
            )}
          </ContentCard>
        ) : (
          <Typography className={span.full} color="muted" type="body">
            Create a shopping list to get started.
          </Typography>
        )}
      </PageGrid>
    </PageShell>
  );
}
