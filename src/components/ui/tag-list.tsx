import { Chip } from "@heroui/react";

type TagListProps = {
  casing?: "capitalize" | "none";
  className?: string;
  label: string;
  tags: ReadonlyArray<string>;
  tone?: "accent" | "neutral";
};

// Takes plain strings rather than a meal-slot union so shared UI stays independent
// of any one feature's domain types.
export function TagList({
  casing = "capitalize",
  className,
  label,
  tags,
  tone = "accent",
}: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={label}
      className={`flex list-none flex-wrap gap-1.5 p-0 ${className ?? ""}`}
    >
      {tags.map((tag) => (
        <li key={tag}>
          <Chip
            className={casing === "capitalize" ? "capitalize" : undefined}
            color={tone === "accent" ? "accent" : "default"}
            size="sm"
            variant="soft"
          >
            {tag}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
