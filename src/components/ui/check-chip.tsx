import { Check } from "lucide-react";

/**
 * A checkbox sized like the rest of the product. The native control stays in the
 * form and keeps its semantics; it is only hidden from view, so the visible chip
 * has to carry the focus ring the input would otherwise show.
 */
export function CheckChip({
  defaultChecked,
  label,
  name,
  value,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm capitalize transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft/50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value={value}
      />
      <span className="grid size-5 shrink-0 place-items-center rounded-md border border-border peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-checked:[&_svg]:opacity-100">
        <Check aria-hidden="true" className="size-3.5 opacity-0" />
      </span>
      {label}
    </label>
  );
}
