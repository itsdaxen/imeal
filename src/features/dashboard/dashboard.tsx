import Image from "next/image";

import { Card, cn, Link, ProgressBar, Typography } from "@heroui/react";

import { AppHeader } from "@/components/ui/app-header";
import { ContentCard } from "@/components/ui/content-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconBadge } from "@/components/ui/icon-badge";
import { TagList } from "@/components/ui/tag-list";

import { getCurrentUser } from "@/features/auth/current-user";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

import { dashboardFixture, type DashboardMeal } from "./dashboard.fixture";
import { PlanningDay } from "./components/planning-day";

// Temporary placeholder artwork.
const artworkClasses: Record<DashboardMeal["artwork"], string> = {
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

const dashboardNavigationItems = [
  { href: "#dashboard", label: "Today" },
  { href: "#week-plan", label: "Planner", mobileLabel: "Plan" },
  { href: "#shopping", label: "Shopping", mobileLabel: "Shop" },
  { href: "#recipes", label: "Recipes" },
] as const;

function MealArtwork({
  artwork,
  className = "",
}: {
  artwork: DashboardMeal["artwork"];
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(artworkClasses[artwork], className)}
    />
  );
}

function WeekOverviewCard() {
  const { week } = dashboardFixture;

  return (
    <ContentCard
      className="col-span-12 md:flex-row md:items-center"
      density="spacious"
      id="week-plan"
    >
      <Card.Header className="min-w-0 flex-1 gap-1">
        <Eyebrow>YOUR WEEK</Eyebrow>
        <Card.Title className="text-xl sm:text-2xl">
          {week.plannedMeals} meals are planned
        </Card.Title>
        <Card.Description>{week.label}</Card.Description>
      </Card.Header>

      <Card.Content className="w-full md:max-w-xl">
        <ol
          aria-label="Days in the current plan"
          className="grid grid-cols-7 gap-2"
        >
          {week.days.map((day) => (
            <PlanningDay
              date={day.date}
              hasMeal={Boolean(day.hasMeal)}
              isToday={Boolean(day.isToday)}
              key={`${day.label}-${day.date}`}
              label={day.label}
            />
          ))}
        </ol>
      </Card.Content>
    </ContentCard>
  );
}

function ShoppingSummaryCard() {
  const { shopping } = dashboardFixture;
  const percentage = Math.round(
    (shopping.completedItems / shopping.totalItems) * 100,
  );

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
          <Card.Title className="text-xl">Almost ready for the week</Card.Title>
          <Card.Description>
            {shopping.completedItems} of {shopping.totalItems} items collected
          </Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="mt-2 gap-5">
        <ProgressBar aria-label="Shopping list completion" value={percentage}>
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
          {shopping.totalItems - shopping.completedItems} items left
        </span>
      </Card.Footer>
    </ContentCard>
  );
}

function NextMealCard() {
  const { nextMeal } = dashboardFixture;

  return (
    <ContentCard
      appearance="media"
      className="col-span-12 min-h-60 sm:min-h-80 lg:col-span-7 lg:row-span-2 lg:min-h-[27rem]"
      density="flush"
      id="next-meal"
      variant="tertiary"
    >
      <Image
        alt=""
        className="object-cover"
        fill
        preload
        sizes="(min-width: 1280px) 42rem, (min-width: 1024px) 58vw, 100vw"
        src={nextMeal.image}
      />
      <div className={mediaScrimClassName} />
      <Card.Header className="relative z-10 p-6 sm:p-8">
        <div className={mediaPanelClassName}>
          <Eyebrow tone="media">
            {nextMeal.dayLabel.toUpperCase()} · {nextMeal.time}
          </Eyebrow>
          <Card.Title className="max-w-sm text-2xl text-media-foreground sm:text-3xl">
            {nextMeal.title}
          </Card.Title>
          <Card.Description className="max-w-xs text-media-muted">
            {nextMeal.subtitle}
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Footer className="relative z-10 mt-auto flex items-end justify-between gap-4 p-6 sm:p-8">
        <div className="rounded-full bg-media-control px-4 py-2 text-sm font-medium text-media-control-foreground shadow-sm backdrop-blur-md">
          {nextMeal.prepMinutes} minutes
        </div>
        <Link className={mediaActionClassName} href="#recipes">
          View recipe
          <Link.Icon aria-hidden="true" />
        </Link>
      </Card.Footer>
    </ContentCard>
  );
}

function ReminderCard() {
  const { reminder } = dashboardFixture;

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
          <Eyebrow>{reminder.eyebrow}</Eyebrow>
          <Card.Title className="text-lg">{reminder.title}</Card.Title>
          <Card.Description>{reminder.description}</Card.Description>
        </div>
      </Card.Header>
      <Card.Footer>
        <span className="text-sm font-medium text-foreground">
          Tomorrow · Lunch
        </span>
      </Card.Footer>
    </ContentCard>
  );
}

function RecipeCard({ recipe }: { recipe: DashboardMeal }) {
  return (
    <ContentCard className="col-span-12 sm:col-span-6" density="compact">
      <MealArtwork
        artwork={recipe.artwork}
        className="h-40 w-full rounded-3xl sm:h-44"
      />
      <Card.Header className="gap-1 px-1 pb-0">
        <Card.Title className="text-base">{recipe.title}</Card.Title>
        <Card.Description>{recipe.subtitle}</Card.Description>
      </Card.Header>
      <Card.Footer className="justify-between px-1 pt-0">
        <span className="text-xs font-medium text-muted">{recipe.time}</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-accent"
          />
          Saved
        </span>
      </Card.Footer>
    </ContentCard>
  );
}

export async function Dashboard() {
  const user = await getCurrentUser();

  return (
    <div id="dashboard" className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <AppHeader
          activeHref="#dashboard"
          homeHref="#dashboard"
          navigationItems={dashboardNavigationItems}
          navigationLabel="Dashboard sections"
          actions={<SignOutButton />}
          user={user ?? dashboardFixture.user}
        />

        <main className="pt-10 sm:pt-14">
          <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Typography color="muted" type="body-sm" weight="medium">
                Monday, July 27
              </Typography>
              <Typography.Heading className="mt-1" level={1}>
                Good evening, {dashboardFixture.user.firstName}.
              </Typography.Heading>
            </div>
            <Typography.Paragraph
              className="max-w-md sm:text-right"
              color="muted"
              size="sm"
            >
              Dinner is planned and most of your shopping is already done.
            </Typography.Paragraph>
          </header>

          <div className="grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
            <WeekOverviewCard />
            <ShoppingSummaryCard />
            <NextMealCard />
            <ReminderCard />

            <section
              aria-labelledby="recent-recipes-title"
              className="col-span-12 mt-2"
              id="recipes"
            >
              <div className="mb-4 px-1">
                <div>
                  <Eyebrow>YOUR LIBRARY</Eyebrow>
                  <Typography.Heading level={2} id="recent-recipes-title">
                    Recent recipes
                  </Typography.Heading>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
                {dashboardFixture.recentRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-12 flex items-center justify-between border-t border-separator px-1 py-6 text-xs text-muted">
          <span>iMeal</span>
          <span>Plan with intention. Cook with ease.</span>
        </footer>
      </div>
    </div>
  );
}
