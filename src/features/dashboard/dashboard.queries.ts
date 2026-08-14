import { getWeekPlan } from "@/features/planner/plan.queries";
import {
  currentWeekStart,
  formatWeekLabel,
  weekDays,
} from "@/features/planner/week";
import { listOwnedRecipes } from "@/features/recipes/recipe.queries";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";
import { getShoppingList } from "@/features/shopping/shopping.queries";

const RECENT_RECIPE_COUNT = 2;
const NEXT_SHOPPING_ITEM_COUNT = 4;
const ARTWORKS = ["tomato", "citrus", "herb"] as const;

export type Artwork = (typeof ARTWORKS)[number];

export type DashboardData = {
  weekStart: string;
  week: {
    label: string;
    plannedMeals: number;
    totalSlots: number;
    days: Array<{
      label: string;
      shortLabel: string;
      dayOfMonth: number;
      isToday: boolean;
      hasMeal: boolean;
    }>;
  };
  nextMeal: {
    id: string;
    title: string;
    dayLabel: string;
    slot: MealSlot;
    prepMinutes: number;
    imageUrl: string | null;
    artwork: Artwork;
  } | null;
  shopping: { completedItems: number; totalItems: number; nextItems: string[] };
  recentRecipes: Array<{
    id: string;
    title: string;
    prepMinutes: number;
    servings: number;
    artwork: Artwork;
  }>;
};

// Stable per recipe so a card does not change colour between renders.
function artworkFor(id: string): Artwork {
  const sum = [...id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return ARTWORKS[sum % ARTWORKS.length];
}

function slotRank(slot: MealSlot) {
  return MEAL_SLOTS.indexOf(slot);
}

type SchedulableMeal = { dayIndex: number; slot: MealSlot };

// The next meal is the earliest remaining one in the week, ordered by day and then by
// the natural order of the slots rather than by when the row happened to be created.
export function selectNextMeal<T extends SchedulableMeal>(
  meals: readonly T[],
  fromDayIndex: number,
): T | undefined {
  return [...meals]
    .sort(
      (a, b) => a.dayIndex - b.dayIndex || slotRank(a.slot) - slotRank(b.slot),
    )
    .find((meal) => meal.dayIndex >= Math.max(fromDayIndex, 0));
}

export async function getDashboardData(
  now: Date = new Date(),
): Promise<DashboardData> {
  const weekStart = currentWeekStart(now);
  const days = weekDays(weekStart);
  const todayIso = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  )
    .toISOString()
    .slice(0, 10);

  const [plan, shopping, recipes] = await Promise.all([
    getWeekPlan(weekStart),
    getShoppingList(weekStart),
    listOwnedRecipes(),
  ]);

  const todayIndex = days.findIndex((day) => day.date === todayIso);
  const upcoming = selectNextMeal(plan.meals, todayIndex);

  return {
    weekStart,
    week: {
      label: formatWeekLabel(weekStart),
      plannedMeals: plan.meals.length,
      totalSlots: plan.enabledSlots.length * days.length,
      days: days.map((day) => ({
        label: day.label,
        shortLabel: day.shortLabel,
        dayOfMonth: day.dayOfMonth,
        isToday: day.date === todayIso,
        hasMeal: plan.meals.some((meal) => meal.dayIndex === day.index),
      })),
    },
    nextMeal: upcoming
      ? {
          id: upcoming.recipe.id,
          title: upcoming.recipe.title,
          dayLabel: days[upcoming.dayIndex].label,
          slot: upcoming.slot,
          prepMinutes: upcoming.recipe.prepMinutes,
          imageUrl: null,
          artwork: artworkFor(upcoming.recipe.id),
        }
      : null,
    shopping: {
      completedItems: shopping.items.filter((item) => item.checked).length,
      totalItems: shopping.items.length,
      nextItems: shopping.items
        .filter((item) => !item.checked)
        .slice(0, NEXT_SHOPPING_ITEM_COUNT)
        .map((item) => item.name),
    },
    recentRecipes: recipes.slice(0, RECENT_RECIPE_COUNT).map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      prepMinutes: recipe.prep_minutes,
      servings: recipe.servings,
      artwork: artworkFor(recipe.id),
    })),
  };
}
