import { PendingButton } from "@/components/ui/pending-button";

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
      <PendingButton className="min-h-11" variant={variant}>
        {label}
      </PendingButton>
    </form>
  );
}
