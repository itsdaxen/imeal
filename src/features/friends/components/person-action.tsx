import { Button } from "@heroui/react";

type PersonActionProps = {
  action: (formData: FormData) => Promise<void>;
  label: string;
  name: string;
  value: string;
  variant?: "tertiary" | "ghost";
};

export function PersonAction({
  action,
  label,
  name,
  value,
  variant = "tertiary",
}: PersonActionProps) {
  return (
    <form action={action}>
      <input name={name} type="hidden" value={value} />
      <Button size="sm" type="submit" variant={variant}>
        {label}
      </Button>
    </form>
  );
}
