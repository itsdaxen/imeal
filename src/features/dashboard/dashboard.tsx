import Image from "next/image";
import {
  Card,
  Chip,
  cn,
  Link,
  ProgressCircle,
  Typography,
} from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { ContentCard } from "@/components/ui/content-card";
import { MealArtwork } from "@/components/ui/meal-artwork";
import { LinkCard } from "@/components/ui/link-card";
import { PageGrid, span } from "@/components/ui/page-grid";
import { PanelTitle } from "@/components/ui/panel-title";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TagList } from "@/components/ui/tag-list";
import { getCurrentUser } from "@/features/auth/current-user";

import { getDashboardData, type DashboardData } from "./dashboard.queries";
import { PlanningDay } from "./components/planning-day";

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

function NextMealCard({
  nextMeal,
  weekStart,
}: Pick<DashboardData, "nextMeal" | "weekStart">) {
  if (!nextMeal) {
    return (
      <ContentCard
        className={cn(span.wide, "justify-center gap-5")}
        id="next-meal"
      >
        <Card.Header className="gap-1">
          <Eyebrow>Next up</Eyebrow>
          <PanelTitle>Nothing planned yet</PanelTitle>
          <Card.Description>
            Place a few recipes into the week and the next one shows up here.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <ActionLink href={`/planner?week=${weekStart}`} tier="neutral">
            Plan the week
          </ActionLink>
        </Card.Footer>
      </ContentCard>
    );
  }

  return (
    <ContentCard
      appearance="media"
      className={cn(
        span.wide,
        "aspect-[3/2] sm:aspect-[2/1] lg:aspect-auto lg:min-h-88",
      )}
      density="flush"
      id="next-meal"
    >
      {nextMeal.imageUrl ? (
        <Image
          alt=""
          className="object-cover"
          fill
          // The hero above the fold, and so the page's LCP element.
          preload
          sizes="(min-width: 1024px) 66vw, 100vw"
          src={nextMeal.imageUrl}
        />
      ) : (
        <MealArtwork
          artwork={nextMeal.artwork}
          className="absolute inset-0 size-full"
        />
      )}

      {/* A soft floor under the panel, so a pale photograph cannot swallow its edge. */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-2/3 bg-linear-to-t from-black/45 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-4 p-5 sm:p-7">
        {/* Glass over a photograph, so it sits outside the surface scale on purpose. */}
        <Card.Header className="max-w-md gap-1 rounded-2xl border border-media-panel-border bg-linear-to-br from-media-panel-start to-media-panel-end p-4 backdrop-blur-md">
          <Eyebrow tone="media">
            {nextMeal.dayLabel} · {nextMeal.slot}
          </Eyebrow>
          <PanelTitle className="text-media-foreground">
            {nextMeal.title}
          </PanelTitle>
          <Card.Description className="text-media-muted">
            {nextMeal.prepMinutes} minutes ·{" "}
            {nextMeal.approved ? "ready to cook" : "awaiting approval"}
          </Card.Description>
        </Card.Header>

        <Card.Footer>
          <ActionLink
            className="rounded-full bg-media-action px-5 py-2.5 font-semibold text-media-action-foreground no-underline transition-transform [--link-hover:var(--imeal-media-action-foreground)] motion-safe:hover:scale-[1.03]"
            href={
              nextMeal.approved
                ? `/cook/${nextMeal.id}`
                : `/planner?week=${weekStart}`
            }
            tier="primary"
          >
            {nextMeal.approved ? "Start cooking" : "Review the plan"}
          </ActionLink>
        </Card.Footer>
      </div>
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
                <Link
                  className="text-sm"
                  href={
                    meal?.approved
                      ? `/cook/${meal.id}`
                      : `/planner?week=${weekStart}`
                  }
                >
                  {meal ? (meal.approved ? "Cook" : "Review") : "Plan"}
                </Link>
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

function RecipeCard({
  recipe,
}: {
  recipe: DashboardData["recentRecipes"][number];
}) {
  return (
    <LinkCard className={cn(span.third, "hover:shadow-lg")} density="compact">
      <Card.Content className="h-36 flex-none overflow-hidden rounded-lg">
        {recipe.imageUrl ? (
          <Image
            alt=""
            className="size-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
            height={192}
            sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 100vw"
            src={recipe.imageUrl}
            width={256}
          />
        ) : (
          <MealArtwork
            artwork={recipe.artwork}
            className="size-full transition-transform duration-300 motion-safe:group-hover:scale-105"
          />
        )}
      </Card.Content>

      <Card.Header className="gap-0.5">
        <Card.Title className="text-base">
          <LinkCard.Target href={`/recipes/${recipe.id}`}>
            {recipe.title}
          </LinkCard.Target>
        </Card.Title>
        <Card.Description>
          {recipe.prepMinutes} min · serves {recipe.servings}
        </Card.Description>
      </Card.Header>
    </LinkCard>
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
      <main className="pt-10 sm:pt-14">
        <header className="mb-6 flex flex-col gap-1 sm:mb-8">
          <Eyebrow tone="info">{today}</Eyebrow>
          <Typography type="h1" weight="semibold">
            {greeting(now.getHours())}
            {user ? `, ${user.displayName}` : ""}.
          </Typography>
        </header>

        <h2 className="sr-only">This week at a glance</h2>

        <PageGrid>
          <WeekBand week={data.week} />
          <NextMealCard nextMeal={data.nextMeal} weekStart={data.weekStart} />
          <TodayCard today={data.today} weekStart={data.weekStart} />
          <ShoppingBand shopping={data.shopping} weekStart={data.weekStart} />

          <section
            aria-labelledby="recent-recipes-title"
            className={cn(span.full, "mt-4 flex flex-col gap-4")}
            id="recipes"
          >
            <div className="flex items-baseline justify-between gap-4">
              <Typography id="recent-recipes-title" type="h2" weight="semibold">
                Recent recipes
              </Typography>
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
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </PageGrid>
            )}
          </section>
        </PageGrid>
      </main>
    </div>
  );
}
