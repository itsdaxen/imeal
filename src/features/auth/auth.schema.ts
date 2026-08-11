import { z } from "zod";

// Supabase hashes with bcrypt, which silently truncates beyond 72 bytes.
const password = z.string().min(8, "Use at least 8 characters.").max(72);

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  email: z.email("Enter a valid email address."),
  password,
  displayName: z
    .string()
    .trim()
    .max(80, "Keep the display name under 80 characters.")
    .optional(),
});
