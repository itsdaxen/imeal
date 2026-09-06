"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";

import { CheckChip } from "@/components/ui/check-chip";
import { FormMessage } from "@/components/ui/form-message";

import { setRecipeCollections, type RecipeFormState } from "../recipe.actions";
import { AppDialog } from "@/components/ui/app-dialog";

/**
 * Collections a recipe belongs to, edited from the recipe itself.
 *
 * The action takes the whole set rather than one addition, so the picker shows every
 * collection already in use with the recipe's own ticked. That is what makes removing
 * possible here, and it is what stops "asian" and "Asian food" becoming two things.
 */
export function CollectionsDialog({
  isOpen,
  known,
  onOpenChange,
  recipeId,
  selected,
}: {
  isOpen: boolean;
  known: string[];
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  selected: string[];
}) {
  const [state, formAction, isPending] = useActionState<
    RecipeFormState,
    FormData
  >(setRecipeCollections, {});
  const [added, setAdded] = useState("");

  // Anything on this recipe but not yet used elsewhere still has to be listed.
  const options = [...new Set([...known, ...selected])].sort();

  return (
    <AppDialog
      heading="Collections"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <form
        action={(data) => {
          const picked = data.getAll("collection").map(String);
          const fresh = added
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);
          data.set("collectionTags", [...picked, ...fresh].join(", "));
          formAction(data);
          setAdded("");
          onOpenChange(false);
        }}
        className="flex flex-col gap-5"
      >
        <input name="recipeId" type="hidden" value={recipeId} />

        {state.error ? (
          <FormMessage tone="error">{state.error}</FormMessage>
        ) : null}

        {options.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Your collections</span>
            <div className="grid grid-cols-2 gap-2">
              {options.map((name) => (
                <CheckChip
                  defaultChecked={selected.includes(name)}
                  key={name}
                  label={name}
                  name="collection"
                  value={name}
                />
              ))}
            </div>
          </div>
        ) : null}

        <TextField onChange={setAdded} value={added}>
          <Label>{options.length > 0 ? "Add another" : "New collection"}</Label>
          <Input placeholder="Asian favorites" />
        </TextField>

        <Button className="self-end" isPending={isPending} type="submit">
          {isPending ? "Saving…" : "Save collections"}
        </Button>
      </form>
    </AppDialog>
  );
}
