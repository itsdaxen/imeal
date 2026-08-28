"use client";

import { MoreHorizontal } from "lucide-react";
import { Dropdown } from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";

import { removeStaple, toggleStaple } from "../shopping.actions";

export function StapleMenu({
  active,
  id,
  name,
}: {
  active: boolean;
  id: string;
  name: string;
}) {
  function run(action: (data: FormData) => Promise<void>) {
    const data = new FormData();
    data.set("stapleId", id);
    void action(data);
  }

  return (
    <Dropdown>
      <IconButton label={`Options for ${name}`} variant="ghost">
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </IconButton>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu>
          <Dropdown.Item
            id="toggle"
            onAction={() => run(toggleStaple)}
            textValue={active ? "Pause" : "Resume"}
          >
            {active ? "Pause" : "Resume"}
          </Dropdown.Item>
          <Dropdown.Item
            className="text-danger"
            id="remove"
            onAction={() => run(removeStaple)}
            textValue="Remove"
            variant="danger"
          >
            Remove
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
