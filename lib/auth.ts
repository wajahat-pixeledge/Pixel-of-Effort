import { redirect } from "next/navigation";

import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { toRoute } from "@/lib/routes";

export type AppProfile = Tables<"profiles">;

export function getRoleLandingPath(profile: Pick<AppProfile, "role" | "access_status">) {
  if (profile.access_status !== "approved") {
    return toRoute("/pending");
  }

  if (profile.role === "admin") {
    return toRoute("/admin");
  }

  return toRoute("/dashboard");
}

export async function getCurrentSessionUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function getCurrentProfile() {
  const { supabase, user } = await getCurrentSessionUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.rpc("bootstrap_profile_for_current_user");
    const bootstrapResult = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = bootstrapResult.data ?? null;
  }

  return { supabase, user, profile };
}

export async function requireSignedInProfile() {
  const { supabase, user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/sign-in");
  }

  if (!profile) {
    redirect("/sign-in?error=profile_missing");
  }

  return { supabase, user, profile };
}

export async function requireApprovedUser() {
  const context = await requireSignedInProfile();

  if (context.profile.access_status !== "approved") {
    redirect("/pending");
  }

  return context;
}

export async function requireAdmin() {
  const context = await requireApprovedUser();

  if (context.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return context;
}

export async function ensureAdminOrThrow() {
  const { profile } = await requireApprovedUser();

  if (profile.role !== "admin") {
    throw new Error("Forbidden");
  }
}
