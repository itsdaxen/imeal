import { Card, cn, Link, ProgressBar, Typography } from "@heroui/react";

import { ContentCard } from "@/components/ui/content-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconBadge } from "@/components/ui/icon-badge";
import { TagList } from "@/components/ui/tag-list";
import { getCurrentUser } from "@/features/auth/current-user";

import {
  getDashboardData,
  type Artwork,
  type DashboardData,
} from "./dashboard.queries";
import { PlanningDay } from "./components/planning-day";

// Placeholder artwork stands in until recipe images exist.
const artworkClasses: Record<Artwork, string> = {
  citrus:
    "bg-[linear-gradient(150deg,oklch(0.58_0.12_72),oklch(0.82_0.10_88))]",
  herb: "bg-[linear-gradient(150deg,oklch(0.48_0.10_158),oklch(0.74_0.08_152))]",
  tomato:
    "bg-[linear-gradient(150deg,oklch(0.50_0.15_28),oklch(0.74_0.12_44))]",
};

const mediaScrimClassName =
  "absolute inset-0 bg-gradient-to-b from-media-scrim-start via-transparent to-media-scrim-end";
const mediaPanelClassName =
  "rounded-4xl border border-media-panel-border bg-gradient-to-r from-media-panel-start to-media-panel-end p-4 backdrop-blur-xs";
const mediaActionClassName =
  "rounded-full bg-media-action px-5 py-2.5 font-semibold text-media-action-foreground no-underline shadow-sm transition-transform motion-safe:hover:scale-[1.02] motion-reduce:transition-none";

function MealArtwork({
  artwork,
  className = "",
}: {
  artwork: Artwork;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(artworkClasses[artwork], className)}
    />
  );
}

function WeekOverviewCard({
  week,
  weekStart,
}: Pick<DashboardData, "week" | "weekStart">) {
  return (
    <ContentCard
      className="col-span-12 md:flex-row md:items-center"
      density="spacious"
      id="week-plan"
    >
      <Card.Header className="min-w-0 flex-1 gap-1">
        <Eyebrow>YOUR WEEK</Eyebrow>
        <Card.Title className="text-xl sm:text-2xl">
          {week.plannedMeals === 0
            ? "Nothing planned yet"
            : `${week.plannedMeals} of ${week.totalSlots} slots planned`}
        </Card.Title>
        <Card.Description>
          {week.label} ·{" "}
          <Link href={`/planner?week=${weekStart}`}>Open the planner</Link>
        </Card.Description>
      </Card.Header>

      <Card.Content className="w-full md:max-w-xl">
        <ol
          aria-label="Days in the current plan"
          className="grid grid-cols-7 gap-2"
        >
          {week.days.map((day) => (
            <PlanningDay
              date={day.dayOfMonth}
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

function ShoppingSummaryCard({
  shopping,
  weekStart,
}: Pick<DashboardData, "shopping" | "weekStart">) {
  const remaining = shopping.totalItems - shopping.completedItems;
  const percentage =
    shopping.totalItems === 0
      ? 0
      : Math.round((shopping.completedItems / shopping.totalItems) * 100);

  return (
    <ContentCard className="col-span-12 lg:col-span-5" id="shopping">
      <Card.Header className="gap-3">
        <IconBadge tone="accent">
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 5h2l1.3 8.1a2 2 0 0 0 2 1.7h7.5a2 2 0 0 0 1.9-1.4L20 8H7M10 19.2h.01M17 19.2h.01"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </IconBadge>
        <div className="flex flex-col gap-1">
          <Eyebrow>SHOPPING</Eyebrow>
          <Card.Title className="text-xl">
            {shopping.totalItems === 0
              ? "No list yet"
              : remaining === 0
                ? "Everything is bought"
                : "Ready for the week"}
          </Card.Title>
          <Card.Description>
            {shopping.totalItems === 0 ? (
              <Link href={`/shopping?week=${weekStart}`}>
                Build it from your plan
              </Link>
            ) : (
              `${shopping.completedItems} of ${shopping.totalItems} items collected`
            )}
          </Card.Description>
        </div>
      </Card.Header>

      {shopping.totalItems > 0 ? (
        <>
          <Card.Content className="mt-2 gap-5">
            <ProgressBar
              aria-label="Shopping list completion"
              value={percentage}
            >
              <ProgressBar.Output className="text-xs font-medium text-muted" />
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>

            <TagList
              casing="none"
              label="Next shopping items"

              tags={shopping.nextItems}

              tone="neutral"
            />
          </Card.Content>

          <Card.Footer>
            <span className="text-sm font-medium text-foreground">
              {remaining} items left
            </span>
          </Card.Footer>
        </>
      ) : null}
    </ContentCard>
  );
}

function NextMealCard({
  nextMeal,
  weekStart,
}: Pick<DashboardData, "nextMeal" | "weekStart">) {
  return (
    <ContentCard
      appearance="media"
      className="col-span-12 min-h-60 sm:min-h-80 lg:col-span-7 lg:row-span-2 lg:min-h-[27rem]"
      density="flush"
      id="next-meal"
      variant="tertiary"
    >
      <MealArtwork
        artwork={nextMeal?.artwork ?? "herb"}
        className="absolute inset-0 size-full"
      />
      <div className={mediaScrimClassName} />

      <Card.Header className="relative z-10 p-6 sm:p-8">
        <div className={mediaPanelClassName}>
          <Eyebrow tone="media">
            {nextMeal
              ? `${nextMeal.dayLabel.toUpperCase()} · ${nextMeal.slot}`
              : "NEXT UP"}
          </Eyebrow>
          <Card.Title className="max-w-sm text-2xl text-media-foreground sm:text-3xl">
            {nextMeal ? nextMeal.title : "Nothing planned yet"}
          </Card.Title>
          <Card.Description className="max-w-xs text-media-muted">
            {nextMeal
              ? "Everything you need is on the shopping list."
              : "Pick a few recipes and place them in the week."}
          </Card.Description>
        </div>
      </Card.Header>

      <Card.Footer className="relative z-10 mt-auto flex items-end justify-between gap-4 p-6 sm:p-8">
        {nextMeal ? (
          <>
            <div className="rounded-full bg-media-control px-4 py-2 text-sm font-medium text-media-control-foreground shadow-sm backdrop-blur-md">
              {nextMeal.prepMinutes} minutes
            </div>
            <Link
              className={mediaActionClassName}
              href={`/cook/${nextMeal.id}`}
            >
              Start cooking
              <Link.Icon aria-hidden="true" />
            </Link>
          </>
        ) : (
          <Link
            className={mediaActionClassName}
            href={`/planner?week=${weekStart}`}
          >
            Plan the week
            <Link.Icon aria-hidden="true" />
          </Link>
        )}
      </Card.Footer>
    </ContentCard>
  );
}

function NextStepCard({ shopping, week, weekStart }: DashboardData) {
  const remaining = shopping.totalItems - shopping.completedItems;
  const step =
    week.plannedMeals === 0
      ? {
          title: "Plan your week",
          description: "Place a few recipes into days and slots.",
          href: `/planner?week=${weekStart}`,
          action: "Open the planner",
        }
      : shopping.totalItems === 0
        ? {
            title: "Build the shopping list",
            description: "Turn this week's meals into one list.",
            href: `/shopping?week=${weekStart}`,
            action: "Build it",
          }
        : remaining > 0
          ? {
              title: `${remaining} things left to buy`,
              description: "Tick them off as you shop.",
              href: `/shopping?week=${weekStart}`,
              action: "Open the list",
            }
          : {
              title: "You are all set",
              description: "The week is planned and the shopping is done.",
              href: `/planner?week=${weekStart}`,
              action: "Review the week",
            };

  return (
    <ContentCard className="col-span-12 lg:col-span-5">
      <Card.Header className="gap-3">
        <IconBadge>
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 7v5l3 2m5-2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </IconBadge>
        <div className="flex flex-col gap-1">
          <Eyebrow>NEXT STEP</Eyebrow>
          <Card.Title className="text-lg">{step.title}</Card.Title>
          <Card.Description>{step.description}</Card.Description>
        </div>
      </Card.Header>
      <Card.Footer>
        <Link className="text-sm font-medium" href={step.href}>
          {step.action}
        </Link>
      </Card.Footer>
    </ContentCard>
  );
}

function RecipeCard({
  recipe,
}: {
  recipe: DashboardData["recentRecipes"][number];
}) {
  return (
    <ContentCard className="col-span-12 sm:col-span-6" density="compact">
      <MealArtwork
        artwork={recipe.artwork}
        className="h-40 w-full rounded-3xl sm:h-44"
      />
      <Card.Header className="gap-1 px-1 pb-0">
        <Card.Title className="text-base">
          <Link
            className="text-foreground no-underline"
            href={`/recipes/${recipe.id}`}
          >
            {recipe.title}
          </Link>
        </Card.Title>
        <Card.Description>Serves {recipe.servings}</Card.Description>
      </Card.Header>
      <Card.Footer className="justify-between px-1 pt-0">
        <span className="text-xs font-medium text-muted">
          {recipe.prepMinutes} minutes
        </span>
      </Card.Footer>
    </ContentCard>
  );
}

function greeting(hour: number) {
  if (hour < 12) {
    return "Good morning";
  }

  return hour < 18 ? "Good afternoon" : "Good evening";
}

export async function Dashboard() {
  const now = new Date();
  const [data, user] = await Promise.all([
    getDashboardData(now),
    getCurrentUser(),
  ]);
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <div id="dashboard">
      <main className="pt-10 sm:pt-14">
        <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Typography color="muted" type="body-sm" weight="medium">
              {today}
            </Typography>
            <Typography.Heading className="mt-1" level={1}>
              {greeting(now.getHours())}
              {user ? `, ${user.displayName}` : ""}.
            </Typography.Heading>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
          <WeekOverviewCard week={data.week} weekStart={data.weekStart} />
          <ShoppingSummaryCard
            shopping={data.shopping}
            weekStart={data.weekStart}
          />
          <NextMealCard nextMeal={data.nextMeal} weekStart={data.weekStart} />
          <NextStepCard {...data} />

          <section
            aria-labelledby="recent-recipes-title"
            className="col-span-12 mt-2"
            id="recipes"
          >
            <div className="mb-4 flex items-end justify-between px-1">
              <div>
                <Eyebrow>YOUR LIBRARY</Eyebrow>
                <Typography.Heading id="recent-recipes-title" level={2}>
                  Recent recipes
                </Typography.Heading>
              </div>
              <Link href="/recipes">See all</Link>
            </div>

            {data.recentRecipes.length === 0 ? (
              <Typography color="muted" type="body">
                No recipes yet.{" "}
                <Link href="/recipes/new">Add your first one</Link>.
              </Typography>
            ) : (
              <div className="grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
                {data.recentRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-12 flex items-center justify-between border-t border-separator px-1 py-6 text-xs text-muted">
        <span>iMeal</span>
        <span>Plan with intention. Cook with ease.</span>
      </footer>
    </div>
  );
}
