"use client";

import { Disclosure, Input, Label, TextField } from "@heroui/react";

import { SelectField, type SelectOption } from "./select-field";

export type FilterOption = SelectOption;

export type Filter = {
  /** Stable id, also used to label the select for screen readers. */
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  value: string;
};

/**
 * Searching a set of recipes, wherever that happens.
 *
 * The library, the catalog and the planner's chooser all search the same kind of
 * thing and had each grown their own bar — three layouts, three sets of spacing, one
 * of them visibly different from the others. The filters vary between them, so they
 * are data; the search field and the disclosure around them do not, so they live here.
 */
export function FilterBar({
  filters,
  onSearchChange,
  searchLabel,
  searchValue,
}: {
  filters: Filter[];
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchValue: string;
}) {
  return (
    <div className="flex flex-col gap-3" role="search">
      <TextField
        className="w-full"
        onChange={onSearchChange}
        value={searchValue}
      >
        <Label>{searchLabel}</Label>
        <Input placeholder="Title contains…" type="search" />
      </TextField>

      {filters.length > 0 ? (
        <Disclosure>
          <Disclosure.Heading>
            <Disclosure.Trigger className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left hover:bg-default/60">
              Filters
              <Disclosure.Indicator />
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body className="flex flex-wrap gap-3 pt-3">
              {filters.map((filter) => (
                <SelectField
                  className="min-w-44 flex-1"
                  key={filter.id}
                  label={filter.label}
                  onChange={filter.onChange}
                  options={filter.options}
                  selectedKey={filter.value}
                />
              ))}
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      ) : null}
    </div>
  );
}
