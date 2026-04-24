import Link from "next/link";

import { signOutAction } from "@/app/_actions/auth";
import type { AppProfile } from "@/lib/auth";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: React.ReactNode;
  profile: AppProfile;
}

export function AppShell({ children, profile }: AppShellProps) {
  const links =
    profile.role === "admin"
      ? [
          { href: "/dashboard", label: "My Time" },
          { href: "/admin", label: "Admin Dashboard" },
          { href: "/admin/projects", label: "Projects" },
          { href: "/admin/users", label: "Users" }
        ]
      : [{ href: "/dashboard", label: "My Time" }];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Pixel Of Effort
            </p>
            <h1 className="text-lg font-semibold text-foreground">Team Time Tracker</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={toRoute(link.href)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/10 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
