"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { toRoute } from "@/lib/routes";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validations/auth";

function withMessage(pathname: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams({ [key]: value });
  return toRoute(`${pathname}?${params.toString()}`);
}

export async function signInWithEmailAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect(withMessage("/sign-in", "error", parsed.error.issues[0]?.message ?? "Invalid email."));
  }

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = getSiteUrl(host, protocol);

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    redirect(withMessage("/sign-in", "error", error.message));
  }

  redirect(
    withMessage(
      "/sign-in",
      "message",
      "Magic link sent. Open your email to continue."
    )
  );
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(toRoute("/sign-in"));
}
