export type DashboardMeal = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  artwork: "tomato" | "citrus" | "herb";
  image?: string;
};

export type DashboardData = {
  user: {
    displayName: string;
    firstName: string;
    initials: string;
  };
  week: {
    label: string;
    plannedMeals: number;
    totalSlots: number;
    days: ReadonlyArray<{
      label: string;
      date: number;
      isToday?: boolean;
      hasMeal?: boolean;
    }>;
  };
  nextMeal: DashboardMeal & {
    dayLabel: string;
    prepMinutes: number;
  };
  shopping: {
    completedItems: number;
    totalItems: number;
    nextItems: ReadonlyArray<string>;
  };
  reminder: {
    eyebrow: string;
    title: string;
    description: string;
  };
  recentRecipes: ReadonlyArray<DashboardMeal>;
};

export const dashboardFixture = {
  user: {
    displayName: "Alex Morgan",
    firstName: "Alex",
    initials: "AM",
  },
  week: {
    label: "July 27 – August 2",
    plannedMeals: 8,
    totalSlots: 10,
    days: [
      { label: "Mon", date: 27, isToday: true, hasMeal: true },
      { label: "Tue", date: 28, hasMeal: true },
      { label: "Wed", date: 29, hasMeal: true },
      { label: "Thu", date: 30, hasMeal: true },
      { label: "Fri", date: 31, hasMeal: true },
      { label: "Sat", date: 1 },
      { label: "Sun", date: 2 },
    ],
  },
  nextMeal: {
    id: "roasted-tomato-pasta",
    title: "Roasted tomato pasta",
    subtitle: "Creamy, bright, and ready in one pan.",
    time: "18:30",
    artwork: "tomato",
    image: "/food-images/pasta.jpg",
    dayLabel: "Tonight",
    prepMinutes: 35,
  },
  shopping: {
    completedItems: 14,
    totalItems: 22,
    nextItems: ["Cherry tomatoes", "Fresh basil", "Parmesan"],
  },
  reminder: {
    eyebrow: "PREP REMINDER",
    title: "Move the focaccia dough to the fridge",
    description: "Tomorrow's lunch needs an overnight rest.",
  },
  recentRecipes: [
    {
      id: "lemon-herb-salmon",
      title: "Lemon herb salmon",
      subtitle: "Saved yesterday",
      time: "25 min",
      artwork: "citrus",
    },
    {
      id: "green-goddess-bowl",
      title: "Green goddess bowl",
      subtitle: "A weekday favorite",
      time: "20 min",
      artwork: "herb",
    },
  ],
} satisfies DashboardData;
