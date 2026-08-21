import type { Metadata } from "next";

import {
  Button,
  Input,
  Label,
  Link,
  TextField,
  Typography,
} from "@heroui/react";

import {
  addStaple,
  removeStaple,
  toggleStaple,
} from "@/features/shopping/shopping.actions";
import { listStaples } from "@/features/shopping/shopping.queries";

export const metadata: Metadata = { title: "Staples" };

export default async function StaplesPage() {
  const staples = await listStaples();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 pt-10 sm:pt-14">
      <header className="flex flex-col gap-2">
        <Typography type="h1" weight="semibold">
          Staples
        </Typography>
        <Typography className="text-muted" type="body-sm">
          Things you buy most weeks. Add them to a list in one step, and pause
          the ones you do not need right now.
        </Typography>
        <Link href="/shopping">Back to shopping</Link>
      </header>

      <form action={addStaple} className="flex flex-wrap items-end gap-3">
        <TextField className="min-w-56 flex-1" isRequired name="name">
          <Label>Add a staple</Label>
          <Input placeholder="Milk" />
        </TextField>
        <Button type="submit" variant="tertiary">
          Add
        </Button>
      </form>

      {staples.length === 0 ? (
        <Typography className="text-muted" type="body">
          No staples yet.
        </Typography>
      ) : (
        <ul className="flex list-none flex-col p-0">
          {staples.map((staple) => (
            <li
              className="flex items-center justify-between border-b border-border/60 py-2.5"
              key={staple.id}
            >
              <span className={staple.active ? undefined : "text-muted"}>
                {staple.name}
                {staple.active ? "" : " · paused"}
              </span>

              <div className="flex items-center gap-2">
                <form action={toggleStaple}>
                  <input name="stapleId" type="hidden" value={staple.id} />
                  <Button size="sm" type="submit" variant="tertiary">
                    {staple.active ? "Pause" : "Resume"}
                  </Button>
                </form>

                <form action={removeStaple}>
                  <input name="stapleId" type="hidden" value={staple.id} />
                  <Button size="sm" type="submit" variant="ghost">
                    Remove
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
