"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";

import { createShoppingList } from "../shopping.actions";

/** Sits at the end of the list tabs, where "one more list" belongs. */
export function NewListButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton
        className="min-h-11"
        label="New list"
        onPress={() => setIsOpen(true)}
        variant="ghost"
      >
        <Plus aria-hidden="true" className="size-5" />
      </IconButton>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>New list</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form action={createShoppingList} className="flex gap-2">
                  <TextField className="flex-1" isRequired name="name">
                    <Label>Name</Label>
                    <Input
                      autoFocus
                      placeholder="Market, party, the other house"
                    />
                  </TextField>
                  <Button className="self-end" type="submit">
                    Create
                  </Button>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
