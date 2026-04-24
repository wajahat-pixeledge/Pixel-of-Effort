import { requireAdmin } from "@/lib/auth";
import { AssignProjectForm } from "@/components/forms/assign-project-form";
import { CreateProjectForm } from "@/components/forms/create-project-form";
import { ProjectManagementRow } from "@/components/forms/project-management-row";
import { setAssignmentStatusAction } from "@/app/_actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AdminProjectsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const [projectsResult, usersResult, assignmentsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, email")
      .eq("access_status", "approved")
      .order("email"),
    supabase
      .from("project_assignments")
      .select("id, project_id, user_id, active_from, active_until, is_active, created_at")
      .order("created_at", { ascending: false })
  ]);

  if (projectsResult.error || usersResult.error || assignmentsResult.error) {
    throw new Error(
      projectsResult.error?.message ??
        usersResult.error?.message ??
        assignmentsResult.error?.message ??
        "Failed to load project data."
    );
  }

  const projects = projectsResult.data ?? [];
  const approvedUsers = usersResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];

  const projectById = new Map(projects.map((project) => [project.id, project.name]));
  const userById = new Map(approvedUsers.map((user) => [user.id, user.email]));

  return (
    <div className="space-y-6">
      {readParam(params, "error") ? <Notice type="error" text={readParam(params, "error")!} /> : null}
      {readParam(params, "message") ? (
        <Notice type="message" text={readParam(params, "message")!} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <CreateProjectForm />
        <AssignProjectForm projects={projects} users={approvedUsers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Current project catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.description ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={project.is_active ? "default" : "secondary"}>
                        {project.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <ProjectManagementRow project={project} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>Project to user mapping</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Active dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned on</TableHead>
                    <TableHead>Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{projectById.get(assignment.project_id) ?? assignment.project_id}</TableCell>
                      <TableCell>{userById.get(assignment.user_id) ?? assignment.user_id}</TableCell>
                      <TableCell>
                        {assignment.active_from}
                        {assignment.active_until ? ` to ${assignment.active_until}` : " onward"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.is_active ? "default" : "secondary"}>
                          {assignment.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(assignment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <form action={setAssignmentStatusAction}>
                          <input type="hidden" name="assignmentId" value={assignment.id} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={assignment.is_active ? "false" : "true"}
                          />
                          <Button type="submit" size="sm" variant="outline">
                            {assignment.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
