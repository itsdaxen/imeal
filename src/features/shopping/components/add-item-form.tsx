"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button, Input, Label, NumberField, TextField } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";

import { addManualItem } from "../shopping.actions";

export function AddItemForm({ listId }: { listId: string }) {
  const [showQuantity, setShowQuantity] = useState(false);

  return (
    <form action={addManualItem} className="flex flex-col gap-3">
      <input name="listId" type="hidden" value={listId} />

      <div className="flex items-end gap-2 sm:gap-3">
        <TextField className="min-w-0 flex-1" isRequired name="name">
          <Label>Add an item</Label>
          <Input placeholder="Olive oil" />
        </TextField>

        <ActionButton className="shrink-0" tier="primary" type="submit">
          <Plus aria-hidden="true" className="size-4" />
          Add
        </ActionButton>
      </div>

      <div className="flex items-end gap-3">
        <Button
          aria-expanded={showQuantity}
          className="min-h-11 self-end"
          onPress={() => setShowQuantity((shown) => !shown)}
          type="button"
          variant="ghost"
        >
          {showQuantity ? (
            <Minus aria-hidden="true" className="size-4" />
          ) : (
            <Plus aria-hidden="true" className="size-4" />
          )}
          {showQuantity ? "Use quantity 1" : "Add a quantity"}
        </Button>

        {showQuantity ? (
          <NumberField
            className="w-28"
            defaultValue={1}
            maxValue={999}
            minValue={1}
            name="quantity"
          >
            <Label>Quantity</Label>
            <Input />
          </NumberField>
        ) : (
          <input name="quantity" type="hidden" value="1" />
        )}
      </div>
    </form>
  );
}
