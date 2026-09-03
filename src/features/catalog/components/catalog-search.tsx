"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Disclosure,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";

import { MEAL_SLOTS, type MealSlot } from "@/features/recipes/recipe.schema";

export function CatalogSearch({
  collections,
  search,
  mealTag,
  collection,
}: {
  collections: string[];
  search?: string;
  mealTag?: MealSlot;
  collection?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(search ?? "");

  function navigate(nextMeal = mealTag, nextCollection = collection) {
    const params = new URLSearchParams();
    if (term.trim()) params.set("search", term.trim());
    if (nextMeal) params.set("mealTag", nextMeal);
    if (nextCollection) params.set("collection", nextCollection);
    router.replace(`/catalog${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (term.trim() === (search ?? "").trim()) {
      return;
    }

    const timeout = window.setTimeout(() => navigate(), 250);
    return () => window.clearTimeout(timeout);
    // Only the text field debounces; the selects navigate on change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className="flex flex-col gap-3" role="search">
      <TextField className="w-full" value={term} onChange={setTerm}>
        <Label>Search the catalog</Label>
        <Input placeholder="Title contains…" type="search" />
      </TextField>
      <Disclosure>
        <Disclosure.Heading>
          <Disclosure.Trigger className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left hover:bg-default/60">
            Filters
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="flex flex-wrap gap-3 pt-3">
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <Label id="catalogMeal">Meal</Label>
              <Select
                aria-labelledby="catalogMeal"
                defaultSelectedKey={mealTag ?? "any"}
                onSelectionChange={(key) =>
                  navigate(
                    String(key) === "any"
                      ? undefined
                      : (String(key) as MealSlot),
                  )
                }
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="any">Any meal</ListBox.Item>
                    {MEAL_SLOTS.map((slot) => (
                      <ListBox.Item className="capitalize" id={slot} key={slot}>
                        {slot}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            {collections.length > 0 ? (
              <div className="flex min-w-44 flex-1 flex-col gap-1">
                <Label id="catalogCollection">Collection</Label>
                <Select
                  aria-labelledby="catalogCollection"
                  defaultSelectedKey={collection ?? "any"}
                  onSelectionChange={(key) =>
                    navigate(
                      mealTag,
                      String(key) === "any" ? undefined : String(key),
                    )
                  }
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="any">Any collection</ListBox.Item>
                      {collections.map((name) => (
                        <ListBox.Item
                          className="capitalize"
                          id={name}
                          key={name}
                        >
                          {name}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            ) : null}
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
