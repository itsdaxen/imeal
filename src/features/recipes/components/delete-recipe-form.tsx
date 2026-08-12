"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { deleteRecipe } from "../recipe.actions";

export function DeleteRecipeForm({ id }: { id: string }) {
  const deleteThisRecipe = deleteRecipe.bind(null, id);
  const [isConfirming, setIsConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form action={deleteThisRecipe} ref={formRef}>
        <Button
          onPress={() => setIsConfirming(true)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Delete
        </Button>
      </form>

      <ConfirmDialog
        confirmLabel="Delete recipe"
        description="This removes the recipe from your library. It cannot be undone."
        heading="Delete this recipe?"
        isOpen={isConfirming}
        onConfirm={() => {
          setIsConfirming(false);
          // The dialog renders in a portal, so submit the form directly.
          formRef.current?.requestSubmit();
        }}
        onOpenChange={setIsConfirming}
      />
    </>
  );
}
