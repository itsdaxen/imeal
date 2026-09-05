import type { Metadata } from "next";

import { Button, Disclosure, Link } from "@heroui/react";

import { FillWeekForm } from "@/features/planner/components/fill-week-form";
import { PlannerOptions } from "@/features/planner/components/planner-options";
import { SharedWeekInbox } from "@/features/planner/components/shared-week-inbox";
import {
  listPlanRecipients,
  listPlansSharedWithMe,
} from "@/features/planner/plan-sharing.queries";
import { listFriends } from "@/features/friends/friend.queries";
import { WeekGrid } from "@/features/planner/components/week-grid";
import { ContentCard } from "@/components/ui/content-card";
import { getWeekPlan } from "@/features/planner/plan.queries";
import { generateShoppingList } from "@/features/shopping/shopping.actions";
import { PageShell } from "@/components/ui/page-shell";
import {
  listShoppingLists,
  resolveWeekList,
} from "@/features/shopping/shopping.queries";
import {
  addWeeks,
  formatWeekLabel,
  resolveWeekStart,
} from "@/features/planner/week";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Planner" };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStart = resolveWeekStart(week);
  const [plan, sharedWithMe, friends, recipientIds, lists, destination] =
    await Promise.all([
      getWeekPlan(weekStart),
      listPlansSharedWithMe(),
      listFriends(),
      listPlanRecipients(weekStart),
      listShoppingLists(),
      resolveWeekList(weekStart),
    ]);

  return (
    <PageShell>
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <PlannerOptions
              friends={friends}
              hasMeals={plan.meals.length > 0}
              recipientIds={recipientIds}
              weekStart={weekStart}
            />
          </div>
        }
        description={formatWeekLabel(weekStart)}
        title={<>Planner</>}
      />

      <SharedWeekInbox plans={sharedWithMe} weekStart={weekStart} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <FillWeekForm
          compact
          enabledSlots={plan.enabledSlots}
          lists={lists}
          targetListId={destination.listId}
          weekStart={weekStart}
        />

        <form action={generateShoppingList}>
          <input name="weekStart" type="hidden" value={weekStart} />
          <input name="listId" type="hidden" value={destination.listId ?? ""} />
          <Button
            className="min-h-11"
            isDisabled={plan.meals.length === 0 || !destination.listId}
            type="submit"
            variant="tertiary"
          >
            Add to shopping list
          </Button>
        </form>
      </div>

      <ContentCard className="w-full" density="flush">
        <Disclosure>
          <Disclosure.Heading>
            <Disclosure.Trigger className="flex min-h-11 w-full items-center gap-4 px-5 py-2 text-left sm:px-6">
              <span className="font-semibold">More options</span>
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>

          <Disclosure.Content>
            <Disclosure.Body className="border-t border-separator px-5 py-5 sm:px-6">
              <FillWeekForm
                enabledSlots={plan.enabledSlots}
                lists={lists}
                targetListId={destination.listId}
                weekStart={weekStart}
              />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </ContentCard>

      <WeekGrid plan={plan} weekStart={weekStart} />

      <nav
        aria-label="Change week"
        className="flex items-center justify-center gap-6"
      >
        <Link
          className="inline-flex min-h-11 items-center"
          href={`/planner?week=${addWeeks(weekStart, -1)}`}
        >
          Previous
        </Link>
        <Link className="inline-flex min-h-11 items-center" href="/planner">
          This week
        </Link>
        <Link
          className="inline-flex min-h-11 items-center"
          href={`/planner?week=${addWeeks(weekStart, 1)}`}
        >
          Next
        </Link>
      </nav>
    </PageShell>
  );
}
