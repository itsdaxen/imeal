"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const DayFocus = createContext<{
  day: number;
  focus: (day: number) => void;
} | null>(null);

/**
 * Which day of the week the dashboard is looking at.
 *
 * The day you press sits in the week band and the meals it shows sit in the hero
 * beside it, which are two cards in a grid rather than one component. A context is
 * what lets them agree without making their common parent a client component and
 * dragging the whole dashboard across with it — a provider renders no element of its
 * own, so the grid is unchanged.
 */
export function DayFocusProvider({
  children,
  initialDay,
}: {
  children: ReactNode;
  initialDay: number;
}) {
  const [day, setDay] = useState(initialDay);

  return (
    <DayFocus.Provider value={{ day, focus: setDay }}>
      {children}
    </DayFocus.Provider>
  );
}

export function useDayFocus() {
  const focus = useContext(DayFocus);

  if (!focus) {
    throw new Error("A day can only be focused inside a DayFocusProvider.");
  }

  return focus;
}
