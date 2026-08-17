import { Card, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";

import { mealAt, type WeekPlan } from "../plan.queries";
import { weekDays } from "../week";
import { SlotCell } from "./slot-cell";

type WeekGridProps = {
  plan: WeekPlan;
  weekStart: string;
};

export function WeekGrid({ plan, weekStart }: WeekGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {weekDays(weekStart).map((day) => (
        <ContentCard density="compact" key={day.date}>
          <Card.Header>
            <Typography type="h2" weight="semibold">
              {day.label}
            </Typography>
            <Typography className="text-muted" type="body-xs">
              {day.dateLabel}
            </Typography>
          </Card.Header>

          <Card.Content>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {plan.enabledSlots.map((slot) => (
                <SlotCell
                  dayIndex={day.index}
                  key={slot}
                  meal={mealAt(plan, day.index, slot)}
                  slot={slot}
                  weekStart={weekStart}
                />
              ))}
            </div>
          </Card.Content>
        </ContentCard>
      ))}
    </div>
  );
}
