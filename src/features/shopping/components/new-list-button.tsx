"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, cn, Input, Label, TextField } from "@heroui/react";

import { createShoppingList } from "../shopping.actions";
import { AppDialog, closing } from "@/components/ui/app-dialog";
import { PendingButton } from "@/components/ui/pending-button";

/** Sits at the end of the list tabs, where "one more list" belongs. */
export function NewListButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className={cn("shrink-0", className)}
        onPress={() => setIsOpen(true)}
        variant="ghost"
      >
        <Plus aria-hidden="true" className="size-4" />
        New list
      </Button>

      <AppDialog heading="New list" isOpen={isOpen} onOpenChange={setIsOpen}>
        <form
          action={closing(createShoppingList, () => setIsOpen(false))}
          className="flex gap-2"
        >
          <TextField className="flex-1" isRequired name="name">
            <Label>Name</Label>
            <Input autoFocus placeholder="Market, party, the other house" />
          </TextField>
          <PendingButton className="self-end">Create</PendingButton>
        </form>
      </AppDialog>
    </>
  );
}
