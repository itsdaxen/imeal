"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input, Label, TextField } from "@heroui/react";

import { createShoppingList } from "../shopping.actions";
import { AppDialog } from "@/components/ui/app-dialog";

/** Sits at the end of the list tabs, where "one more list" belongs. */
export function NewListButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="min-h-11 shrink-0"
        onPress={() => setIsOpen(true)}
        variant="tertiary"
      >
        <Plus aria-hidden="true" className="size-4" />
        New list
      </Button>

      <AppDialog heading="New list" isOpen={isOpen} onOpenChange={setIsOpen}>
        <form action={createShoppingList} className="flex gap-2">
          <TextField className="flex-1" isRequired name="name">
            <Label>Name</Label>
            <Input autoFocus placeholder="Market, party, the other house" />
          </TextField>
          <Button className="self-end" type="submit">
            Create
          </Button>
        </form>
      </AppDialog>
    </>
  );
}
