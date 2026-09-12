"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Dropdown } from "@heroui/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";

import type { Suggestion } from "@/features/catalog/catalog.queries";
import {
  suggestRecipe,
  withdrawSuggestion,
} from "@/features/catalog/catalog.actions";
import type { Person } from "@/features/friends/friend.queries";
import { ShareDialog } from "@/features/sharing/components/share-dialog";

import { CollectionsDialog } from "./collections-dialog";

import {
  archiveRecipe,
  deleteRecipe,
  type RecipeFormState,
} from "../recipe.actions";
import { useServerAction } from "@/lib/use-server-action";

export function RecipeOwnerMenu({
  collections,
  friends,
  id,
  knownCollections,
  recipientIds,
  suggestion,
}: {
  collections: string[];
  friends: Person[];
  id: string;
  knownCollections: string[];
  recipientIds: string[];
  suggestion?: Suggestion;
}) {
  const router = useRouter();
  const { run } = useServerAction();
  const [deleteState, deleteAction, isDeleting] =
    useActionState<RecipeFormState>(deleteRecipe.bind(null, id), {});
  const [isDeletingOpen, setIsDeletingOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isSharingOpen, setIsSharingOpen] = useState(false);

  // The catalog item says what it will do next, which depends on where the last
  // suggestion got to: published entries offer nothing, pending ones can be pulled.
  const catalogItem =
    suggestion?.status === "approved"
      ? null
      : suggestion?.status === "pending"
        ? {
            action: () =>
              run(withdrawSuggestion, { suggestionId: suggestion.id }),
            label: "Withdraw from the catalog",
          }
        : {
            action: () => run(suggestRecipe, { recipeId: id }),
            label: "Suggest for the catalog",
          };

  const deleteForm = useRef<HTMLFormElement>(null);

  function archive() {
    run(archiveRecipe, { recipeId: id });
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
              id="share"
              onAction={() => setIsSharingOpen(true)}
              textValue="Share with friends"
            >
              Share with friends
            </Dropdown.Item>
            {catalogItem ? (
              <Dropdown.Item
                id="catalog"
                onAction={catalogItem.action}
                textValue={catalogItem.label}
              >
                {catalogItem.label}
              </Dropdown.Item>
            ) : null}
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

      <ShareDialog
        friends={friends}
        isOpen={isSharingOpen}
        onOpenChange={setIsSharingOpen}
        recipeId={id}
        recipientIds={recipientIds}
      />

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
        error={deleteState.error}
        // Left open on purpose: a delete that succeeds redirects away from this page,
        // so closing first only ever hides the reason one that failed did not.
        onConfirm={() => deleteForm.current?.requestSubmit()}
        onOpenChange={setIsDeletingOpen}
      />
    </div>
  );
}
