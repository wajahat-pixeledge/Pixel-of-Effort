import { signInWithEmailAction } from "@/app/_actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignInFormProps {
  error?: string;
  message?: string;
}

export function SignInForm({ error, message }: SignInFormProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in with company email</CardTitle>
        <CardDescription>
          Access is controlled by admin approval and optional allowlist rules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signInWithEmailAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <Button type="submit" className="w-full">
            Send magic link
          </Button>
        </form>
        {error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
