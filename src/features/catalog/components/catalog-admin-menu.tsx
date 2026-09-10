"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Dropdown } from "@heroui/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { useServerAction } from "@/lib/use-server-action";

import { archiveCatalogRecipe } from "../catalog.actions";

export function CatalogAdminMenu({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const { isPending, run } = useServerAction();
  const [isDeletingOpen, setIsDeletingOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-10">
      <Dropdown>
        <IconButton
          className="bg-surface/90 shadow-sm backdrop-blur-xs"
          label="Catalog recipe options"
          variant="tertiary"
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </IconButton>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu>
            <Dropdown.Item
              id="edit"
              onAction={() => router.push(`/recipes/${recipeId}/edit`)}
              textValue="Edit catalog recipe"
            >
              Edit catalog recipe
            </Dropdown.Item>
            <Dropdown.Item
              className="text-danger"
              id="delete"
              onAction={() => setIsDeletingOpen(true)}
              textValue="Delete from catalog"
              variant="danger"
            >
              Delete from catalog
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <ConfirmDialog
        confirmLabel="Delete from catalog"
        description="This removes the public catalog recipe. Recipes people already copied remain in their libraries."
        heading="Delete this catalog recipe?"
        isOpen={isDeletingOpen}
        isPending={isPending}
        onConfirm={() => {
          setIsDeletingOpen(false);
          run(archiveCatalogRecipe, { recipeId });
        }}
        onOpenChange={setIsDeletingOpen}
      />
    </div>
  );
}
