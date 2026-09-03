"use client";

import { useOptimistic, useTransition } from "react";
import { Button } from "@heroui/react";

import { PersonRow } from "./person-row";

export type PersonAction = {
  action: (formData: FormData) => Promise<void>;
  label: string;
  name: string;
  value: string;
  variant?: "ghost" | "tertiary";
};

export type PersonEntry = {
  actions: PersonAction[];
  context?: string;
  id: string;
  name: string;
};

/**
 * Accepting, declining, withdrawing and removing all end with the person leaving
 * this list, so the row goes as soon as you act. The list owns that — a row cannot
 * remove itself — and the server re-renders behind it either way.
 */
export function PeopleList({ people }: { people: PersonEntry[] }) {
  const [, startTransition] = useTransition();
  const [shown, dismiss] = useOptimistic(people, (current, id: string) =>
    current.filter((person) => person.id !== id),
  );

  return (
    <ul className="flex list-none flex-col p-0">
      {shown.map((person) => (
        <PersonRow
          actions={person.actions.map((entry) => (
            <Button
              className="min-h-11"
              key={entry.label}
              onPress={() => {
                const data = new FormData();
                data.set(entry.name, entry.value);

                startTransition(async () => {
                  dismiss(person.id);
                  await entry.action(data);
                });
              }}
              type="button"
              variant={entry.variant ?? "tertiary"}
            >
              {entry.label}
            </Button>
          ))}
          context={person.context}
          key={person.id}
          name={person.name}
        />
      ))}
    </ul>
  );
}
