"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@heroui/react";

import { ActionLink } from "@/components/ui/action";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PanelTitle } from "@/components/ui/panel-title";
import { RecipeImage } from "@/components/ui/recipe-image";
import type { DashboardData } from "../dashboard.queries";

type Meal = DashboardData["nextMeals"][number];

/**
 * The day you are cooking next, one meal at a time.
 *
 * A day is usually more than one meal, and the hero used to show whichever came first
 * and hide the rest. Scroll snapping rather than a scripted carousel: a swipe on a
 * phone is then the browser's own gesture, with the arrows and dots only there for a
 * pointer that cannot swipe.
 */
export function NextMealSlider({
  meals,
  weekStart,
}: {
  meals: Meal[];
  weekStart: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(0);

  /**
   * Moves the track by assignment, with the easing left to CSS.
   *
   * `scrollTo({ behavior: "smooth" })` and `scrollIntoView` both lose an argument with
   * the snap engine here and settle back where they started — the slide simply never
   * changes. Setting `scrollLeft` against a `scroll-smooth` container animates when
   * the browser can and jumps when it cannot, and either way the slide changes.
   */
  function show(index: number) {
    const element = track.current;

    if (!element) {
      return;
    }

    // Marked here as well as on scroll: the scroll events arrive while the track is
    // still moving, so waiting for them leaves the controls describing the slide you
    // just left. Swiping still relies on `onScroll` alone.
    setShown(index);
    element.scrollLeft = index * element.clientWidth;
  }

  return (
    <>
      <ul
        className="flex h-full snap-x snap-mandatory [scrollbar-width:none] list-none overflow-x-auto p-0 [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => {
          const element = event.currentTarget;
          setShown(Math.round(element.scrollLeft / element.clientWidth));
        }}
        ref={track}
      >
        {meals.map((meal, index) => (
          <li
            className="relative h-full w-full shrink-0 snap-start"
            key={`${meal.id}-${meal.slot}`}
          >
            <RecipeImage
              className="absolute inset-0 size-full"
              fill
              id={meal.id}
              imageUrl={meal.imageUrl}
              // Only the first is above the fold, so only the first is worth preloading.
              preload={index === 0}
              sizes="(min-width: 1024px) 66vw, 100vw"
            />

            {/* A soft floor under the panel, so a pale photograph cannot swallow its edge. */}
            <div className="absolute inset-x-0 bottom-0 z-10 h-2/3 bg-linear-to-t from-black/45 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-4 p-5 sm:p-7">
              {/* Glass over a photograph, so it sits outside the surface scale on purpose. */}
              <Card.Header className="max-w-md gap-1 rounded-3xl border border-media-panel-border bg-linear-to-br from-media-panel-start to-media-panel-end p-4 backdrop-blur-md">
                <Eyebrow tone="media">
                  {meal.dayLabel} · {meal.slot}
                </Eyebrow>
                <PanelTitle className="text-media-foreground">
                  {meal.title}
                </PanelTitle>
                <Card.Description className="text-media-muted">
                  {meal.prepMinutes} minutes ·{" "}
                  {meal.approved ? "ready to cook" : "awaiting approval"}
                </Card.Description>
              </Card.Header>

              <Card.Footer>
                <ActionLink
                  className="rounded-3xl bg-media-action px-5 py-2.5 font-semibold text-media-action-foreground no-underline transition-transform [--link-hover:var(--imeal-media-action-foreground)] motion-safe:hover:scale-[1.03]"
                  href={
                    meal.approved
                      ? `/cook/${meal.id}`
                      : `/planner?week=${weekStart}`
                  }
                  tier="primary"
                >
                  {meal.approved ? "Start cooking" : "Review the plan"}
                </ActionLink>
              </Card.Footer>
            </div>
          </li>
        ))}
      </ul>

      {meals.length > 1 ? (
        // The same glass as the caption below it, so the two read as one surface
        // floating over the photograph rather than two different treatments.
        <div className="absolute top-5 right-5 z-20 flex items-center gap-1 rounded-3xl border border-media-panel-border bg-linear-to-br from-media-panel-start to-media-panel-end px-1.5 py-1 backdrop-blur-md sm:top-7 sm:right-7">
          {[
            { delta: -1, icon: ChevronLeft, label: "Previous meal" },
            { delta: 1, icon: ChevronRight, label: "Next meal" },
          ].map((control) => {
            const target = shown + control.delta;

            return (
              // `min-h-0` lifts these off the app's 44px floor: at full height the
              // pair would be taller than the caption they sit above.
              <button
                aria-label={control.label}
                className="grid size-9 min-h-0 place-items-center rounded-full text-media-foreground transition-colors hover:bg-media-foreground/15 disabled:opacity-35 disabled:hover:bg-transparent motion-reduce:transition-none"
                disabled={target < 0 || target > meals.length - 1}
                key={control.label}
                onClick={() => show(target)}
                type="button"
              >
                <control.icon aria-hidden="true" className="size-5" />
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
