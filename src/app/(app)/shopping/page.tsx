import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cn, Link, Typography } from "@heroui/react";

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
    <PageShell gap="snug" width="wide">
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

      <PageGrid>
        {/* The tabs live inside the panel rather than above it, so the open list reads
            as the front of a stack rather than a separate row of buttons. */}
        <ContentCard
          appearance="media"
          aria-label="Items"
          className={cn(span.full, "gap-0")}
          density="flush"
        >
          <nav
            aria-label="Shopping lists"
            className="flex min-w-0 shrink-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto border-b border-separator bg-default px-3 py-2 [&::-webkit-scrollbar]:hidden"
          >
            {lists.map((entry) => {
              const isOpen = entry.id === list.listId;

              return (
                <Link
                  aria-current={isOpen ? "page" : undefined}
                  className={`grid min-h-10 shrink-0 place-items-center rounded-full px-4 text-sm no-underline transition-colors ${
                    isOpen
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                  href={`/shopping?week=${weekStart}&list=${entry.id}`}
                  key={entry.id}
                >
                  {entry.name}
                  {entry.isOwn ? "" : " · shared"}
                </Link>
              );
            })}

            <NewListButton className="ml-1 min-h-10" />
          </nav>

          {list.listId ? (
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <AddItemForm key={list.listId} listId={list.listId} />

              {list.items.length === 0 ? (
                <EmptyState
                  bare
                  description="Add something above, or send your staples across from the list menu."
                  icon={
                    <ShoppingBasket aria-hidden="true" className="size-6" />
                  }
                  title="Nothing on this list yet"
                />
              ) : (
                <ShoppingItems items={list.items} />
              )}
            </div>
          ) : (
            <Typography className="p-6" color="muted" type="body">
              Create a shopping list to get started.
            </Typography>
          )}
        </ContentCard>
      </PageGrid>
    </PageShell>
  );
}
