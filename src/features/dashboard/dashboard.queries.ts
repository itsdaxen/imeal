import { getWeekPlan } from "@/features/planner/plan.queries";
import { mealLabel } from "@/features/planner/day-shape";
import {
  currentWeekStart,
  formatWeekLabel,
  weekDays,
} from "@/features/planner/week";
import {
  listOwnedRecipes,
  type RecipeSummary,
} from "@/features/recipes/recipe.queries";
import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";
import { getShoppingList } from "@/features/shopping/shopping.queries";

const RECENT_RECIPE_COUNT = 3;
const NEXT_SHOPPING_ITEM_COUNT = 6;

export type DashboardData = {
  weekStart: string;
  week: {
    label: string;
    plannedMeals: number;
    approvedMeals: number;
    totalSlots: number;
    days: Array<{
      label: string;
      shortLabel: string;
      dayOfMonth: number;
      isToday: boolean;
      hasMeal: boolean;
    }>;
  };
  /**
   * Everything planned for the next day that has anything, earliest slot first. More
   * than one is normal — a day is usually a few meals, not one — so the hero carries
   * the whole day rather than picking a single meal out of it.
   */
  nextMeals: Array<{
    approved: boolean;
    dayLabel: string;
    id: string;
    imageUrl: string | null;
    prepMinutes: number;
    slot: MealSlot;
    title: string;
  }>;
  today: {
    label: string;
    slots: Array<{
      slot: MealSlot;
      meal: {
        id: string;
        title: string;
        prepMinutes: number;
        approved: boolean;
      } | null;
    }>;
  };
  shopping: { completedItems: number; totalItems: number; nextItems: string[] };
  recentRecipes: RecipeSummary[];
};

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

  // The old app's home screen answered one question first: what am I cooking today.
  const todaySlots = plan.day.map((slot, slotIndex) => {
    const meal = plan.meals.find(
      (planned) =>
        planned.dayIndex === todayIndex && planned.slotIndex === slotIndex,
    );

    return {
      label: mealLabel(plan.day, slotIndex),
      slot,
      meal: meal
        ? {
            id: meal.recipe.id,
            title: meal.recipe.title,
            prepMinutes: meal.recipe.prepMinutes,
            approved: meal.approved,
          }
        : null,
    };
  });

  return {
    weekStart,
    week: {
      label: formatWeekLabel(weekStart),
      plannedMeals: plan.meals.length,
      approvedMeals: plan.meals.filter((meal) => meal.approved).length,
      totalSlots: plan.day.length * days.length,
      days: days.map((day) => ({
        label: day.label,
        shortLabel: day.shortLabel,
        dayOfMonth: day.dayOfMonth,
        isToday: day.date === todayIso,
        hasMeal: plan.meals.some((meal) => meal.dayIndex === day.index),
      })),
    },
    nextMeals: upcoming
      ? plan.meals
          .filter((meal) => meal.dayIndex === upcoming.dayIndex)
          .sort((a, b) => slotRank(a.slot) - slotRank(b.slot))
          .map((meal) => ({
            approved: meal.approved,
            dayLabel: days[meal.dayIndex].label,
            id: meal.recipe.id,
            imageUrl: meal.recipe.imageUrl,
            prepMinutes: meal.recipe.prepMinutes,
            slot: meal.slot,
            title: meal.recipe.title,
          }))
      : [],
    today: {
      label: todayIndex === -1 ? "Today" : days[todayIndex].label,
      slots: todaySlots,
    },
    shopping: {
      completedItems: shopping.items.filter((item) => item.checked).length,
      totalItems: shopping.items.length,
      nextItems: shopping.items
        .filter((item) => !item.checked)
        .slice(0, NEXT_SHOPPING_ITEM_COUNT)
        .map((item) => item.name),
    },
    recentRecipes: recipes.slice(0, RECENT_RECIPE_COUNT),
  };
}
