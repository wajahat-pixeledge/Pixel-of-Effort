import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid company email.")
    .max(320, "Email is too long.")
});

export type SignInInput = z.infer<typeof signInSchema>;
