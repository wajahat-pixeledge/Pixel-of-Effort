import { requireApprovedUser } from "@/lib/auth";
import { TIME_ENTRY_CATEGORY_OPTIONS } from "@/lib/constants";
import { TimeEntryForm } from "@/components/forms/time-entry-form";
import { Badge } from "@/components/ui/badge";
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

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(2);
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase, user } = await requireApprovedUser();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  const { data: assignments } = await supabase
    .from("project_assignments")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .lte("active_from", today)
    .or(`active_until.is.null,active_until.gte.${today}`);

  const projectIds = assignments?.map((assignment) => assignment.project_id) ?? [];

  const [projectResult, timeEntryResult] = await Promise.all([
    projectIds.length
      ? supabase
          .from("projects")
          .select("id, name")
          .in("id", projectIds)
          .eq("is_active", true)
          .order("name")
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("time_entries")
      .select("id, work_date, minutes, category, project_id, status_flag, comment, created_at")
      .eq("user_id", user.id)
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30)
  ]);

  if (projectResult.error) {
    throw new Error(projectResult.error.message);
  }

  if (timeEntryResult.error) {
    throw new Error(timeEntryResult.error.message);
  }

  const assignedProjects = projectResult.data ?? [];
  const timeEntries = timeEntryResult.data ?? [];

  const projectNameById = new Map(assignedProjects.map((project) => [project.id, project.name]));
  const totalLoggedMinutes = timeEntries.reduce((sum, entry) => sum + entry.minutes, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Assigned projects</CardDescription>
            <CardTitle className="text-2xl">{assignedProjects.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Recent logged hours</CardDescription>
            <CardTitle className="text-2xl">{formatHours(totalLoggedMinutes)}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-2xl">Approved user</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {readParam(params, "error") ? <Notice type="error" text={readParam(params, "error")!} /> : null}
      {readParam(params, "message") ? (
        <Notice type="message" text={readParam(params, "message")!} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <TimeEntryForm assignedProjects={assignedProjects} />
        <Card>
          <CardHeader>
            <CardTitle>Recent entries</CardTitle>
            <CardDescription>Most recent 30 records</CardDescription>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No time entries yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => {
                    const categoryLabel =
                      TIME_ENTRY_CATEGORY_OPTIONS.find((option) => option.value === entry.category)
                        ?.label ?? entry.category;

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.work_date}</TableCell>
                        <TableCell>{categoryLabel}</TableCell>
                        <TableCell>
                          {entry.project_id ? projectNameById.get(entry.project_id) ?? "Archived" : "-"}
                        </TableCell>
                        <TableCell>{formatHours(entry.minutes)}</TableCell>
                        <TableCell>
                          <Badge variant={entry.status_flag === "blocked" ? "destructive" : "secondary"}>
                            {entry.status_flag ?? "none"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate">{entry.comment ?? "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
