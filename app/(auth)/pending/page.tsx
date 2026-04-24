import { redirect } from "next/navigation";

import { signOutAction } from "@/app/_actions/auth";
import { requireSignedInProfile } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PendingPage() {
  const { profile } = await requireSignedInProfile();

  if (profile.access_status === "approved") {
    redirect("/dashboard");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Access review in progress</CardTitle>
            <Badge variant={profile.access_status === "rejected" ? "destructive" : "secondary"}>
              {profile.access_status}
            </Badge>
          </div>
          <CardDescription>
            Your account is signed in, but an admin must approve access before you can track time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.access_status === "rejected" ? (
            <p className="text-sm text-muted-foreground">
              Access was marked as rejected. Contact an administrator to request a review.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Access is pending. You will be able to continue as soon as approval is granted.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <form action={signOutAction}>
            <Button variant="outline" type="submit">
              Sign out
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
