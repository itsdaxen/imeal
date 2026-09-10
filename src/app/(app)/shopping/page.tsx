import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cn, Typography } from "@heroui/react";

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
import { ShoppingItems } from "@/features/shopping/components/shopping-items";
import {
  getShoppingList,
  listMembers,
  listShoppingLists,
  listStaples,
} from "@/features/shopping/shopping.queries";
import { listSchema } from "@/features/shopping/shopping.schema";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";
import { namesToAdd } from "@/lib/names";
import { ListTabs } from "@/features/shopping/components/list-tabs";

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
  const [list, lists, friends, user, staples] = await Promise.all([
    getShoppingList(
      weekStart,
      typeof requestedListId === "string" ? requestedListId : undefined,
    ),
    listShoppingLists(),
    listFriends(),
    getCurrentUser(),
    listStaples(),
  ]);

  if (requestedListId !== undefined && !list.listId) {
    notFound();
  }

  const members = list.listId ? await listMembers(list.listId) : [];
  const open = lists.find((entry) => entry.id === list.listId);

  // Counted here, with the same rule the action uses, so the menu can say what
  // pressing it will do instead of quietly doing nothing.
  const activeStaples = staples
    .filter((staple) => staple.active)
    .map((staple) => staple.name);
  const staplesToAdd = namesToAdd(
    activeStaples,
    list.items.map((item) => item.name),
  ).length;

  return (
    <PageShell gap="snug" width="wide">
      <PageHeader
        actions={
          list.listId ? (
            <ListToolbar
              currentUserId={user?.id ?? ""}
              friends={friends}
              isDefault={open?.isDefault ?? false}
              isOwn={open?.isOwn ?? false}
              hasStaples={activeStaples.length > 0}
              listId={list.listId}
              listName={list.listName}
              members={members}
              staplesToAdd={staplesToAdd}
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
          <ListTabs
            lists={lists.map((entry) => ({
              id: entry.id,
              isOwn: entry.isOwn,
              name: entry.name,
            }))}
            openListId={list.listId}
            weekStart={weekStart}
          >
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
          </ListTabs>
        </ContentCard>
      </PageGrid>
    </PageShell>
  );
}
