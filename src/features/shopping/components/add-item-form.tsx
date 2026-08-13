import { Button, Input, Label, TextField } from "@heroui/react";

import { addManualItem } from "../shopping.actions";

export function AddItemForm({ weekStart }: { weekStart: string }) {
  return (
    <form action={addManualItem} className="flex flex-wrap items-end gap-3">
      <input name="weekStart" type="hidden" value={weekStart} />

      <TextField className="min-w-56 flex-1" isRequired name="name">
        <Label>Add an item</Label>
        <Input placeholder="Olive oil" />
      </TextField>

      <TextField
        className="w-24"
        defaultValue="1"
        name="quantity"
        type="number"
      >
        <Label>Qty</Label>
        <Input max={999} min={1} />
      </TextField>

      <Button type="submit" variant="tertiary">
        Add
      </Button>
    </form>
  );
}
