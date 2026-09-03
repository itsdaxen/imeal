"use client";

import { MoreHorizontal } from "lucide-react";
import { Dropdown } from "@heroui/react";

import { IconButton } from "@/components/ui/icon-button";

export function StapleMenu({
  active,
  name,
  onRemove,
  onToggle,
}: {
  active: boolean;
  name: string;
  onRemove: () => void;
  onToggle: () => void;
}) {
  return (
    <Dropdown>
      <IconButton label={`Options for ${name}`} variant="ghost">
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </IconButton>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu>
          <Dropdown.Item
            id="toggle"
            onAction={onToggle}
            textValue={active ? "Pause" : "Resume"}
          >
            {active ? "Pause" : "Resume"}
          </Dropdown.Item>
          <Dropdown.Item
            className="text-danger"
            id="remove"
            onAction={onRemove}
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
