import type { SelectOption } from "@/components/ui/select-field";

import { MEAL_SLOTS } from "./recipe.schema";

/** The sentinel a filter uses for "do not narrow by this at all". */
const ANY = "any";

/**
 * The two lists every recipe filter offers.
 *
 * The library, the catalog and the planner's chooser each built these by hand, which
 * meant three places deciding independently what "no filter" is called and what the
 * sentinel value is. A filter that disagrees with its page about that silently shows
 * the wrong recipes.
 */
export const mealOptions: SelectOption[] = [
  { id: ANY, label: "Any meal" },
  ...MEAL_SLOTS.map((slot) => ({ id: slot, label: slot })),
];

export function collectionOptions(collections: string[]): SelectOption[] {
  return [
    { id: ANY, label: "Any collection" },
    ...collections.map((name) => ({ id: name, label: name })),
  ];
}
