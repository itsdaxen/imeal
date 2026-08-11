import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_KEY: z.string().min(1),
});

export function parseEnv<T extends z.ZodObject>(
  schema: T,
  source: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(source);

  if (!result.success) {
    // Report names and reasons only; the values are secrets.
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    throw new Error(`Invalid environment configuration. ${problems}`);
  }

  return result.data;
}

function memoize<T>(read: () => T): () => T {
  let value: T | undefined;

  return () => (value ??= read());
}

// Next.js only inlines NEXT_PUBLIC_* when each name is referenced literally.
export const publicEnv = memoize(() =>
  parseEnv(publicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }),
);

export const serverEnv = memoize(() => {
  if (typeof window !== "undefined") {
    throw new Error(
      "Server environment variables are not available in the browser.",
    );
  }

  return parseEnv(serverSchema, {
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  });
});
