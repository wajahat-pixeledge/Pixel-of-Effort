import type { Metadata } from "next";

import { SignInForm } from "@/components/forms/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in | LOE Tracker"
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const error = readParam(params, "error");
  const message = readParam(params, "message");

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <SignInForm error={error} message={message} />
    </div>
  );
}
