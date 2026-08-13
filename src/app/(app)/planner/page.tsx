import type { Metadata } from "next";

import { Link, Typography } from "@heroui/react";

import { WeekGrid } from "@/features/planner/components/week-grid";
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
  const plan = await getWeekPlan(weekStart);

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

      <WeekGrid plan={plan} weekStart={weekStart} />
    </main>
  );
}
