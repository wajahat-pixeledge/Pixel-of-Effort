import { assignProjectAction } from "@/app/_actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface AssignProjectFormProps {
  projects: Array<{
    id: string;
    name: string;
  }>;
  users: Array<{
    id: string;
    email: string;
  }>;
}

export function AssignProjectForm({ projects, users }: AssignProjectFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign project</CardTitle>
        <CardDescription>Only approved users can receive assignments. Define active dates if needed.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={assignProjectAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <Select id="projectId" name="projectId" required>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="userId">User</Label>
            <Select id="userId" name="userId" required>
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activeFrom">Active from</Label>
            <Input id="activeFrom" name="activeFrom" type="date" defaultValue={today} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activeUntil">Active until (optional)</Label>
            <Input id="activeUntil" name="activeUntil" type="date" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
