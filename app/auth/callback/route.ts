import { NextResponse, type NextRequest } from "next/server";

import { getRoleLandingPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");

  let resolvedPath = "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      let { data: profile } = await supabase
        .from("profiles")
        .select("role, access_status")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.rpc("bootstrap_profile_for_current_user");
        const retryResult = await supabase
          .from("profiles")
          .select("role, access_status")
          .eq("id", user.id)
          .maybeSingle();
        profile = retryResult.data ?? null;
      }

      if (profile) {
        resolvedPath = getRoleLandingPath(profile);
      } else {
        resolvedPath = "/pending";
      }
    }
  }

  const finalPath =
    nextPath && nextPath.startsWith("/") && nextPath !== "/sign-in" ? nextPath : resolvedPath;

  const redirectUrl = new URL(finalPath, requestUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
