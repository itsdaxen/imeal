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
      index: number;
      isToday: boolean;
      hasMeal: boolean;
    }>;
  };
  /**
   * Each day of the week and everything planned for it, earliest slot first.
   *
   * More than one meal a day is normal, so the hero carries a whole day rather than
   * picking a single meal out of it — and it carries whichever day you press in the
   * week, so every day is here rather than only the next one with something in it.
   */
  plannedDays: Array<{
    index: number;
    label: string;
    meals: Array<{
      approved: boolean;
      dayLabel: string;
      id: string;
      imageUrl: string | null;
      prepMinutes: number;
      slot: MealSlot;
      title: string;
    }>;
  }>;
  focusDay: number;
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
  const todayShape = plan.days[Math.max(todayIndex, 0)] ?? [];
  const todaySlots = todayShape.map((slot, slotIndex) => {
    const meal = plan.meals.find(
      (planned) =>
        planned.dayIndex === todayIndex && planned.slotIndex === slotIndex,
    );

    return {
      label: mealLabel(todayShape, slotIndex),
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
      totalSlots: plan.days.reduce((total, shape) => total + shape.length, 0),
      days: days.map((day) => ({
        index: day.index,
        label: day.label,
        shortLabel: day.shortLabel,
        dayOfMonth: day.dayOfMonth,
        isToday: day.date === todayIso,
        hasMeal: plan.meals.some((meal) => meal.dayIndex === day.index),
      })),
    },
    // Every day, not only the next one with something in it: the hero follows the day
    // you pick out of the week, and a day you have not planned yet has an answer too.
    plannedDays: days.map((day) => ({
      index: day.index,
      label: day.label,
      meals: plan.meals
        .filter((meal) => meal.dayIndex === day.index)
        .sort((a, b) => slotRank(a.slot) - slotRank(b.slot))
        .map((meal) => ({
          approved: meal.approved,
          dayLabel: day.label,
          id: meal.recipe.id,
          imageUrl: meal.recipe.imageUrl,
          prepMinutes: meal.recipe.prepMinutes,
          slot: meal.slot,
          title: meal.recipe.title,
        })),
    })),
    /** Where the hero starts: the next day with a meal, or today if none has one. */
    focusDay: upcoming?.dayIndex ?? (todayIndex === -1 ? 0 : todayIndex),
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
