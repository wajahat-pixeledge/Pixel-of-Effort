import { AppShell } from "@/components/layout/app-shell";
import { requireApprovedUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireApprovedUser();

  return <AppShell profile={profile}>{children}</AppShell>;
}
