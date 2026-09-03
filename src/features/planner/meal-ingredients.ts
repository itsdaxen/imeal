/**
 * Which of a meal's ingredients still need adding to a list.
 *
 * Two meals in a week often share an ingredient, and the list is a shopping list
 * rather than a tally — so an ingredient already on it, however it got there, is
 * left alone. Matching ignores case and surrounding space because the existing rows
 * include anything typed by hand.
 */
export function ingredientsToAdd(
  ingredients: string[],
  existingNames: string[],
): string[] {
  const present = new Set(
    existingNames.map((name) => name.trim().toLocaleLowerCase()),
  );

  const added: string[] = [];

  for (const ingredient of ingredients) {
    const key = ingredient.trim().toLocaleLowerCase();

    if (!key || present.has(key)) {
      continue;
    }

    present.add(key);
    added.push(ingredient);
  }

  return added;
}
