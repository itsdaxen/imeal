"use client";

import type { ReactNode } from "react";
import { Label, ListBox, Select } from "@heroui/react";

export type SelectOption = {
  id: string;
  label: ReactNode;
  /** What a screen reader and type-ahead use when the label is not plain text. */
  textValue?: string;
};

/**
 * A labelled dropdown.
 *
 * Four of these were written out by hand, each repeating the same
 * trigger-value-indicator-popover-listbox nesting, and they had drifted on the part
 * that matters least visibly and most to a screen reader: some labelled the select with
 * `aria-labelledby`, some nested a `<Label>` inside it, and they did not agree on
 * `textValue`. One component means one answer.
 */
export function SelectField({
  className,
  defaultSelectedKey,
  label,
  name,
  onChange,
  options,
  selectedKey,
}: {
  className?: string;
  defaultSelectedKey?: string;
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  selectedKey?: string;
}) {
  return (
    <Select
      className={className}
      defaultSelectedKey={defaultSelectedKey}
      name={name}
      onSelectionChange={onChange ? (key) => onChange(String(key)) : undefined}
      selectedKey={selectedKey}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              id={option.id}
              key={option.id}
              textValue={option.textValue}
            >
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
