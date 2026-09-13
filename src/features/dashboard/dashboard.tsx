import {
  Card,
  Chip,
  cn,
  Link,
  ProgressCircle,
  Typography,
} from "@heroui/react";

import { SectionTitle } from "@/components/ui/section-title";
import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { PageGrid, span } from "@/components/ui/page-grid";
import { PanelTitle } from "@/components/ui/panel-title";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag-list";
import { getCurrentUser } from "@/features/auth/current-user";
import { RecipeCard } from "@/features/recipes/components/recipe-card";
import { PageShell } from "@/components/ui/page-shell";

import { getDashboardData, type DashboardData } from "./dashboard.queries";
import { PlanningDay } from "./components/planning-day";
import { NextMealSlider } from "./components/next-meal-slider";
import { DayFocusProvider } from "./components/day-focus";

function WeekBand({ week }: Pick<DashboardData, "week">) {
  return (
    <ContentCard
      className={cn(
        span.full,
        "gap-5 md:flex-row md:items-center md:justify-between",
      )}
      id="week-plan"
    >
      <Card.Header className="min-w-0 gap-1">
        <Eyebrow>This week</Eyebrow>
        <PanelTitle>
          {week.plannedMeals === 0
            ? "Nothing planned yet"
            : `${week.plannedMeals} of ${week.totalSlots} meals planned`}
        </PanelTitle>
        {week.plannedMeals > 0 ? (
          <Card.Description>
            {week.approvedMeals === week.plannedMeals
              ? "The whole week is ready to cook."
              : `${week.approvedMeals} approved · ${week.plannedMeals - week.approvedMeals} to review`}
          </Card.Description>
        ) : null}
      </Card.Header>

      <Card.Content className="flex-none">
        <ol
          aria-label="Days in the current plan"
          className="grid w-full grid-cols-7 gap-2 md:w-auto md:min-w-96"
        >
          {week.days.map((day) => (
            <PlanningDay
              date={day.dayOfMonth}
              dayIndex={day.index}
              hasMeal={day.hasMeal}
              isToday={day.isToday}
              key={day.label}
              label={day.shortLabel}
            />
          ))}
        </ol>
      </Card.Content>
    </ContentCard>
  );
}

function TodayCard({
  today,
  weekStart,
}: Pick<DashboardData, "today" | "weekStart">) {
  const planned = today.slots.filter((entry) => entry.meal !== null).length;

  return (
    <ContentCard className={cn(span.narrow, "gap-5")} id="today">
      <Card.Header className="gap-1">
        <Eyebrow>Today</Eyebrow>
        <PanelTitle>{today.label}</PanelTitle>
        <Card.Description>
          {planned === 0
            ? "Nothing planned for today."
            : `${planned} of ${today.slots.length} meals planned.`}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <ul className="flex list-none flex-col p-0">
          {today.slots.map(({ meal, slot }) => (
            <li
              className="flex min-h-12 items-center justify-between gap-3 border-b border-separator last:border-b-0"
              key={slot}
            >
              <span className="min-w-0">
                <span className="block text-xs font-medium text-muted capitalize">
                  {slot}
                </span>
                <span className="block truncate text-sm">
                  {meal ? meal.title : "Not planned"}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2">
                {meal ? (
                  <Chip
                    color={meal.approved ? "accent" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {meal.approved ? "Ready" : "Draft"}
                  </Chip>
                ) : null}
                <ActionLink
                  className="text-sm"
                  href={
                    meal?.approved
                      ? `/cook/${meal.id}`
                      : `/planner?week=${weekStart}`
                  }
                  tier="quiet"
                >
                  {meal ? (meal.approved ? "Cook" : "Review") : "Plan"}
                </ActionLink>
              </span>
            </li>
          ))}
        </ul>
      </Card.Content>
    </ContentCard>
  );
}

function ShoppingBand({
  shopping,
  weekStart,
}: Pick<DashboardData, "shopping" | "weekStart">) {
  const remaining = shopping.totalItems - shopping.completedItems;
  const href = `/shopping?week=${weekStart}`;

  if (shopping.totalItems === 0) {
    return (
      <ContentCard
        className={cn(
          span.full,
          "gap-3 md:flex-row md:items-center md:justify-between",
        )}
        id="shopping"
      >
        <Card.Header className="gap-1">
          <Eyebrow>Shopping</Eyebrow>
          <Typography type="body">Your shopping list is empty.</Typography>
        </Card.Header>
        <Card.Footer>
          <ActionLink href={href} tier="neutral">
            Build it from the plan
          </ActionLink>
        </Card.Footer>
      </ContentCard>
    );
  }

  return (
    <ContentCard
      className={cn(span.full, "gap-5 md:flex-row md:items-center md:gap-8")}
      id="shopping"
    >
      <div className="flex min-w-0 items-center gap-4 md:w-72 md:shrink-0">
        {/* A ring, not a bar: at one of twenty-two a bar is a hairline that reads
            as a stray rule, and a horizontal band has no width to spare. */}
        <ProgressCircle
          aria-label="Shopping list completion"
          className="shrink-0"
          value={Math.round(
            (shopping.completedItems / shopping.totalItems) * 100,
          )}
        >
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>

        <Card.Header className="min-w-0 gap-1">
          <Eyebrow>Shopping</Eyebrow>
          <PanelTitle>
            {remaining === 0
              ? "Everything is bought"
              : `${remaining} left to buy`}
          </PanelTitle>
          <Card.Description>
            {shopping.completedItems} of {shopping.totalItems} collected
          </Card.Description>
        </Card.Header>
      </div>

      <Card.Content className="min-w-0 justify-center">
        <TagList
          casing="none"
          label="Next shopping items"
          tags={shopping.nextItems}
          tone="neutral"
        />
      </Card.Content>

      <Card.Footer className="shrink-0">
        <ActionLink href={href} tier="quiet">
          Open the list
        </ActionLink>
      </Card.Footer>
    </ContentCard>
  );
}

function greeting(hour: number) {
  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

export async function Dashboard() {
  const now = new Date();
  const [data, user] = await Promise.all([
    getDashboardData(),
    getCurrentUser(),
  ]);
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <div id="dashboard">
      <PageShell>
        <header className="flex flex-col gap-1">
          <Eyebrow tone="info">{today}</Eyebrow>
          <Typography type="h1" weight="semibold">
            {greeting(now.getHours())}
            {user ? `, ${user.displayName}` : ""}.
          </Typography>
        </header>

        <h2 className="sr-only">This week at a glance</h2>

        <PageGrid>
          {/* The week band and the hero are separate cards in this grid, and pressing
              a day in one changes the other. The provider renders no element, so the
              grid is laid out exactly as it was. */}
          <DayFocusProvider initialDay={data.focusDay}>
            <WeekBand week={data.week} />
            <NextMealSlider
              days={data.plannedDays}
              weekStart={data.weekStart}
            />
          </DayFocusProvider>
          <TodayCard today={data.today} weekStart={data.weekStart} />
          <ShoppingBand shopping={data.shopping} weekStart={data.weekStart} />

          <section
            aria-labelledby="recent-recipes-title"
            className={cn(span.full, "mt-4 flex flex-col gap-4")}
            id="recipes"
          >
            <div className="flex items-baseline justify-between gap-4">
              <SectionTitle id="recent-recipes-title">
                Recent recipes
              </SectionTitle>
              <ActionLink href="/recipes" tier="quiet">
                See all
              </ActionLink>
            </div>

            {data.recentRecipes.length === 0 ? (
              <Typography color="muted" type="body">
                No recipes yet.{" "}
                <Link href="/recipes/new">Add your first one</Link>.
              </Typography>
            ) : (
              <PageGrid>
                {data.recentRecipes.map((recipe) => (
                  <RecipeCard
                    className={span.third}
                    key={recipe.id}
                    recipe={recipe}
                  />
                ))}
              </PageGrid>
            )}
          </section>
        </PageGrid>
      </PageShell>
    </div>
  );
}
