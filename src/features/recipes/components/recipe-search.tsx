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

import { MEAL_SLOTS, type MealSlot } from "../recipe.schema";

type RecipeSearchProps = {
  archived?: boolean;
  collection?: string;
  mealTag?: MealSlot;
  search?: string;
};

export function RecipeSearch({
  archived,
  collection,
  mealTag,
  search,
}: RecipeSearchProps) {
  const router = useRouter();
  const [term, setTerm] = useState(search ?? "");
  const [collectionTerm, setCollectionTerm] = useState(collection ?? "");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (term.trim()) params.set("search", term.trim());
      if (mealTag) params.set("mealTag", mealTag);
      if (archived) params.set("archived", "1");
      if (collectionTerm.trim())
        params.set("collection", collectionTerm.trim().toLowerCase());
      router.replace(`/recipes${params.size ? `?${params}` : ""}`, {
        scroll: false,
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [archived, collectionTerm, mealTag, router, term]);

  function routeWithFilters(collection: string, meal: string) {
    if (collection === "shared") {
      router.push("/recipes/shared");
      return;
    }
    const params = new URLSearchParams();
    if (term.trim()) params.set("search", term.trim());
    if (meal !== "any") params.set("mealTag", meal);
    if (collection === "archived") params.set("archived", "1");
    if (collectionTerm.trim())
      params.set("collection", collectionTerm.trim().toLowerCase());
    router.push(`/recipes${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-3" role="search">
      <TextField className="w-full" value={term} onChange={setTerm}>
        <Label>Search recipes</Label>
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
              <Label id="library">Library</Label>
              <Select
                aria-labelledby="library"
                defaultSelectedKey={archived ? "archived" : "active"}
                onSelectionChange={(key) =>
                  routeWithFilters(String(key), mealTag ?? "any")
                }
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="active">My recipes</ListBox.Item>
                    <ListBox.Item id="archived">Archived</ListBox.Item>
                    <ListBox.Item id="shared">Shared with me</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <TextField
              className="min-w-44 flex-1"
              value={collectionTerm}
              onChange={setCollectionTerm}
            >
              <Label>Collection</Label>
              <Input placeholder="Asian, quick…" />
            </TextField>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <Label id="mealTag">Meal</Label>
              <Select
                aria-labelledby="mealTag"
                defaultSelectedKey={mealTag ?? "any"}
                onSelectionChange={(key) =>
                  routeWithFilters(
                    archived ? "archived" : "active",
                    String(key),
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
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
