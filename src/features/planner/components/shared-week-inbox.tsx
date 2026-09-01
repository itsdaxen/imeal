import { Button } from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";

import { copySharedWeek, dismissSharedWeek } from "../plan-sharing.actions";
import type { SharedPlan } from "../plan-sharing.queries";

type SharedWeekInboxProps = {
  plans: SharedPlan[];
  weekStart: string;
};

export function SharedWeekInbox({ plans, weekStart }: SharedWeekInboxProps) {
  if (plans.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-accent/50 bg-accent-soft/30 p-4 sm:p-5">
      <SectionTitle>Shared with you</SectionTitle>

      <ul className="flex list-none flex-col gap-2 p-0">
        {plans.map((plan) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3"
            key={plan.planId}
          >
            <span className="min-w-0">
              <span className="block font-medium">
                {plan.sharedBy}&rsquo;s week of {plan.weekStart}
              </span>
              <span className="block text-sm text-muted">
                {plan.meals} {plan.meals === 1 ? "meal" : "meals"}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <form action={copySharedWeek}>
                <input name="planId" type="hidden" value={plan.planId} />
                <input name="weekStart" type="hidden" value={weekStart} />
                <Button className="min-h-11" type="submit" variant="tertiary">
                  Copy into this week
                </Button>
              </form>

              <form action={dismissSharedWeek}>
                <input name="planId" type="hidden" value={plan.planId} />
                <Button className="min-h-11" type="submit" variant="ghost">
                  Dismiss
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
