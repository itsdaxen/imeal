"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Dropdown } from "@heroui/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";

import { CollectionsDialog } from "./collections-dialog";

import {
  archiveRecipe,
  deleteRecipe,
  type RecipeFormState,
} from "../recipe.actions";

export function RecipeOwnerMenu({
  collections,
  id,
  knownCollections,
}: {
  collections: string[];
  id: string;
  knownCollections: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [, deleteAction, isDeleting] = useActionState<RecipeFormState>(
    deleteRecipe.bind(null, id),
    {},
  );
  const [isDeletingOpen, setIsDeletingOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const deleteForm = useRef<HTMLFormElement>(null);

  function archive() {
    const data = new FormData();
    data.set("recipeId", id);
    startTransition(() => archiveRecipe(data));
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <Dropdown>
        <IconButton
          className="bg-surface/90 shadow-sm backdrop-blur-xs"
          label="Recipe options"
          variant="tertiary"
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </IconButton>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu>
            <Dropdown.Item
              id="edit"
              onAction={() => router.push(`/recipes/${id}/edit`)}
              textValue="Edit recipe"
            >
              Edit recipe
            </Dropdown.Item>
            <Dropdown.Item
              id="collections"
              onAction={() => setIsCollectionsOpen(true)}
              textValue="Add to collection"
            >
              Add to collection
            </Dropdown.Item>
            <Dropdown.Item
              id="archive"
              onAction={archive}
              textValue="Archive recipe"
            >
              Archive recipe
            </Dropdown.Item>
            <Dropdown.Item
              className="text-danger"
              id="delete"
              onAction={() => setIsDeletingOpen(true)}
              textValue="Delete recipe"
              variant="danger"
            >
              Delete recipe
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <CollectionsDialog
        isOpen={isCollectionsOpen}
        known={knownCollections}
        onOpenChange={setIsCollectionsOpen}
        recipeId={id}
        selected={collections}
      />

      <form action={deleteAction} className="hidden" ref={deleteForm}>
        <button tabIndex={-1} type="submit" />
      </form>
      <ConfirmDialog
        confirmLabel="Delete recipe"
        description="This removes the recipe from your library. It cannot be undone."
        heading="Delete this recipe?"
        isOpen={isDeletingOpen}
        isPending={isDeleting}
        onConfirm={() => {
          setIsDeletingOpen(false);
          deleteForm.current?.requestSubmit();
        }}
        onOpenChange={setIsDeletingOpen}
      />
    </div>
  );
}
