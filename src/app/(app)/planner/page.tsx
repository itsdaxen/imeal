import type { Metadata } from "next";

import { Button, Link, Typography } from "@heroui/react";

import { FillWeekForm } from "@/features/planner/components/fill-week-form";
import { ShareWeekPanel } from "@/features/planner/components/share-week-panel";
import { SharedWeekInbox } from "@/features/planner/components/shared-week-inbox";
import {
  listPlanRecipients,
  listPlansSharedWithMe,
} from "@/features/planner/plan-sharing.queries";
import { listFriends } from "@/features/friends/friend.queries";
import { WeekGrid } from "@/features/planner/components/week-grid";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import {
  approveWholeWeek,
  deleteWeekPlan,
} from "@/features/planner/plan.actions";
import { getWeekPlan } from "@/features/planner/plan.queries";
import {
  addWeeks,
  formatWeekLabel,
  resolveWeekStart,
} from "@/features/planner/week";

export const metadata: Metadata = { title: "Planner" };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekStart = resolveWeekStart(week);
  const [plan, sharedWithMe, friends, recipientIds] = await Promise.all([
    getWeekPlan(weekStart),
    listPlansSharedWithMe(),
    listFriends(),
    listPlanRecipients(weekStart),
  ]);

  return (
    <main className="flex flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography type="h1" weight="semibold">
            Planner
          </Typography>
          <Typography className="text-muted" type="body-sm">
            {formatWeekLabel(weekStart)}
          </Typography>
        </div>

        <nav aria-label="Change week" className="flex items-center gap-4">
          <Link href={`/planner?week=${addWeeks(weekStart, -1)}`}>
            Previous
          </Link>
          <Link href="/planner">This week</Link>
          <Link href={`/planner?week=${addWeeks(weekStart, 1)}`}>Next</Link>
        </nav>
      </header>

      <SharedWeekInbox plans={sharedWithMe} weekStart={weekStart} />

      <section className="flex flex-col gap-4 rounded-3xl border border-border/80 p-4 sm:p-5">
        <Typography type="h2" weight="semibold">
          Fill the week
        </Typography>
        <FillWeekForm enabledSlots={plan.enabledSlots} weekStart={weekStart} />
      </section>

      {plan.meals.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <form action={approveWholeWeek}>
            <input name="weekStart" type="hidden" value={weekStart} />
            <Button size="sm" type="submit" variant="tertiary">
              Approve the whole week
            </Button>
          </form>

          <ConfirmActionForm
            action={deleteWeekPlan}
            confirmLabel="Empty the week"
            description="Every meal in this week goes, approved ones included, and anyone you shared it with loses their copy of the invitation."
            fields={{ weekStart }}
            heading="Empty this week?"
            label="Empty the week"
          />
        </div>
      ) : null}

      <WeekGrid plan={plan} weekStart={weekStart} />

      {plan.planId ? (
        <ShareWeekPanel
          friends={friends}
          recipientIds={recipientIds}
          weekStart={weekStart}
        />
      ) : null}
    </main>
  );
}
