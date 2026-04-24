import { createProjectAction } from "@/app/_actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateProjectForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Admins can create projects for assignment and time tracking.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createProjectAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" placeholder="Website redesign" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="Scope, team, notes..." />
          </div>
          <Button type="submit">Create project</Button>
        </form>
      </CardContent>
    </Card>
  );
}
