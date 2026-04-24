import { redirect } from "next/navigation";

import { getCurrentProfile, getRoleLandingPath } from "@/lib/auth";

export default async function HomePage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/sign-in");
  }

  if (!profile) {
    redirect("/pending");
  }

  redirect(getRoleLandingPath(profile));
}
