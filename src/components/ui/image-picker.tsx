"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button, Typography } from "@heroui/react";

type ImagePickerProps = {
  accept: string;
  currentUrl?: string | null;
  help: string;
  label: string;
  name: string;
  shape?: "avatar" | "landscape";
};

/** A real image choice: preview what will be saved, then replace or remove it. */
export function ImagePicker({
  accept,
  currentUrl,
  help,
  label,
  name,
  shape = "landscape",
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [chosenUrl, setChosenUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const visibleUrl = chosenUrl ?? (removed ? null : currentUrl);

  useEffect(
    () => () => {
      if (chosenUrl) URL.revokeObjectURL(chosenUrl);
    },
    [chosenUrl],
  );

  function choose(file?: File) {
    if (chosenUrl) URL.revokeObjectURL(chosenUrl);
    setChosenUrl(file ? URL.createObjectURL(file) : null);
    if (file) setRemoved(false);
  }

  function remove() {
    if (chosenUrl) URL.revokeObjectURL(chosenUrl);
    setChosenUrl(null);
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <Typography type="body-sm" weight="medium">
        {label}
      </Typography>
      <div
        className={`relative grid place-items-center overflow-hidden bg-surface-secondary ${
          shape === "avatar"
            ? "size-28 rounded-full"
            : "aspect-4/3 w-full rounded-xl"
        }`}
      >
        {visibleUrl ? (
          // Blob previews and existing public URLs both need ordinary browser loading.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Selected preview"
            className="size-full object-cover"
            src={visibleUrl}
          />
        ) : (
          <ImagePlus aria-hidden="true" className="size-8 text-muted" />
        )}
      </div>

      <input
        name={`remove-${name}`}
        type="hidden"
        value={removed ? "on" : ""}
      />
      <input
        accept={accept}
        className="sr-only"
        id={`${name}-picker`}
        name={name}
        onChange={(event) => choose(event.currentTarget.files?.[0])}
        ref={inputRef}
        type="file"
      />

      <div className="flex flex-wrap gap-2">
        <label
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-3xl bg-default px-4 text-sm font-medium text-foreground"
          htmlFor={`${name}-picker`}
        >
          <ImagePlus aria-hidden="true" className="size-4" />
          {visibleUrl ? "Replace" : "Choose photo"}
        </label>
        {visibleUrl ? (
          <Button onPress={remove} type="button" variant="ghost">
            <Trash2 aria-hidden="true" className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>
      <Typography color="muted" type="body-xs">
        {help}
      </Typography>
    </div>
  );
}
