import type { Metadata } from "next";

import { Disclosure } from "@heroui/react";

import { FillWeekForm } from "@/features/planner/components/fill-week-form";
import { PlannerOptions } from "@/features/planner/components/planner-options";
import { SharedWeekInbox } from "@/features/planner/components/shared-week-inbox";
import { PendingButton } from "@/components/ui/pending-button";
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
import { WeekSwitcher } from "@/features/planner/components/week-switcher";

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

  // One answer for "which list", used by the button and by the selector beneath it.
  // They used to compute it separately and could name different lists, which is how
  // pressing Add to shopping list filled something other than what the page showed.
  const destinationId =
    lists.find((list) => list.isDefault && list.isOwn)?.id ??
    destination.listId;

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
          day={plan.days[0]}
          lists={lists}
          targetListId={destinationId}
          weekStart={weekStart}
        />

        <form action={generateShoppingList}>
          <input name="weekStart" type="hidden" value={weekStart} />
          <input name="listId" type="hidden" value={destinationId ?? ""} />
          <PendingButton
            className="min-h-11"
            isDisabled={plan.meals.length === 0 || !destinationId}
            variant="tertiary"
          >
            Add to shopping list
          </PendingButton>
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
                day={plan.days[0]}
                lists={lists}
                targetListId={destinationId}
                weekStart={weekStart}
              />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </ContentCard>

      <WeekSwitcher
        nextHref={`/planner?week=${addWeeks(weekStart, 1)}`}
        previousHref={`/planner?week=${addWeeks(weekStart, -1)}`}
      >
        <WeekGrid plan={plan} weekStart={weekStart} />
      </WeekSwitcher>
    </PageShell>
  );
}
