"use client";

import { useState } from "react";
import { Button, Label, ListBox, Modal, Select } from "@heroui/react";

import { ActionButton } from "@/components/ui/action";
import { ControlledDialogTrigger } from "@/components/ui/controlled-dialog-trigger";
import type { MealSlot } from "@/features/recipes/recipe.schema";

import { assignRecipeToSlot } from "../plan.actions";

type Day = { index: number; label: string; dateLabel: string };

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

export function PlanRecipeDialog({
  days,
  recipeId,
  slots,
  weekStart,
}: {
  days: Day[];
  recipeId: string;
  slots: MealSlot[];
  weekStart: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (slots.length === 0) return null;

  return (
    <>
      <ActionButton onPress={() => setIsOpen(true)} tier="primary">
        Add to this week
      </ActionButton>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ControlledDialogTrigger />
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Choose a place in your week</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form
                  action={assignRecipeToSlot}
                  className="flex flex-col gap-5"
                >
                  <input name="recipeId" type="hidden" value={recipeId} />
                  <input name="weekStart" type="hidden" value={weekStart} />

                  <Select
                    defaultSelectedKey={String(days[0].index)}
                    name="dayIndex"
                  >
                    <Label>Day</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {days.map((day) => (
                          <ListBox.Item
                            id={String(day.index)}
                            key={day.index}
                            textValue={`${day.label}, ${day.dateLabel}`}
                          >
                            {day.label} · {day.dateLabel}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Select defaultSelectedKey={slots[0]} name="slot">
                    <Label>Meal</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {slots.map((slot) => (
                          <ListBox.Item
                            id={slot}
                            key={slot}
                            textValue={SLOT_LABELS[slot]}
                          >
                            {SLOT_LABELS[slot]}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Button className="w-full" type="submit">
                    Add to plan
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
