"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@heroui/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/features/auth/components/form-message";

import { deleteRecipe, type RecipeFormState } from "../recipe.actions";

export function DeleteRecipeForm({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState<RecipeFormState>(
    deleteRecipe.bind(null, id),
    {},
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} ref={formRef}>
        <Button
          isPending={isPending}
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
        isPending={isPending}
        onConfirm={() => {
          setIsConfirming(false);
          // The dialog renders in a portal, so submit the form directly.
          formRef.current?.requestSubmit();
        }}
        onOpenChange={setIsConfirming}
      />

      {state.error ? (
        <FormMessage tone="error">{state.error}</FormMessage>
      ) : null}
    </div>
  );
}
