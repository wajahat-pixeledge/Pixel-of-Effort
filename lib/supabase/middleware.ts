import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getRoleLandingPath } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

const PUBLIC_PATHS = new Set(["/sign-in", "/auth/callback"]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof response.cookies.set>[2];
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = [...PUBLIC_PATHS].some((path) => pathname.startsWith(path));
  const isStaticPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico");

  if (isStaticPath) {
    return response;
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/sign-in") {
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

    const url = request.nextUrl.clone();
    url.pathname = profile ? getRoleLandingPath(profile) : "/pending";
    return NextResponse.redirect(url);
  }

  return response;
}
